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

// GET /api/users - Get all users (admin only for full list, public for basic info)
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    // Apply different middleware based on access level
    const middleware = userRole === 'ADMIN' 
      ? securityMiddleware.createMiddleware(securityConfigs.adminAPI)
      : securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const role = searchParams.get('role')

    const where: any = {}
    if (status) where.membershipStatus = status
    if (tier) where.membershipTier = tier
    if (role) where.role = role

    // Different data access based on user role
    const selectFields = userRole === 'ADMIN' ? {
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
      _count: {
        select: {
          claims: true,
          proposals: true,
          nfts: true
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
      createdAt: true
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if wallet address already exists
    if (body.walletAddress) {
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress: body.walletAddress }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this wallet address already exists' },
          { status: 400 }
        )
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        walletAddress: body.walletAddress,
        membershipStatus: validatedData.membershipStatus || 'PENDING',
        membershipTier: validatedData.membershipTier || 'BRONZE',
        role: validatedData.role || 'USER'
      },
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
        createdAt: true
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'USER_CREATE' as any,
      {
        createdUserId: user.id,
        walletAddress: user.walletAddress,
        role: user.role
      }
    )

    return NextResponse.json(user, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('User POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}