import { db } from '@/lib/db'

// Voting power calculation based on membership tier and participation
export interface VotingPowerFactors {
  baseTokens: bigint
  membershipMultiplier: number
  tenureMultiplier: number
  participationMultiplier: number
  delegatedPower: bigint
}

export interface VotingPowerResult {
  totalPower: bigint
  factors: VotingPowerFactors
  eligibleToVote: boolean
}

/**
 * Calculate a user's voting power for governance proposals
 */
export async function calculateVotingPower(userId: string): Promise<VotingPowerResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      governanceToken: true,
      receivedDelegation: {
        where: { active: true },
        include: {
          delegator: {
            include: { governanceToken: true }
          }
        }
      },
      claims: {
        where: { status: 'PAID' },
        select: { id: true }
      }
    }
  })

  if (!user) {
    return {
      totalPower: 0n,
      factors: {
        baseTokens: 0n,
        membershipMultiplier: 0,
        tenureMultiplier: 0,
        participationMultiplier: 0,
        delegatedPower: 0n
      },
      eligibleToVote: false
    }
  }

  // Base governance tokens
  const baseTokens = user.governanceToken?.balance || 0n

  // Membership tier multiplier (based on NFT)
  const membershipMultiplier = getMembershipMultiplier(user.membershipNftTokenId)

  // Tenure multiplier (longer membership = more power)
  const tenureMultiplier = getTenureMultiplier(user.joinedAt)

  // Participation multiplier (successful claims boost voting power)
  const participationMultiplier = getParticipationMultiplier(user.claims.length)

  // Calculate delegated power
  const delegatedPower = user.receivedDelegation.reduce((total, delegation) => {
    const delegatorTokens = delegation.delegator.governanceToken?.balance || 0n
    return total + delegatorTokens
  }, 0n)

  // Calculate total voting power
  const ownPower = BigInt(
    Math.floor(
      Number(baseTokens) * 
      membershipMultiplier * 
      tenureMultiplier * 
      participationMultiplier
    )
  )

  const totalPower = ownPower + delegatedPower

  // Check eligibility (must have active membership and some voting power)
  const eligibleToVote = user.membershipStatus === 'ACTIVE' && totalPower > 0n

  return {
    totalPower,
    factors: {
      baseTokens,
      membershipMultiplier,
      tenureMultiplier,
      participationMultiplier,
      delegatedPower
    },
    eligibleToVote
  }
}

/**
 * Get membership tier multiplier based on NFT token ID
 */
function getMembershipMultiplier(tokenId?: string | null): number {
  if (!tokenId) return 1.0

  // Token ID ranges determine tiers (example ranges)
  const id = parseInt(tokenId)
  
  if (id >= 1 && id <= 100) return 3.0      // Founder tier
  if (id >= 101 && id <= 1000) return 2.0   // Early adopter tier
  if (id >= 1001 && id <= 5000) return 1.5  // Premium tier
  
  return 1.0 // Standard tier
}

/**
 * Get tenure multiplier based on membership length
 */
