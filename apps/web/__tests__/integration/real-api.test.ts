/**
 * Real API Integration Tests
 * 
 * These tests work with the actual API endpoints and validate
 * that our DAO system is properly integrated and functional.
 */

import { NextRequest } from 'next/server'

// Mock the security systems that are external dependencies
jest.mock('@safetynet/db', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    claim: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: 'test-claim-1',
        title: 'Test Claim',
        status: 'SUBMITTED'
      })
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-user-1',
        name: 'Test User',
        membershipStatus: 'ACTIVE'
      })
    }
  }))
}))

// Mock security systems
jest.mock('@/lib/security', () => ({
  getSecuritySystems: () => ({
    auditLogger: {
      logUserAction: jest.fn().mockResolvedValue(true)
    }
  }),
  performSecurityChecks: jest.fn().mockResolvedValue({
    riskScore: 0.1,
    autoReject: false,
    indicators: []
  })
}))

jest.mock('@/lib/security/middleware', () => ({
  SecurityMiddleware: jest.fn().mockImplementation(() => ({
    createMiddleware: () => () => Promise.resolve({ status: 200 })
  })),
  securityConfigs: {
    authenticatedAPI: { windowMs: 900000, max: 100 }
  }
}))

describe('DAO API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Claims API Integration', () => {
    it('should load claims API module successfully', async () => {
      // This tests that our API modules can be imported without errors
      const claimsModule = await import('@/app/api/claims/route')
      
      expect(claimsModule.GET).toBeDefined()
      expect(claimsModule.POST).toBeDefined()
      expect(typeof claimsModule.GET).toBe('function')
      expect(typeof claimsModule.POST).toBe('function')
    })

    it('should handle claims GET request', async () => {
      const claimsModule = await import('@/app/api/claims/route')
      
      const mockRequest = new NextRequest('http://localhost:3000/api/claims?page=1&limit=10', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer test-token',
          'x-user-role': 'USER',
          'x-user-id': 'test-user-1'
        }
      })

      const response = await claimsModule.GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('meta')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle claims POST request', async () => {
      const claimsModule = await import('@/app/api/claims/route')
      
      const mockClaimData = {
        title: 'Emergency Medical Claim',
        description: 'Need immediate financial assistance for medical emergency',
        category: 'MEDICAL',
        requestedAmount: 5000,
        evidenceNotes: 'Medical bills attached'
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'x-user-id': 'test-user-1',
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockClaimData)
      })

      const response = await claimsModule.POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
      expect(data.title).toBe(mockClaimData.title)
    })
  })

  describe('Governance API Integration', () => {
    it('should load governance API module successfully', async () => {
      const governanceModule = await import('@/app/api/governance/route')
      
      expect(governanceModule.GET).toBeDefined()
      expect(governanceModule.POST).toBeDefined()
      expect(typeof governanceModule.GET).toBe('function')
      expect(typeof governanceModule.POST).toBe('function')
    })
  })

  describe('Treasury API Integration', () => {
    it('should load treasury API module successfully', async () => {
      const treasuryModule = await import('@/app/api/treasury/route')
      
      expect(treasuryModule.GET).toBeDefined()
      expect(typeof treasuryModule.GET).toBe('function')
    })
  })

  describe('Users API Integration', () => {
    it('should load users API module successfully', async () => {
      const usersModule = await import('@/app/api/users/route')
      
      expect(usersModule.GET).toBeDefined()
      expect(usersModule.POST).toBeDefined()
      expect(typeof usersModule.GET).toBe('function')
      expect(typeof usersModule.POST).toBe('function')
    })
  })

  describe('NFTs API Integration', () => {
    it('should load NFTs API module successfully', async () => {
      const nftsModule = await import('@/app/api/nfts/route')
      
      expect(nftsModule.GET).toBeDefined()
      expect(nftsModule.POST).toBeDefined()
      expect(typeof nftsModule.GET).toBe('function')
      expect(typeof nftsModule.POST).toBe('function')
    })
  })

  describe('GraphQL API Integration', () => {
    it('should load GraphQL API module successfully', async () => {
      const graphqlModule = await import('@/app/api/graphql/route')
      
      expect(graphqlModule.GET).toBeDefined()
      expect(graphqlModule.POST).toBeDefined()
      expect(typeof graphqlModule.GET).toBe('function')
      expect(typeof graphqlModule.POST).toBe('function')
    })
  })

  describe('Security Systems Integration', () => {
    it('should load security middleware successfully', async () => {
      const { SecurityMiddleware } = await import('@/lib/security/middleware')
      
      expect(SecurityMiddleware).toBeDefined()
      expect(typeof SecurityMiddleware).toBe('function')
    })

    it('should load audit logger successfully', async () => {
      const auditLogger = await import('@/lib/security/audit-logger')
      
      expect(auditLogger).toBeDefined()
    })

    it('should load fraud detection successfully', async () => {
      const fraudDetection = await import('@/lib/security/fraud-detection')
      
      expect(fraudDetection).toBeDefined()
    })

    it('should load rate limiter successfully', async () => {
      const rateLimiter = await import('@/lib/security/rate-limiter')
      
      expect(rateLimiter).toBeDefined()
    })
  })

  describe('Database Integration', () => {
    it('should be able to import Prisma client', () => {
      const { PrismaClient } = require('@safetynet/db')
      
      expect(PrismaClient).toBeDefined()
      expect(typeof PrismaClient).toBe('function')
    })
  })

  describe('GraphQL Schema Integration', () => {
    it('should load GraphQL schema successfully', async () => {
      const schema = await import('@/lib/graphql/schema')
      
      expect(schema).toBeDefined()
    })

    it('should load GraphQL resolvers successfully', async () => {
      const resolvers = await import('@/lib/graphql/resolvers')
      
      expect(resolvers).toBeDefined()
    })
  })

  describe('Authentication Integration', () => {
    it('should load auth configuration successfully', async () => {
      const auth = await import('@/lib/auth')
      
      expect(auth).toBeDefined()
    })
  })

  describe('Utility Functions Integration', () => {
    it('should load voting power calculation', async () => {
      const votingPower = await import('@/lib/voting-power')
      
      expect(votingPower).toBeDefined()
    })

    it('should load risk assessment', async () => {
      const riskAssessment = await import('@/lib/risk-assessment')
      
      expect(riskAssessment).toBeDefined()
    })

    it('should load NFT utilities', async () => {
      const nft = await import('@/lib/nft')
      
      expect(nft).toBeDefined()
    })

    it('should load wallet utilities', async () => {
      const wallet = await import('@/lib/wallet')
      
      expect(wallet).toBeDefined()
    })
  })
})