import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const reviewClaimSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMMUNITY_VOTING']),
  reviewNotes: z.string().max(2000).optional(),
  approvedAmount: z.number().min(0).max(1000000).optional(),
})

// POST /api/claims/[id]/review - Review claim (admin/validator only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const claimId = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!['ADMIN', 'VALIDATOR'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Access denied. Admin or Validator role required.' },
        { status: 403 }
      )
    }

    // Check if claim exists
    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: { id: true, name: true, walletAddress: true }
        }
      }
    })

    if (!existingClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existingClaim.status)) {
      return NextResponse.json(
        { error: 'Claim cannot be reviewed in current status' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = reviewClaimSchema.parse(body)

    // If approving, ensure approved amount is set
    if (validatedData.status === 'APPROVED' && !validatedData.approvedAmount) {
      return NextResponse.json(
        { error: 'Approved amount is required when approving a claim' },
        { status: 400 }
      )
    }

    // Update claim status
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: validatedData.status,
        reviewNotes: validatedData.reviewNotes,
        approvedAmount: validatedData.approvedAmount,
        reviewedAt: new Date(),
        reviewedBy: userId
      },
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

    // If approved, create treasury transaction for payout
    if (validatedData.status === 'APPROVED' && validatedData.approvedAmount) {
      await prisma.treasuryTransaction.create({
        data: {
          type: 'PAYOUT',
          amount: validatedData.approvedAmount,
          recipient: existingClaim.user.walletAddress,
          description: `Claim payout for ${existingClaim.title}`,
          metadata: {
            claimId: claimId,
            claimTitle: existingClaim.title,
            claimant: existingClaim.user.name || existingClaim.user.walletAddress
          }
        }
      })
    }

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'CLAIM_REVIEW' as any,
      {
        claimId,
        oldStatus: existingClaim.status,
        newStatus: validatedData.status,
        approvedAmount: validatedData.approvedAmount,
        reviewNotes: validatedData.reviewNotes
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

    console.error('Claim review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}