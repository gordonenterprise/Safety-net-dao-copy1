'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { 
  calculateVotingPower, 
  canCreateProposal, 
  calculateQuorum,
  calculateProposalOutcome,
  awardGovernanceTokens
} from '@/lib/voting-power'

// Validation schemas
const proposalSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  category: z.enum(['TREASURY', 'GOVERNANCE', 'MEMBERSHIP', 'CLAIMS', 'TECHNICAL']),
  discussionUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(5),
  startTime: z.date(),
  endTime: z.date(),
  quorumRequired: z.number().min(10).max(90), // 10-90%
  votingThreshold: z.number().min(50).max(90), // 50-90%
  executable: z.boolean().default(false)
})

const voteSchema = z.object({
  proposalId: z.string(),
  vote: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  reason: z.string().max(1000).optional()
})

const delegationSchema = z.object({
  delegateId: z.string(),
  scope: z.enum(['ALL', 'TREASURY', 'GOVERNANCE', 'MEMBERSHIP', 'CLAIMS']),
  expiresAt: z.date().optional()
})

type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new governance proposal
 */
export async function createProposal(
  userId: string,
  data: z.infer<typeof proposalSchema>
): Promise<ActionResponse<{ proposalId: string }>> {
  try {
    // Validate input
    const validatedData = proposalSchema.parse(data)

    // Check if user can create proposals
    const canCreate = await canCreateProposal(userId)
    if (!canCreate.canCreate) {
      return { success: false, error: canCreate.reason }
    }

    // Validate timing
    if (validatedData.endTime <= validatedData.startTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    if (validatedData.startTime < new Date()) {
      return { success: false, error: 'Start time must be in the future' }
    }

    // Create proposal
    const proposal = await db.proposal.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        proposerId: userId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        quorumRequired: validatedData.quorumRequired,
        votingThreshold: validatedData.votingThreshold,
        discussionUrl: validatedData.discussionUrl,
        tags: validatedData.tags,
        executable: validatedData.executable,
        status: validatedData.startTime <= new Date() ? 'ACTIVE' : 'DRAFT'
      }
    })

    // Award tokens for proposal creation
    await awardGovernanceTokens(userId, 1000n, 'BONUS') // 1000 tokens for creating proposal

    console.log(`Proposal created: ${proposal.id} by ${userId}`)

    revalidatePath('/governance')
    revalidatePath('/governance/proposals')

    return {
      success: true,
      data: { proposalId: proposal.id }
    }

  } catch (error) {
    console.error('Create proposal failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to create proposal' }
  }
}

/**
 * Cast a vote on a proposal
 */
export async function castVote(
  userId: string,
  data: z.infer<typeof voteSchema>
): Promise<ActionResponse> {
  try {
    const validatedData = voteSchema.parse(data)

    // Get proposal and validate it's active
    const proposal = await db.proposal.findUnique({
      where: { id: validatedData.proposalId }
    })

    if (!proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    if (proposal.status !== 'ACTIVE') {
      return { success: false, error: 'Proposal is not active for voting' }
    }

    const now = new Date()
    if (now < proposal.startTime || now > proposal.endTime) {
      return { success: false, error: 'Voting period has ended or not started' }
    }

    // Calculate user's voting power
    const { totalPower, eligibleToVote } = await calculateVotingPower(userId)

    if (!eligibleToVote) {
      return { success: false, error: 'You are not eligible to vote' }
    }

    // Check if user already voted
    const existingVote = await db.proposalVote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId: validatedData.proposalId,
          voterId: userId
        }
      }
    })

    if (existingVote) {
      return { success: false, error: 'You have already voted on this proposal' }
    }

    // Cast vote
    await db.proposalVote.create({
      data: {
        proposalId: validatedData.proposalId,
        voterId: userId,
        vote: validatedData.vote,
        votingPower: totalPower,
        reason: validatedData.reason
      }
    })

    // Update proposal vote counts
    const updateData: any = { totalVotes: { increment: 1 } }
    if (validatedData.vote === 'FOR') {
      updateData.forVotes = { increment: totalPower }
    } else if (validatedData.vote === 'AGAINST') {
      updateData.againstVotes = { increment: totalPower }
    } else {
      updateData.abstainVotes = { increment: totalPower }
    }

    await db.proposal.update({
      where: { id: validatedData.proposalId },
      data: updateData
    })

    // Award tokens for voting participation
    await awardGovernanceTokens(userId, 100n, 'VOTING') // 100 tokens for voting

    // Check if proposal should be finalized (e.g., if enough votes)
    await checkProposalFinalization(validatedData.proposalId)

    console.log(`Vote cast: ${validatedData.vote} on ${validatedData.proposalId} by ${userId}`)

    revalidatePath(`/governance/proposals/${validatedData.proposalId}`)
    revalidatePath('/governance')

    return { success: true }

  } catch (error) {
    console.error('Cast vote failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to cast vote' }
  }
}

/**
 * Delegate voting power to another user
 */
