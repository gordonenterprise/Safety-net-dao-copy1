import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  membershipStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  membershipTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  role: z.enum(['USER', 'VALIDATOR', 'ADMIN']).optional(),
})

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id
    const currentUserId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    // Apply different middleware based on access level
    const middleware = currentUserId 
      ? securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
      : securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    // Different data access based on relationship and role
    const isOwnProfile = currentUserId === targetUserId
    const isAdmin = userRole === 'ADMIN'

    const selectFields = isAdmin || isOwnProfile ? {
      id: true,
      name: true,
      email: true,
      walletAddress: true,
      membershipStatus: true,
      membershipTier: true,
      role: true,
      bio: true,
      avatar: true,
      createdAt: true,
      lastLoginAt: true,
      claims: {
        select: {
          id: true,
          title: true,
          status: true,
          requestedAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      proposals: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      nfts: {
        select: {
          id: true,
          name: true,
          type: true,
          tier: true,
          image: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          claims: true,
          proposals: true,
          nfts: true,
          claimVotes: true,
          proposalVotes: true
        }
      }
    } : {
      id: true,
      name: true,
      walletAddress: true,
      membershipStatus: true,
      membershipTier: true,
      bio: true,
      avatar: true,
      createdAt: true,
      nfts: {
        select: {
          id: true,
          name: true,
          type: true,
          tier: true,
          image: true
        },
        where: {
          type: { in: ['MEMBERSHIP', 'ACHIEVEMENT'] }
        }
      },
      _count: {
        select: {
          proposals: true,
          nfts: true
        }
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: selectFields
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id
    const currentUserId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const isOwnProfile = currentUserId === targetUserId
    const isAdmin = userRole === 'ADMIN'

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData = updateUserSchema.parse(body)

    // Non-admin users can only update certain fields
    if (!isAdmin) {
      const allowedFields = ['name', 'email', 'bio', 'avatar']
      const filteredData = Object.keys(validatedData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = (validatedData as any)[key]
          return obj
        }, {})
      
      validatedData = filteredData as any
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        membershipStatus: true,
        membershipTier: true,
        role: true,
        bio: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      currentUserId,
      'USER_UPDATE' as any,
      {
        targetUserId,
        changes: validatedData,
        isOwnProfile
      }
    )

    return NextResponse.json(updatedUser)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('User PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id
    const currentUserId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse
    
    if (!currentUserId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: targetUserId }
    })

    // Log the action
    await auditLogger.logUserAction(
      currentUserId,
      'USER_DELETE' as any,
      {
        deletedUserId: targetUserId,
        deletedUserWallet: existingUser.walletAddress
      }
    )

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('User DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}