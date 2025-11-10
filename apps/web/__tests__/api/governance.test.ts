import { NextRequest } from 'next/server'
import { GET, POST } from '../../../src/app/api/governance/route'
import { prisma } from '@safetynet/db'

// Mock the security middleware
jest.mock('../../../src/lib/security/middleware', () => ({
  SecurityMiddleware: jest.fn().mockImplementation(() => ({
    createMiddleware: jest.fn(() => 
      jest.fn().mockResolvedValue(new Response('OK', { status: 200 }))
    )
  })),
  securityConfigs: {
    publicAPI: {},
    authenticatedAPI: {},
    adminAPI: {}
  }
}))

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
  performSecurityChecks: jest.fn()
}))

describe('/api/governance API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/governance', () => {
    it('should return proposals with pagination and vote counts', async () => {
      const mockProposals = [
        {
          id: 'proposal1',
          title: 'Test Proposal',
          status: 'ACTIVE',
          proposer: { id: 'user1', name: 'Test User', walletAddress: '0x123' },
          votes: [
            { vote: 'FOR', user: { id: 'user2', name: 'Voter' } }
          ],
          _count: { votes: 1 }
        }
      ]

      ;(prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals)
      ;(prisma.proposal.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/governance?page=1&limit=10')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.proposals).toEqual(mockProposals)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })

    it('should filter proposals by status and type', async () => {
      const request = new NextRequest('http://localhost:3000/api/governance?status=ACTIVE&type=POLICY_CHANGE')

      ;(prisma.proposal.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.proposal.count as jest.Mock).mockResolvedValue(0)

      await GET(request)

      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            type: 'POLICY_CHANGE'
          })
        })
      )
    })
  })

  describe('POST /api/governance', () => {
    it('should create a new proposal successfully', async () => {
      const newProposal = {
        id: 'proposal2',
        title: 'New Proposal',
        description: 'Test proposal description',
        type: 'POLICY_CHANGE',
        category: 'Governance',
        status: 'DRAFT',
        proposerId: 'user1'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        membershipStatus: 'ACTIVE'
      })
      ;(prisma.proposal.create as jest.Mock).mockResolvedValue(newProposal)

      const request = new NextRequest('http://localhost:3000/api/governance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Proposal',
          description: 'Test proposal description',
          type: 'POLICY_CHANGE',
          category: 'Governance',
          proposedChanges: { maxClaimAmount: 10000 }
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Proposal')
      expect(prisma.proposal.create).toHaveBeenCalled()
    })

    it('should reject proposal creation for inactive users', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        membershipStatus: 'SUSPENDED'
      })

      const request = new NextRequest('http://localhost:3000/api/governance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Proposal',
          description: 'Test proposal description',
          type: 'POLICY_CHANGE',
          category: 'Governance'
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('active members')
    })

    it('should validate proposal data', async () => {
      const request = new NextRequest('http://localhost:3000/api/governance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'A', // Too short
          description: 'Short', // Too short
          type: 'INVALID_TYPE', // Invalid enum
          category: '', // Required field missing
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should trigger fraud detection for suspicious proposals', async () => {
      // Mock fraud detection to return suspicious result
      const { getSecuritySystems } = require('../../../src/lib/security')
      const fraudDetector = getSecuritySystems().fraudDetector
      fraudDetector.checkForFraud.mockResolvedValueOnce({
        isFraudulent: true,
        riskScore: 0.9,
        reason: 'Suspicious proposal pattern'
      })

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        membershipStatus: 'ACTIVE'
      })

      const request = new NextRequest('http://localhost:3000/api/governance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Suspicious Proposal',
          description: 'This proposal seems fraudulent for testing purposes',
          type: 'TREASURY_ALLOCATION',
          category: 'Treasury'
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Security check failed')
    })
  })
})