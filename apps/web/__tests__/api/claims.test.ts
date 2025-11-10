import { NextRequest } from 'next/server'
import { GET, POST } from '../../../src/app/api/claims/route'
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

describe('/api/claims API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/claims', () => {
    it('should return claims with pagination', async () => {
      const mockClaims = [
        {
          id: 'claim1',
          title: 'Test Claim',
          status: 'SUBMITTED',
          user: { id: 'user1', name: 'Test User', walletAddress: '0x123' }
        }
      ]

      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims)
      ;(prisma.claim.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/claims?page=1&limit=10')
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claims).toEqual(mockClaims)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })

    it('should apply filters correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/claims?status=APPROVED&category=MEDICAL')
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')

      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.claim.count as jest.Mock).mockResolvedValue(0)

      await GET(request)

      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            category: 'MEDICAL'
          })
        })
      )
    })
  })

  describe('POST /api/claims', () => {
    it('should create a new claim successfully', async () => {
      const newClaim = {
        id: 'claim2',
        title: 'New Claim',
        description: 'Test description',
        category: 'MEDICAL',
        requestedAmount: 1000,
        status: 'DRAFT',
        userId: 'user1'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        membershipStatus: 'ACTIVE'
      })
      ;(prisma.claim.create as jest.Mock).mockResolvedValue(newClaim)

      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Claim',
          description: 'Test description',
          category: 'MEDICAL',
          requestedAmount: 1000,
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Claim')
      expect(prisma.claim.create).toHaveBeenCalled()
    })

    it('should reject claim creation for inactive users', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        membershipStatus: 'PENDING'
      })

      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Claim',
          description: 'Test description',
          category: 'MEDICAL',
          requestedAmount: 1000,
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

    it('should validate request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: '', // Invalid: too short
          description: 'Short', // Invalid: too short
          category: 'INVALID', // Invalid: not in enum
          requestedAmount: -1000, // Invalid: negative
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
  })
})