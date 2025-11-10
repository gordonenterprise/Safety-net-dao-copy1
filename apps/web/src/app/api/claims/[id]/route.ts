import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const updateClaimSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.enum(['EMERGENCY', 'MEDICAL', 'PROPERTY', 'INCOME_PROTECTION', 'OTHER']).optional(),
  requestedAmount: z.number().min(1).max(1000000).optional(),
  attachments: z.array(z.string().url()).optional(),
  evidenceNotes: z.string().max(2000).optional(),
})

const reviewClaimSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMMUNITY_VOTING']),
  reviewNotes: z.string().max(2000).optional(),
  approvedAmount: z.number().min(0).max(1000000).optional(),
})

const voteSchema = z.object({
  vote: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']),
  justification: z.string().max(1000).optional(),
})

// GET /api/claims/[id] - Get specific claim
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const claimId = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        files: true,
        votes: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true,
                role: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const canView = (
      userRole === 'ADMIN' ||
      userRole === 'VALIDATOR' ||
      claim.userId === userId ||
      ['COMMUNITY_VOTING', 'APPROVED', 'PAID'].includes(claim.status)
    )

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ claim })

  } catch (error) {
    console.error('Claim GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/claims/[id] - Update claim
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const claimId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if claim exists and user owns it
    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId }
    })

    if (!existingClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (existingClaim.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (existingClaim.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only update draft claims' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateClaimSchema.parse(body)

    // Update claim
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            membershipStatus: true
          }
        },
        votes: true
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'CLAIM_UPDATE' as any,
      {
        claimId,
        changes: validatedData
      }
    )

    return NextResponse.json(updatedClaim)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Claim PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/claims/[id] - Delete claim (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const claimId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if claim exists and user owns it
    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId }
    })

    if (!existingClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (existingClaim.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (existingClaim.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft claims' },
        { status: 400 }
      )
    }

    // Delete claim
    await prisma.claim.delete({
      where: { id: claimId }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'CLAIM_DELETE' as any,
      { claimId }
    )

    return NextResponse.json({ message: 'Claim deleted successfully' })

  } catch (error) {
    console.error('Claim DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}