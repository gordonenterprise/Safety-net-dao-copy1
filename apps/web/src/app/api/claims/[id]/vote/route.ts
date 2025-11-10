import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const voteSchema = z.object({
  type: z.enum(['APPROVE', 'DENY']),
  reason: z.string().optional(),
})

// GET /api/claims/[id]/vote - Get user's vote on claim
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
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.claimVote.findUnique({
      where: {
        claimId_userId: {
          claimId,
          userId
        }
      }
    })

    if (!existingVote) {
      return NextResponse.json(
        { voted: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      voted: true,
      vote: existingVote.vote,
      justification: existingVote.justification,
      votedAt: existingVote.createdAt
    })

  } catch (error) {
    console.error('Vote GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/claims/[id]/vote - Vote on claim
export async function POST(
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

    // Check if claim exists and is in voting status
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: { select: { id: true } }
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (claim.status !== 'COMMUNITY_VOTING') {
      return NextResponse.json(
        { error: 'Claim is not open for voting' },
        { status: 400 }
      )
    }

    // Users cannot vote on their own claims
    if (claim.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot vote on your own claim' },
        { status: 400 }
      )
    }

    // Check if user is eligible to vote (active member)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active members can vote' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = voteSchema.parse(body)

    // Map frontend type to database format
    const voteType = validatedData.type === 'APPROVE' ? 'APPROVE' : 'REJECT'

    // Check if user has already voted
    const existingVote = await prisma.claimVote.findUnique({
      where: {
        claimId_userId: {
          claimId,
          userId
        }
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this claim' },
        { status: 400 }
      )
    }

    // Create vote
    const vote = await prisma.claimVote.create({
      data: {
        claimId,
        userId,
        vote: voteType,
        justification: validatedData.reason
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    // Check if we need to finalize voting
    await checkAndFinalizeVoting(claimId)

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'CLAIM_VOTE' as any,
      {
        claimId,
        vote: voteType,
        justification: validatedData.reason
      }
    )

    return NextResponse.json(vote)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Vote POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check and finalize voting
async function checkAndFinalizeVoting(claimId: string) {
  try {
    // Get total active members
    const activeMembersCount = await prisma.user.count({
      where: { membershipStatus: 'ACTIVE' }
    })

    // Get votes for this claim
    const votes = await prisma.claimVote.findMany({
      where: { claimId }
    })

    // Check if we have reached voting threshold (e.g., 60% of active members)
    const votingThreshold = Math.ceil(activeMembersCount * 0.6)
    
    if (votes.length >= votingThreshold) {
      // Count votes
      const approveVotes = votes.filter(v => v.vote === 'APPROVE').length
      const rejectVotes = votes.filter(v => v.vote === 'REJECT').length
      const abstainVotes = votes.filter(v => v.vote === 'ABSTAIN').length

      // Determine outcome (simple majority of non-abstain votes)
      const totalDecisionVotes = approveVotes + rejectVotes
      const finalStatus = approveVotes > rejectVotes ? 'APPROVED' : 'REJECTED'

      // Update claim status
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: finalStatus,
          votingClosedAt: new Date(),
          approvedAmount: finalStatus === 'APPROVED' ? 
            await prisma.claim.findUnique({ where: { id: claimId } }).then(c => c?.requestedAmount) : 
            undefined
        }
      })

      // If approved, create treasury transaction
      if (finalStatus === 'APPROVED') {
        const claim = await prisma.claim.findUnique({
          where: { id: claimId },
          include: { user: true }
        })

        if (claim && claim.requestedAmount) {
          await prisma.treasuryTransaction.create({
            data: {
              type: 'PAYOUT',
              amount: claim.requestedAmount,
              recipient: claim.user.walletAddress,
              description: `Community-approved claim payout for ${claim.title}`,
              metadata: {
                claimId: claimId,
                claimTitle: claim.title,
                claimant: claim.user.name || claim.user.walletAddress,
                votingResults: {
                  approve: approveVotes,
                  reject: rejectVotes,
                  abstain: abstainVotes,
                  totalVotes: votes.length
                }
              }
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error finalizing voting:', error)
  }
}