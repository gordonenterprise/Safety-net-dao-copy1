import { SecurityMiddleware } from '../../../src/lib/security/middleware'
import { AuditLogger } from '../../../src/lib/security/audit-logger'
import { FraudDetectionEngine } from '../../../src/lib/security/fraud-detection'
import { prisma } from '@safetynet/db'

// Mock Prisma
const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  claim: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as any

describe('Security Systems', () => {
  let auditLogger: AuditLogger
  let fraudDetector: FraudDetectionEngine
  let securityMiddleware: SecurityMiddleware

  beforeEach(() => {
    jest.clearAllMocks()
    auditLogger = new AuditLogger(mockPrisma)
    fraudDetector = new FraudDetectionEngine(mockPrisma, auditLogger)
    securityMiddleware = new SecurityMiddleware(mockPrisma, auditLogger)
  })

  describe('AuditLogger', () => {
    it('should log user actions correctly', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'log1',
        userId: 'user1',
        action: 'CLAIM_CREATE',
        details: { claimId: 'claim1' }
      })

      await auditLogger.logUserAction('user1', 'CLAIM_CREATE', { claimId: 'claim1' })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          action: 'CLAIM_CREATE',
          details: { claimId: 'claim1' },
          level: 'INFO',
          resource: 'CLAIM'
        })
      })
    })

    it('should log security events with appropriate severity', async () => {
      mockPrisma.securityEvent.create.mockResolvedValue({
        id: 'sec1',
        type: 'FRAUD_DETECTED',
        severity: 'HIGH'
      })

      await auditLogger.logSecurityEvent('FRAUD_DETECTED', {
        userId: 'user1',
        reason: 'Suspicious activity'
      })

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'FRAUD_DETECTED',
          severity: 'HIGH',
          details: expect.objectContaining({
            userId: 'user1',
            reason: 'Suspicious activity'
          })
        })
      })
    })

    it('should handle system events', async () => {
      await auditLogger.logSystemEvent('DATABASE_BACKUP', { status: 'completed' })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DATABASE_BACKUP',
          level: 'INFO',
          resource: 'SYSTEM',
          details: { status: 'completed' }
        })
      })
    })
  })

  describe('FraudDetectionEngine', () => {
    it('should detect suspicious claim patterns', async () => {
      // Mock user with multiple recent claims
      mockPrisma.claim.findMany.mockResolvedValue([
        { amount: 1000, createdAt: new Date(Date.now() - 86400000) }, // 1 day ago
        { amount: 1000, createdAt: new Date(Date.now() - 172800000) }, // 2 days ago
        { amount: 1000, createdAt: new Date(Date.now() - 259200000) }, // 3 days ago
      ])

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        createdAt: new Date(Date.now() - 2592000000) // 30 days ago
      })

      const result = await fraudDetector.checkForFraud('user1', 'CLAIM_CREATION', {
        amount: 1000,
        category: 'MEDICAL'
      })

      expect(result.isFraudulent).toBe(true)
      expect(result.reason).toContain('Multiple claims in short period')
      expect(result.riskScore).toBeGreaterThan(0.5)
    })

    it('should detect round number patterns', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([
        { amount: 1000, createdAt: new Date() },
        { amount: 5000, createdAt: new Date() },
        { amount: 10000, createdAt: new Date() }
      ])

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        createdAt: new Date(Date.now() - 2592000000)
      })

      const result = await fraudDetector.checkForFraud('user1', 'CLAIM_CREATION', {
        amount: 15000, // Another round number
        category: 'EMERGENCY'
      })

      expect(result.isFraudulent).toBe(true)
      expect(result.reason).toContain('round number')
    })

    it('should allow legitimate claims', async () => {
      // Mock normal user behavior
      mockPrisma.claim.findMany.mockResolvedValue([
        { amount: 1247, createdAt: new Date(Date.now() - 2592000000) } // 30 days ago
      ])

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        createdAt: new Date(Date.now() - 15552000000) // 6 months ago
      })

      const result = await fraudDetector.checkForFraud('user1', 'CLAIM_CREATION', {
        amount: 1847, // Not a round number
        category: 'MEDICAL'
      })

      expect(result.isFraudulent).toBe(false)
      expect(result.riskScore).toBeLessThan(0.5)
    })

    it('should detect voting manipulation patterns', async () => {
      // Mock user voting pattern
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        createdAt: new Date(Date.now() - 86400000), // New user (1 day old)
        claimVotes: [
          { vote: 'APPROVE', createdAt: new Date(Date.now() - 3600000) },
          { vote: 'APPROVE', createdAt: new Date(Date.now() - 7200000) },
          { vote: 'APPROVE', createdAt: new Date(Date.now() - 10800000) }
        ],
        proposalVotes: []
      })

      const result = await fraudDetector.checkForFraud('user1', 'VOTING', {
        proposalId: 'prop1',
        vote: 'FOR'
      })

      expect(result.isFraudulent).toBe(true)
      expect(result.reason).toContain('New user with intensive voting')
    })
  })

  describe('SecurityMiddleware', () => {
    it('should create rate limiting middleware', () => {
      const config = {
        rateLimits: {
          windowMs: 900000, // 15 minutes
          max: 100
        },
        requireAuth: true,
        requireRole: ['USER', 'ADMIN']
      }

      const middleware = securityMiddleware.createMiddleware(config)
      
      expect(middleware).toBeInstanceOf(Function)
    })

    it('should handle authentication requirements', async () => {
      const config = {
        requireAuth: true,
        requireRole: ['ADMIN']
      }

      const middleware = securityMiddleware.createMiddleware(config)
      
      // Mock request without auth headers
      const request = {
        headers: new Map(),
        ip: '127.0.0.1'
      } as any

      const response = await middleware(request)
      
      expect(response.status).toBe(401)
    })

    it('should enforce role-based access', async () => {
      const config = {
        requireAuth: true,
        requireRole: ['ADMIN']
      }

      const middleware = securityMiddleware.createMiddleware(config)
      
      // Mock request with USER role (not ADMIN)
      const request = {
        headers: new Map([
          ['x-user-id', 'user1'],
          ['x-user-role', 'USER']
        ]),
        ip: '127.0.0.1'
      } as any

      const response = await middleware(request)
      
      expect(response.status).toBe(403)
    })
  })
})