function getTenureMultiplier(joinedAt: Date): number {
  const now = new Date()
  const monthsActive = Math.floor(
    (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  // Gradually increase voting power over time
  if (monthsActive >= 24) return 2.0  // 2+ years
  if (monthsActive >= 12) return 1.5  // 1+ year
  if (monthsActive >= 6) return 1.25  // 6+ months
  if (monthsActive >= 3) return 1.1   // 3+ months
  
  return 1.0 // New members
}

/**
 * Get participation multiplier based on successful claims
 */
function getParticipationMultiplier(successfulClaims: number): number {
  // Reward active participants
  if (successfulClaims >= 10) return 1.3
  if (successfulClaims >= 5) return 1.2
  if (successfulClaims >= 2) return 1.1
  
  return 1.0
}

/**
 * Check if user can create proposals
 */
export async function canCreateProposal(userId: string): Promise<{
  canCreate: boolean
  reason?: string
  minimumPowerNeeded?: bigint
}> {
  const { totalPower, eligibleToVote } = await calculateVotingPower(userId)
  
  if (!eligibleToVote) {
    return {
      canCreate: false,
      reason: 'Must have active membership and voting power'
    }
  }

  // Minimum voting power threshold for proposal creation
  const PROPOSAL_THRESHOLD = 10000n // 10,000 tokens minimum

  if (totalPower < PROPOSAL_THRESHOLD) {
    return {
      canCreate: false,
      reason: 'Insufficient voting power',
      minimumPowerNeeded: PROPOSAL_THRESHOLD
    }
  }

  return { canCreate: true }
}

/**
 * Calculate quorum for a proposal
 */
export async function calculateQuorum(proposalId: string): Promise<{
  totalEligibleVoters: number
  totalVotingPower: bigint
  currentVotes: number
  currentVotingPower: bigint
  quorumMet: boolean
  participationRate: number
}> {
  // Get all active members with voting power
  const eligibleVoters = await db.user.findMany({
    where: {
      membershipStatus: 'ACTIVE',
      governanceToken: {
        balance: { gt: 0 }
      }
    },
    include: {
      governanceToken: true
    }
  })

  const totalVotingPower = eligibleVoters.reduce((total, user) => {
    return total + (user.governanceToken?.balance || 0n)
  }, 0n)

  // Get current votes for this proposal
  const currentVotes = await db.proposalVote.findMany({
    where: { proposalId },
    include: { voter: { include: { governanceToken: true } } }
  })

  const currentVotingPower = currentVotes.reduce((total, vote) => {
    return total + vote.votingPower
  }, 0n)

  // Get proposal quorum requirement
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: { quorumRequired: true }
  })

  const quorumThreshold = BigInt(
    Math.floor(Number(totalVotingPower) * (proposal?.quorumRequired || 30) / 100)
  )

  return {
    totalEligibleVoters: eligibleVoters.length,
    totalVotingPower,
    currentVotes: currentVotes.length,
    currentVotingPower,
    quorumMet: currentVotingPower >= quorumThreshold,
    participationRate: eligibleVoters.length > 0 ? 
      (currentVotes.length / eligibleVoters.length) * 100 : 0
  }
}

/**
 * Award governance tokens for participation
 */
export async function awardGovernanceTokens(
  userId: string,
  amount: bigint,
  reason: 'CLAIM' | 'VOTING' | 'STAKING' | 'BONUS'
): Promise<void> {
  await db.governanceToken.upsert({
    where: { userId },
    create: {
      userId,
      balance: amount,
      ...(reason === 'CLAIM' && { earnedFromClaims: amount }),
      ...(reason === 'VOTING' && { earnedFromVoting: amount }),
      ...(reason === 'STAKING' && { earnedFromStaking: amount }),
    },
    update: {
      balance: { increment: amount },
      ...(reason === 'CLAIM' && { earnedFromClaims: { increment: amount } }),
      ...(reason === 'VOTING' && { earnedFromVoting: { increment: amount } }),
      ...(reason === 'STAKING' && { earnedFromStaking: { increment: amount } }),
      lastUpdated: new Date()
    }
  })
}

/**
 * Calculate proposal outcome
 */
export function calculateProposalOutcome(
  forVotes: bigint,
  againstVotes: bigint,
  abstainVotes: bigint,
  quorumRequired: number,
  votingThreshold: number,
  totalVotingPower: bigint
): {
  outcome: 'PASSED' | 'FAILED' | 'PENDING'
  reason: string
  quorumMet: boolean
  thresholdMet: boolean
} {
  const totalVotes = forVotes + againstVotes + abstainVotes
  const quorumNeeded = BigInt(Math.floor(Number(totalVotingPower) * quorumRequired / 100))
  const quorumMet = totalVotes >= quorumNeeded

  if (!quorumMet) {
    return {
      outcome: 'FAILED',
      reason: 'Quorum not met',
      quorumMet: false,
      thresholdMet: false
    }
  }

  const participatingVotes = forVotes + againstVotes // Exclude abstains from threshold calc
  const thresholdNeeded = BigInt(Math.floor(Number(participatingVotes) * votingThreshold / 100))
  const thresholdMet = forVotes >= thresholdNeeded

  if (thresholdMet) {
    return {
      outcome: 'PASSED',
      reason: 'Majority support achieved',
      quorumMet: true,
      thresholdMet: true
    }
  }

  return {
    outcome: 'FAILED',
    reason: 'Insufficient support',
    quorumMet: true,
    thresholdMet: false
  }
}