export async function delegateVotingPower(
  userId: string,
  data: z.infer<typeof delegationSchema>
): Promise<ActionResponse> {
  try {
    const validatedData = delegationSchema.parse(data)

    if (userId === validatedData.delegateId) {
      return { success: false, error: 'Cannot delegate to yourself' }
    }

    // Check if delegate exists and is eligible
    const delegate = await db.user.findUnique({
      where: { id: validatedData.delegateId }
    })

    if (!delegate || delegate.membershipStatus !== 'ACTIVE') {
      return { success: false, error: 'Delegate must be an active member' }
    }

    // Calculate delegator's voting power
    const { totalPower, eligibleToVote } = await calculateVotingPower(userId)

    if (!eligibleToVote) {
      return { success: false, error: 'You must have voting power to delegate' }
    }

    // Remove existing delegation if any
    await db.delegation.updateMany({
      where: { delegatorId: userId },
      data: { active: false }
    })

    // Create new delegation
    await db.delegation.create({
      data: {
        delegatorId: userId,
        delegateId: validatedData.delegateId,
        votingPower: totalPower,
        scope: validatedData.scope,
        expiresAt: validatedData.expiresAt,
        active: true
      }
    })

    console.log(`Voting power delegated: ${userId} -> ${validatedData.delegateId}`)

    revalidatePath('/governance/delegates')

    return { success: true }

  } catch (error) {
    console.error('Delegate voting power failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to delegate voting power' }
  }
}

/**
 * Revoke delegation
 */
export async function revokeDelegation(userId: string): Promise<ActionResponse> {
  try {
    await db.delegation.updateMany({
      where: { 
        delegatorId: userId,
        active: true
      },
      data: { active: false }
    })

    revalidatePath('/governance/delegates')

    return { success: true }

  } catch (error) {
    console.error('Revoke delegation failed:', error)
    return { success: false, error: 'Failed to revoke delegation' }
  }
}

/**
 * Execute a passed proposal (admin only)
 */
export async function executeProposal(
  proposalId: string,
  executorId: string
): Promise<ActionResponse> {
  try {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal) {
      return { success: false, error: 'Proposal not found' }
    }

    if (proposal.status !== 'SUCCEEDED') {
      return { success: false, error: 'Only succeeded proposals can be executed' }
    }

    if (!proposal.executable) {
      return { success: false, error: 'This proposal is not executable' }
    }

    // Verify executor has permission
    const executor = await db.user.findUnique({
      where: { id: executorId }
    })

    if (!executor || executor.role !== 'ADMIN') {
      return { success: false, error: 'Only admins can execute proposals' }
    }

    // Update proposal as executed
    await db.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executorId
      }
    })

    // TODO: Implement actual execution logic based on proposal category
    // This would involve calling smart contracts, updating system settings, etc.

    console.log(`Proposal executed: ${proposalId} by ${executorId}`)

    revalidatePath(`/governance/proposals/${proposalId}`)
    revalidatePath('/governance')

    return { success: true }

  } catch (error) {
    console.error('Execute proposal failed:', error)
    return { success: false, error: 'Failed to execute proposal' }
  }
}

/**
 * Get proposals with filtering and pagination
 */
export async function getProposals(
  status?: string,
  category?: string,
  page: number = 1,
  limit: number = 10
): Promise<ActionResponse<{ proposals: any[]; total: number }>> {
  try {
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (category && category !== 'ALL') {
      where.category = category
    }

    const offset = (page - 1) * limit

    const [proposals, total] = await Promise.all([
      db.proposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          proposer: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          },
          votes: {
            include: {
              voter: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),
      db.proposal.count({ where })
    ])

    return {
      success: true,
      data: { proposals, total }
    }

  } catch (error) {
    console.error('Get proposals failed:', error)
    return { success: false, error: 'Failed to fetch proposals' }
  }
}

/**
 * Get user's voting history
 */
export async function getUserVotingHistory(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ActionResponse<{ votes: any[]; total: number }>> {
  try {
    const offset = (page - 1) * limit

    const [votes, total] = await Promise.all([
      db.proposalVote.findMany({
        where: { voterId: userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
              endTime: true
            }
          }
        }
      }),
      db.proposalVote.count({ where: { voterId: userId } })
    ])

    return {
      success: true,
      data: { votes, total }
    }

  } catch (error) {
    console.error('Get voting history failed:', error)
    return { success: false, error: 'Failed to fetch voting history' }
  }
}

/**
 * Check if proposal should be finalized based on vote completion
 */
async function checkProposalFinalization(proposalId: string): Promise<void> {
  try {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal || proposal.status !== 'ACTIVE') return

    // Check if voting period has ended
    const now = new Date()
    if (now <= proposal.endTime) return

    // Get quorum and calculate outcome
    const quorumData = await calculateQuorum(proposalId)
    
    const outcome = calculateProposalOutcome(
      proposal.forVotes,
      proposal.againstVotes,
      proposal.abstainVotes,
      proposal.quorumRequired,
      proposal.votingThreshold,
      quorumData.totalVotingPower
    )

    // Update proposal status
    const newStatus = outcome.outcome === 'PASSED' ? 'SUCCEEDED' : 'DEFEATED'
    
    await db.proposal.update({
      where: { id: proposalId },
      data: { status: newStatus }
    })

    console.log(`Proposal finalized: ${proposalId} -> ${newStatus}`)

  } catch (error) {
    console.error('Check proposal finalization failed:', error)
  }
}