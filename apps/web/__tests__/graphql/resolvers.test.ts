import { GraphQLResolvers } from '../../../src/lib/graphql/resolvers'
import { prisma } from '@safetynet/db'

// Mock the security systems
jest.mock('../../../src/lib/security', () => ({
  getSecuritySystems: jest.fn(() => ({
    auditLogger: {
      logUserAction: jest.fn(),
      logSecurityEvent: jest.fn(),
    },
    fraudDetector: {
      checkForFraud: jest.fn().mockResolvedValue({
        isFraudulent: false,
        riskScore: 0.1,
        reason: ''
      })
    }
  })),
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  claim: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  proposal: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  nFT: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  claimVote: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  proposalVote: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
} as any

describe('GraphQL Resolvers', () => {
  const mockContext = {
    userId: 'user1',
    userRole: 'USER',
    prisma: mockPrisma
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Resolvers', () => {
    it('should resolve user query', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        walletAddress: '0x123',
        membershipStatus: 'ACTIVE'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await GraphQLResolvers.Query.user(
        {},
        { id: 'user1' },
        mockContext
      )

      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: expect.any(Object)
      })
    })

    it('should resolve claims query with pagination', async () => {
      const mockClaims = [
        {
          id: 'claim1',
          title: 'Test Claim',
          status: 'SUBMITTED',
          user: { id: 'user1', name: 'Test User' }
        }
      ]

      mockPrisma.claim.findMany.mockResolvedValue(mockClaims)
      mockPrisma.claim.count.mockResolvedValue(1)

      const result = await GraphQLResolvers.Query.claims(
        {},
        { first: 10, filter: { status: 'SUBMITTED' } },
        mockContext
      )

      expect(result.claims).toEqual(mockClaims)
      expect(result.totalCount).toBe(1)
      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith({
        where: { status: 'SUBMITTED' },
        include: expect.any(Object),
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should resolve proposals query', async () => {
      const mockProposals = [
        {
          id: 'proposal1',
          title: 'Test Proposal',
          status: 'ACTIVE',
          proposer: { id: 'user1', name: 'Test User' }
        }
      ]

      mockPrisma.proposal.findMany.mockResolvedValue(mockProposals)

      const result = await GraphQLResolvers.Query.proposals(
        {},
        { first: 10, filter: { status: 'ACTIVE' } },
        mockContext
      )

      expect(result).toEqual(mockProposals)
      expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: expect.any(Object),
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should resolve NFTs query', async () => {
      const mockNFTs = [
        {
          id: 'nft1',
          name: 'Gold Membership',
          type: 'MEMBERSHIP',
          tier: 'GOLD',
          owner: { id: 'user1', name: 'Test User' }
        }
      ]

      mockPrisma.nFT.findMany.mockResolvedValue(mockNFTs)

      const result = await GraphQLResolvers.Query.nfts(
        {},
        { first: 10, filter: { type: 'MEMBERSHIP' } },
        mockContext
      )

      expect(result).toEqual(mockNFTs)
      expect(mockPrisma.nFT.findMany).toHaveBeenCalledWith({
        where: { type: 'MEMBERSHIP' },
        include: expect.any(Object),
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('Mutation Resolvers', () => {
    it('should create a claim successfully', async () => {
      const mockUser = {
        id: 'user1',
        membershipStatus: 'ACTIVE'
      }

      const mockClaim = {
        id: 'claim2',
        title: 'New Claim',
        description: 'Test description',
        category: 'MEDICAL',
        requestedAmount: 1000,
        userId: 'user1',
        status: 'DRAFT'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.claim.create.mockResolvedValue(mockClaim)

      const input = {
        title: 'New Claim',
        description: 'Test description',
        category: 'MEDICAL',
        requestedAmount: 1000
      }

      const result = await GraphQLResolvers.Mutation.createClaim(
        {},
        { input },
        mockContext
      )

      expect(result).toEqual(mockClaim)
      expect(mockPrisma.claim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...input,
          userId: 'user1',
          status: 'DRAFT'
        }),
        include: expect.any(Object)
      })
    })

    it('should submit a claim', async () => {
      const mockClaim = {
        id: 'claim1',
        userId: 'user1',
        status: 'DRAFT'
      }

      const mockUpdatedClaim = {
        ...mockClaim,
        status: 'SUBMITTED',
        reviewStartedAt: expect.any(Date)
      }

      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim)
      mockPrisma.claim.update.mockResolvedValue(mockUpdatedClaim)

      const result = await GraphQLResolvers.Mutation.submitClaim(
        {},
        { id: 'claim1' },
        mockContext
      )

      expect(result.status).toBe('SUBMITTED')
      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim1' },
        data: {
          status: 'SUBMITTED',
          reviewStartedAt: expect.any(Date)
        },
        include: expect.any(Object)
      })
    })

    it('should vote on a claim', async () => {
      const mockClaim = {
        id: 'claim1',
        status: 'COMMUNITY_VOTING',
        userId: 'user2' // Different user than voter
      }

      const mockUser = {
        id: 'user1',
        membershipStatus: 'ACTIVE'
      }

      const mockVote = {
        id: 'vote1',
        claimId: 'claim1',
        userId: 'user1',
        vote: 'APPROVE',
        justification: 'Good claim'
      }

      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.claimVote.findUnique.mockResolvedValue(null) // No existing vote
      mockPrisma.claimVote.create.mockResolvedValue(mockVote)

      const result = await GraphQLResolvers.Mutation.voteClaim(
        {},
        { claimId: 'claim1', vote: 'APPROVE', justification: 'Good claim' },
        mockContext
      )

      expect(result).toEqual(mockVote)
      expect(mockPrisma.claimVote.create).toHaveBeenCalledWith({
        data: {
          claimId: 'claim1',
          userId: 'user1',
          vote: 'APPROVE',
          justification: 'Good claim'
        },
        include: expect.any(Object)
      })
    })

    it('should create a proposal', async () => {
      const mockUser = {
        id: 'user1',
        membershipStatus: 'ACTIVE'
      }

      const mockProposal = {
        id: 'proposal2',
        title: 'New Proposal',
        description: 'Test proposal',
        type: 'POLICY_CHANGE',
        category: 'Governance',
        proposerId: 'user1',
        status: 'DRAFT'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.proposal.create.mockResolvedValue(mockProposal)

      const input = {
        title: 'New Proposal',
        description: 'Test proposal',
        type: 'POLICY_CHANGE',
        category: 'Governance'
      }

      const result = await GraphQLResolvers.Mutation.createProposal(
        {},
        { input },
        mockContext
      )

      expect(result).toEqual(mockProposal)
      expect(mockPrisma.proposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...input,
          proposerId: 'user1',
          status: 'DRAFT'
        }),
        include: expect.any(Object)
      })
    })

    it('should vote on a proposal', async () => {
      const mockProposal = {
        id: 'proposal1',
        status: 'ACTIVE',
        votingEndDate: new Date(Date.now() + 86400000) // 1 day from now
      }

      const mockUser = {
        id: 'user1',
        membershipStatus: 'ACTIVE',
        nfts: [
          { type: 'GOVERNANCE_TOKEN', metadata: { votingPower: 5 } }
        ]
      }

      const mockVote = {
        id: 'vote2',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'FOR',
        reason: 'Good proposal',
        votingPower: 5
      }

      mockPrisma.proposal.findUnique.mockResolvedValue(mockProposal)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.proposalVote.findUnique.mockResolvedValue(null) // No existing vote
      mockPrisma.proposalVote.create.mockResolvedValue(mockVote)

      const result = await GraphQLResolvers.Mutation.voteProposal(
        {},
        { proposalId: 'proposal1', choice: 'FOR', reason: 'Good proposal' },
        mockContext
      )

      expect(result).toEqual(mockVote)
      expect(mockPrisma.proposalVote.create).toHaveBeenCalledWith({
        data: {
          proposalId: 'proposal1',
          userId: 'user1',
          vote: 'FOR',
          reason: 'Good proposal',
          votingPower: 5
        },
        include: expect.any(Object)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error for unauthenticated user', async () => {
      const unauthenticatedContext = {
        userId: null,
        userRole: null,
        prisma: mockPrisma
      }

      await expect(
        GraphQLResolvers.Mutation.createClaim(
          {},
          { input: { title: 'Test', description: 'Test', category: 'MEDICAL', requestedAmount: 1000 } },
          unauthenticatedContext
        )
      ).rejects.toThrow('Authentication required')
    })

    it('should throw error when voting on own claim', async () => {
      const mockClaim = {
        id: 'claim1',
        userId: 'user1', // Same as current user
        status: 'COMMUNITY_VOTING'
      }

      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim)

      await expect(
        GraphQLResolvers.Mutation.voteClaim(
          {},
          { claimId: 'claim1', vote: 'APPROVE' },
          mockContext
        )
      ).rejects.toThrow('Cannot vote on your own claim')
    })

    it('should throw error for duplicate voting', async () => {
      const mockClaim = {
        id: 'claim1',
        userId: 'user2',
        status: 'COMMUNITY_VOTING'
      }

      const mockUser = {
        id: 'user1',
        membershipStatus: 'ACTIVE'
      }

      const existingVote = {
        id: 'vote1',
        claimId: 'claim1',
        userId: 'user1'
      }

      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.claimVote.findUnique.mockResolvedValue(existingVote) // Existing vote

      await expect(
        GraphQLResolvers.Mutation.voteClaim(
          {},
          { claimId: 'claim1', vote: 'APPROVE' },
          mockContext
        )
      ).rejects.toThrow('You have already voted on this claim')
    })
  })
})