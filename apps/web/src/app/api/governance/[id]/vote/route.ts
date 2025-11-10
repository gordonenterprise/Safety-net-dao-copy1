import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const voteProposalSchema = z.object({
  vote: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  reason: z.string().max(1000).optional(),
  votingPower: z.number().min(0).optional(),
})

// GET /api/governance/[id]/vote - Get user's vote on proposal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const proposalId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.proposalVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
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
      reason: existingVote.reason,
      votingPower: existingVote.votingPower,
      votedAt: existingVote.createdAt
    })

  } catch (error) {
    console.error('Proposal vote GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/governance/[id]/vote - Vote on proposal
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const proposalId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if proposal exists and is in voting status
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: { select: { id: true } }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Proposal is not open for voting' },
        { status: 400 }
      )
    }

    // Check if voting period has ended
    if (proposal.votingEndDate && new Date() > proposal.votingEndDate) {
      return NextResponse.json(
        { error: 'Voting period has ended' },
        { status: 400 }
      )
    }

    // Check if user is eligible to vote (active member)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nfts: {
          where: { type: 'GOVERNANCE_TOKEN' }
        }
      }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active members can vote' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = voteProposalSchema.parse(body)

    // Calculate voting power (based on governance tokens or membership tier)
    let votingPower = validatedData.votingPower || 1
    
    // If user has governance NFTs, calculate voting power
    if (user.nfts.length > 0) {
      votingPower = user.nfts.reduce((power, nft) => {
        const metadata = nft.metadata as any
        return power + (metadata?.votingPower || 1)
      }, 0)
    }

    // Check if user has already voted
    const existingVote = await prisma.proposalVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId
        }
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this proposal' },
        { status: 400 }
      )
    }

    // Create vote
    const vote = await prisma.proposalVote.create({
      data: {
        proposalId,
        userId,
        vote: validatedData.vote,
        reason: validatedData.reason,
        votingPower
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

    // Check if we need to finalize voting
    await checkAndFinalizeVoting(proposalId)

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'PROPOSAL_VOTE' as any,
      {
        proposalId,
        vote: validatedData.vote,
        reason: validatedData.reason,
        votingPower
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

    console.error('Proposal vote POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check and finalize voting
async function checkAndFinalizeVoting(proposalId: string) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        votes: true
      }
    })

    if (!proposal) return

    // Get total active members and their voting power
    const activeMembers = await prisma.user.findMany({
      where: { membershipStatus: 'ACTIVE' },
      include: {
        nfts: {
          where: { type: 'GOVERNANCE_TOKEN' }
        }
      }
    })

    const totalVotingPower = activeMembers.reduce((total, member) => {
      if (member.nfts.length > 0) {
        return total + member.nfts.reduce((power, nft) => {
          const metadata = nft.metadata as any
          return power + (metadata?.votingPower || 1)
        }, 0)
      }
      return total + 1
    }, 0)

    // Check if quorum is reached
    const currentVotingPower = proposal.votes.reduce((sum, v) => sum + (v.votingPower || 1), 0)
    const quorumReached = currentVotingPower >= (totalVotingPower * proposal.requiredQuorum)

    // Check if voting period has ended
    const votingEnded = proposal.votingEndDate && new Date() > proposal.votingEndDate

    if (quorumReached || votingEnded) {
      // Count votes by voting power
      const forVotes = proposal.votes.filter(v => v.vote === 'FOR').reduce((sum, v) => sum + (v.votingPower || 1), 0)
      const againstVotes = proposal.votes.filter(v => v.vote === 'AGAINST').reduce((sum, v) => sum + (v.votingPower || 1), 0)
      const abstainVotes = proposal.votes.filter(v => v.vote === 'ABSTAIN').reduce((sum, v) => sum + (v.votingPower || 1), 0)

      // Determine outcome (simple majority of non-abstain votes)
      const finalStatus = forVotes > againstVotes ? 'PASSED' : 'REJECTED'

      // Update proposal status
      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: finalStatus,
          votingClosedAt: new Date(),
          finalVoteCount: {
            for: forVotes,
            against: againstVotes,
            abstain: abstainVotes,
            totalVotingPower: currentVotingPower,
            quorumReached
          }
        }
      })

      // If proposal passed and has implementation changes, you could trigger them here
      if (finalStatus === 'PASSED' && proposal.proposedChanges) {
        // Implementation logic for approved proposals
        await implementProposalChanges(proposal)
      }
    }
  } catch (error) {
    console.error('Error finalizing voting:', error)
  }
}

// Helper function to implement proposal changes
async function implementProposalChanges(proposal: any) {
  try {
    // This would contain logic to implement the approved proposal changes
    // For example, updating DAO parameters, treasury allocations, etc.
    console.log(`Implementing changes for proposal ${proposal.id}:`, proposal.proposedChanges)
    
    // Log the implementation
    await auditLogger.logSystemEvent('PROPOSAL_IMPLEMENTED', {
      proposalId: proposal.id,
      changes: proposal.proposedChanges
    })
  } catch (error) {
    console.error('Error implementing proposal changes:', error)
  }
}