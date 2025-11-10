import { PrismaClient } from '@safetynet/db'
import { getSecuritySystems, performSecurityChecks } from '../security'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

// Scalar types
const DateTimeType = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value: any) => value instanceof Date ? value.toISOString() : value,
  parseValue: (value: any) => new Date(value),
  parseLiteral: (ast: any) => ast.kind === Kind.STRING ? new Date(ast.value) : null,
})

const JSONType = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast: any) => {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value)
      case Kind.OBJECT:
        return ast.fields.reduce((acc: any, field: any) => {
          acc[field.name.value] = JSONType.parseLiteral!(field.value, {})
          return acc
        }, {})
      case Kind.LIST:
        return ast.values.map((value: any) => JSONType.parseLiteral!(value, {}))
      default:
        return null
    }
  },
})

export interface Context {
  prisma: PrismaClient
  userId?: string
  userRole?: string
  ip?: string
}

export const resolvers = {
  DateTime: DateTimeType,
  JSON: JSONType,

  Query: {
    // User queries
    me: async (_: any, __: any, context: Context) => {
      if (!context.userId) return null
      return await context.prisma.user.findUnique({
        where: { id: context.userId }
      })
    },

    user: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.user.findUnique({
        where: { id }
      })
    },

    users: async (_: any, { limit = 50, offset = 0, filter }: any, context: Context) => {
      const where: any = {}
      
      if (filter?.role) where.role = filter.role
      if (filter?.membershipStatus) where.membershipStatus = filter.membershipStatus
      if (filter?.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } }
        ]
      }

      return await context.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      })
    },

    // Claims queries
    claim: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.claim.findUnique({
        where: { id },
        include: {
          user: true,
          votes: { include: { user: true } },
          payout: true
        }
      })
    },

    claims: async (_: any, { limit = 50, offset = 0, filter }: any, context: Context) => {
      const where: any = {}
      
      if (filter?.status) where.status = filter.status
      if (filter?.category) where.category = filter.category
      if (filter?.userId) where.userId = filter.userId
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } }
        ]
      }

      return await context.prisma.claim.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          votes: { include: { user: true } },
          payout: true
        }
      })
    },

    myClaims: async (_: any, __: any, context: Context) => {
      if (!context.userId) return []
      
      return await context.prisma.claim.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          votes: { include: { user: true } },
          payout: true
        }
      })
    },

    // Governance queries
    proposal: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.proposal.findUnique({
        where: { id },
        include: {
          proposer: true,
          executor: true,
          votes: { include: { user: true } }
        }
      })
    },

    proposals: async (_: any, { limit = 50, offset = 0, filter }: any, context: Context) => {
      const where: any = {}
      
      if (filter?.status) where.status = filter.status
      if (filter?.category) where.category = filter.category
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } }
        ]
      }

      return await context.prisma.proposal.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          proposer: true,
          executor: true,
          votes: { include: { user: true } }
        }
      })
    },

    activeProposals: async (_: any, __: any, context: Context) => {
      const now = new Date()
      return await context.prisma.proposal.findMany({
        where: {
          status: 'ACTIVE',
          startTime: { lte: now },
          endTime: { gte: now }
        },
        orderBy: { endTime: 'asc' },
        include: {
          proposer: true,
          votes: { include: { user: true } }
        }
      })
    },

    // NFT queries
    nftTransfer: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.nFTTransfer.findUnique({
        where: { id },
        include: {
          fromUser: true,
          toUser: true
        }
      })
    },

    nftTransfers: async (_: any, { limit = 50, offset = 0, filter }: any, context: Context) => {
      const where: any = {}
      
      if (filter?.transferType) where.transferType = filter.transferType
      if (filter?.tier) where.tier = filter.tier
      if (filter?.userId) {
        where.OR = [
          { fromUserId: filter.userId },
          { toUserId: filter.userId }
        ]
      }

      return await context.prisma.nFTTransfer.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: true,
          toUser: true
        }
      })
    },

    myNFTs: async (_: any, __: any, context: Context) => {
      if (!context.userId) return []
      
      return await context.prisma.nFTTransfer.findMany({
        where: {
          OR: [
            { fromUserId: context.userId },
            { toUserId: context.userId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: true,
          toUser: true
        }
      })
    },

    mintRequest: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.mintRequest.findUnique({
        where: { id },
        include: {
          user: true,
          reviewer: true
        }
      })
    },

    mintRequests: async (_: any, { limit = 50, offset = 0 }: any, context: Context) => {
      return await context.prisma.mintRequest.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          reviewer: true
        }
      })
    },

    // Treasury queries
    payout: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.prisma.payout.findUnique({
        where: { id },
        include: {
          claim: true,
          user: true
        }
      })
    },

    payouts: async (_: any, { limit = 50, offset = 0 }: any, context: Context) => {
      return await context.prisma.payout.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          claim: true,
          user: true
        }
      })
    },

    myPayouts: async (_: any, __: any, context: Context) => {
      if (!context.userId) return []
      
      return await context.prisma.payout.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          claim: true,
          user: true
        }
      })
    },

    // Admin queries
    auditLogs: async (_: any, { limit = 100, offset = 0, filter }: any, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const where: any = {}
      
      if (filter?.userId) where.userId = filter.userId
      if (filter?.action) where.action = filter.action
      if (filter?.level) where.level = filter.level
      if (filter?.resource) where.resource = filter.resource
      if (filter?.startDate || filter?.endDate) {
        where.timestamp = {}
        if (filter.startDate) where.timestamp.gte = filter.startDate
        if (filter.endDate) where.timestamp.lte = filter.endDate
      }

      return await context.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { timestamp: 'desc' }
      })
    },

    alerts: async (_: any, { limit = 50, offset = 0, filter }: any, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const where: any = {}
      
      if (filter?.category) where.category = filter.category
      if (filter?.severity) where.severity = filter.severity
      if (filter?.resolved !== undefined) where.resolved = filter.resolved

      return await context.prisma.alert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { timestamp: 'desc' }
      })
    },

    systemHealth: async (_: any, __: any, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const { monitoring } = getSecuritySystems()
      return await monitoring.getSystemHealth()
    },
  },

  Mutation: {
    // User mutations
    updateProfile: async (_: any, { input }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      await performSecurityChecks(context.userId, 'profile_update', {
        changes: input
      })

      return await context.prisma.user.update({
        where: { id: context.userId },
        data: input
      })
    },

    // Claims mutations
    createClaim: async (_: any, { input }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      const fraudAnalysis = await performSecurityChecks(context.userId, 'claim_create', {
        requestedAmount: input.requestedAmount,
        category: input.category
      })

      if (fraudAnalysis?.autoReject) {
        throw new Error('Claim creation blocked due to security concerns')
      }

      const claim = await context.prisma.claim.create({
        data: {
          ...input,
          userId: context.userId,
          riskScore: fraudAnalysis?.riskScore,
          riskFactors: fraudAnalysis ? JSON.stringify(fraudAnalysis.indicators) : null
        },
        include: {
          user: true,
          votes: { include: { user: true } }
        }
      })

      return claim
    },

    updateClaim: async (_: any, { id, input }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      // Check if user owns the claim
      const existingClaim = await context.prisma.claim.findUnique({
        where: { id }
      })

      if (!existingClaim || existingClaim.userId !== context.userId) {
        throw new Error('Claim not found or access denied')
      }

      if (existingClaim.status !== 'DRAFT') {
        throw new Error('Can only update draft claims')
      }

      return await context.prisma.claim.update({
        where: { id },
        data: input,
        include: {
          user: true,
          votes: { include: { user: true } }
        }
      })
    },

    submitClaim: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      const claim = await context.prisma.claim.findUnique({
        where: { id }
      })

      if (!claim || claim.userId !== context.userId) {
        throw new Error('Claim not found or access denied')
      }

      if (claim.status !== 'DRAFT') {
        throw new Error('Can only submit draft claims')
      }

      return await context.prisma.claim.update({
        where: { id },
        data: { 
          status: 'SUBMITTED',
          reviewStartedAt: new Date()
        },
        include: {
          user: true,
          votes: { include: { user: true } }
        }
      })
    },

    voteClaim: async (_: any, { claimId, vote, justification }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      const claim = await context.prisma.claim.findUnique({
        where: { id: claimId }
      })

      if (!claim || claim.status !== 'COMMUNITY_VOTING') {
        throw new Error('Claim not available for voting')
      }

      // Check if user already voted
      const existingVote = await context.prisma.claimVote.findFirst({
        where: {
          claimId,
          userId: context.userId
        }
      })

      if (existingVote) {
        throw new Error('Already voted on this claim')
      }

      await performSecurityChecks(context.userId, 'claim_vote', {
        claimId,
        vote
      })

      return await context.prisma.claimVote.create({
        data: {
          claimId,
          userId: context.userId,
          vote,
          justification,
          weight: 1 // Could be based on user's stake/tier
        },
        include: {
          claim: { include: { user: true } },
          user: true
        }
      })
    },

    // Governance mutations
    createProposal: async (_: any, { input }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      await performSecurityChecks(context.userId, 'proposal_create', {
        category: input.category
      })

      return await context.prisma.proposal.create({
        data: {
          ...input,
          proposerId: context.userId,
          startTime: input.startTime || new Date(),
          votesFor: 0,
          votesAgainst: 0,
          votesAbstain: 0,
          totalVotes: 0,
          quorumRequired: 100, // Default quorum
          passingThreshold: 50 // 50% threshold
        },
        include: {
          proposer: true,
          votes: { include: { user: true } }
        }
      })
    },

    voteProposal: async (_: any, { proposalId, choice, reason }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      const proposal = await context.prisma.proposal.findUnique({
        where: { id: proposalId }
      })

      if (!proposal || proposal.status !== 'ACTIVE') {
        throw new Error('Proposal not available for voting')
      }

      const now = new Date()
      if (now < proposal.startTime || now > proposal.endTime) {
        throw new Error('Voting period not active')
      }

      // Check if user already voted
      const existingVote = await context.prisma.proposalVote.findFirst({
        where: {
          proposalId,
          userId: context.userId
        }
      })

      if (existingVote) {
        throw new Error('Already voted on this proposal')
      }

      await performSecurityChecks(context.userId, 'proposal_vote', {
        proposalId,
        choice
      })

      return await context.prisma.proposalVote.create({
        data: {
          proposalId,
          userId: context.userId,
          choice,
          reason,
          weight: 1 // Could be based on user's stake/tier
        },
        include: {
          proposal: { include: { proposer: true } },
          user: true
        }
      })
    },

    executeProposal: async (_: any, { id }: { id: string }, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const proposal = await context.prisma.proposal.findUnique({
        where: { id }
      })

      if (!proposal || proposal.status !== 'SUCCEEDED') {
        throw new Error('Proposal not ready for execution')
      }

      return await context.prisma.proposal.update({
        where: { id },
        data: {
          status: 'EXECUTED',
          executionTime: new Date(),
          executorId: context.userId
        },
        include: {
          proposer: true,
          executor: true,
          votes: { include: { user: true } }
        }
      })
    },

    // NFT mutations
    requestMint: async (_: any, { tier }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      // Check if user already has a pending request
      const existingRequest = await context.prisma.mintRequest.findFirst({
        where: {
          userId: context.userId,
          status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] }
        }
      })

      if (existingRequest) {
        throw new Error('Already have a pending mint request')
      }

      return await context.prisma.mintRequest.create({
        data: {
          userId: context.userId,
          tier
        },
        include: {
          user: true
        }
      })
    },

    transferNFT: async (_: any, { tokenId, toUserId }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required')
      }

      // Verify ownership
      const currentOwnership = await context.prisma.nFTTransfer.findFirst({
        where: {
          tokenId,
          toUserId: context.userId
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!currentOwnership) {
        throw new Error('You do not own this NFT')
      }

      return await context.prisma.nFTTransfer.create({
        data: {
          fromUserId: context.userId,
          toUserId,
          tokenId,
          transferType: 'TRANSFER'
        },
        include: {
          fromUser: true,
          toUser: true
        }
      })
    },

    // Admin mutations
    reviewClaim: async (_: any, { id, input }: any, context: Context) => {
      if (context.userRole !== 'ADMIN' && context.userRole !== 'VALIDATOR') {
        throw new Error('Admin or Validator access required')
      }

      const updateData: any = {
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewerId: context.userId,
        reviewCompletedAt: new Date()
      }

      if (input.approvedAmount !== undefined) {
        updateData.approvedAmount = input.approvedAmount
      }

      return await context.prisma.claim.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          votes: { include: { user: true } }
        }
      })
    },

    reviewMintRequest: async (_: any, { id, input }: any, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      return await context.prisma.mintRequest.update({
        where: { id },
        data: {
          status: input.status,
          reviewerId: context.userId,
          rejectionReason: input.rejectionReason
        },
        include: {
          user: true,
          reviewer: true
        }
      })
    },

    suspendUser: async (_: any, { id, reason }: any, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const { auditLogger } = getSecuritySystems()
      
      await auditLogger.logAdminAction(
        context.userId!,
        'USER_SUSPEND' as any,
        'user',
        id,
        { reason }
      )

      return await context.prisma.user.update({
        where: { id },
        data: {
          membershipStatus: 'SUSPENDED'
        }
      })
    },

    resolveAlert: async (_: any, { id }: { id: string }, context: Context) => {
      if (context.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      const { monitoring } = getSecuritySystems()
      await monitoring.resolveAlert(id, context.userId)

      return await context.prisma.alert.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: context.userId
        }
      })
    },
  },

  // Field resolvers
  User: {
    claims: async (parent: any, _: any, context: Context) => {
      return await context.prisma.claim.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    votes: async (parent: any, _: any, context: Context) => {
      return await context.prisma.claimVote.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    proposals: async (parent: any, _: any, context: Context) => {
      return await context.prisma.proposal.findMany({
        where: { proposerId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    nftTokens: async (parent: any, _: any, context: Context) => {
      return await context.prisma.nFTTransfer.findMany({
        where: { toUserId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
  },

  Claim: {
    user: async (parent: any, _: any, context: Context) => {
      return await context.prisma.user.findUnique({
        where: { id: parent.userId }
      })
    },
    votes: async (parent: any, _: any, context: Context) => {
      return await context.prisma.claimVote.findMany({
        where: { claimId: parent.id },
        include: { user: true }
      })
    },
    payout: async (parent: any, _: any, context: Context) => {
      return await context.prisma.payout.findFirst({
        where: { claimId: parent.id }
      })
    },
  },

  Proposal: {
    proposer: async (parent: any, _: any, context: Context) => {
      return await context.prisma.user.findUnique({
        where: { id: parent.proposerId }
      })
    },
    executor: async (parent: any, _: any, context: Context) => {
      if (!parent.executorId) return null
      return await context.prisma.user.findUnique({
        where: { id: parent.executorId }
      })
    },
    votes: async (parent: any, _: any, context: Context) => {
      return await context.prisma.proposalVote.findMany({
        where: { proposalId: parent.id },
        include: { user: true }
      })
    },
  },
}