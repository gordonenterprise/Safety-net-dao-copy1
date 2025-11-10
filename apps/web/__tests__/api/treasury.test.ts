import { NextRequest } from 'next/server'
import { GET, POST } from '../../../src/app/api/treasury/route'
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

describe('/api/treasury API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/treasury', () => {
    it('should return treasury balance and transaction history', async () => {
      const mockTransactions = [
        { type: 'DEPOSIT', amount: 10000, status: 'COMPLETED' },
        { type: 'PAYOUT', amount: 5000, status: 'COMPLETED' },
        { type: 'DEPOSIT', amount: 3000, status: 'COMPLETED' }
      ]

      const mockTxHistory = [
        {
          id: 'tx1',
          type: 'DEPOSIT',
          amount: 10000,
          description: 'Member fees',
          createdAt: new Date()
        }
      ]

      const mockMonthlyStats = [
        { type: 'DEPOSIT', _sum: { amount: 13000 }, _count: 2 },
        { type: 'PAYOUT', _sum: { amount: 5000 }, _count: 1 }
      ]

      ;(prisma.treasuryTransaction.findMany as jest.Mock)
        .mockResolvedValueOnce(mockTransactions) // For balance calculation
        .mockResolvedValueOnce(mockTxHistory) // For transaction history

      ;(prisma.treasuryTransaction.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.treasuryTransaction.groupBy as jest.Mock).mockResolvedValue(mockMonthlyStats)

      const request = new NextRequest('http://localhost:3000/api/treasury?page=1&limit=10')
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.treasury.balance).toBe(8000) // 10000 + 3000 - 5000
      expect(data.treasury.stats.monthlyIncome).toBe(13000)
      expect(data.treasury.stats.monthlyOutgoing).toBe(5000)
      expect(data.treasury.transactions).toEqual(mockTxHistory)
    })

    it('should filter transactions by type and date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/treasury?type=DEPOSIT&dateFrom=2024-01-01&dateTo=2024-12-31')
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')

      ;(prisma.treasuryTransaction.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.treasuryTransaction.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.treasuryTransaction.groupBy as jest.Mock).mockResolvedValue([])

      await GET(request)

      expect(prisma.treasuryTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'DEPOSIT',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      )
    })
  })

  describe('POST /api/treasury', () => {
    it('should create treasury transaction for admin', async () => {
      const newTransaction = {
        id: 'tx2',
        type: 'DEPOSIT',
        amount: 5000,
        description: 'Test deposit',
        status: 'COMPLETED',
        initiatedBy: 'admin1'
      }

      ;(prisma.treasuryTransaction.findMany as jest.Mock).mockResolvedValue([
        { type: 'DEPOSIT', amount: 10000 }
      ]) // For balance check
      ;(prisma.treasuryTransaction.create as jest.Mock).mockResolvedValue(newTransaction)
      ;(prisma.treasuryTransaction.update as jest.Mock).mockResolvedValue({
        ...newTransaction,
        status: 'COMPLETED',
        completedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/treasury', {
        method: 'POST',
        body: JSON.stringify({
          type: 'DEPOSIT',
          amount: 5000,
          description: 'Test deposit',
          currency: 'ETH'
        })
      })
      request.headers.set('x-user-id', 'admin1')
      request.headers.set('x-user-role', 'ADMIN')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.type).toBe('DEPOSIT')
      expect(data.amount).toBe(5000)
      expect(prisma.treasuryTransaction.create).toHaveBeenCalled()
    })

    it('should reject non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/treasury', {
        method: 'POST',
        body: JSON.stringify({
          type: 'DEPOSIT',
          amount: 5000,
          description: 'Test deposit'
        })
      })
      request.headers.set('x-user-id', 'user1')
      request.headers.set('x-user-role', 'USER')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Admin access required')
    })

    it('should check sufficient funds for withdrawals', async () => {
      ;(prisma.treasuryTransaction.findMany as jest.Mock).mockResolvedValue([
        { type: 'DEPOSIT', amount: 1000 } // Only $1000 in treasury
      ])

      const request = new NextRequest('http://localhost:3000/api/treasury', {
        method: 'POST',
        body: JSON.stringify({
          type: 'WITHDRAWAL',
          amount: 5000, // Trying to withdraw $5000
          description: 'Large withdrawal',
          recipient: '0x123'
        })
      })
      request.headers.set('x-user-id', 'admin1')
      request.headers.set('x-user-role', 'ADMIN')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Insufficient treasury funds')
    })

    it('should trigger fraud detection for large transactions', async () => {
      // Mock fraud detection to return suspicious result for large amounts
      const { getSecuritySystems } = require('../../../src/lib/security')
      const fraudDetector = getSecuritySystems().fraudDetector
      fraudDetector.checkForFraud.mockResolvedValueOnce({
        isFraudulent: true,
        riskScore: 0.9,
        reason: 'Large transaction amount'
      })

      ;(prisma.treasuryTransaction.findMany as jest.Mock).mockResolvedValue([
        { type: 'DEPOSIT', amount: 50000 } // Sufficient funds
      ])

      const request = new NextRequest('http://localhost:3000/api/treasury', {
        method: 'POST',
        body: JSON.stringify({
          type: 'WITHDRAWAL',
          amount: 15000, // Large amount that triggers fraud detection
          description: 'Large withdrawal',
          recipient: '0x123'
        })
      })
      request.headers.set('x-user-id', 'admin1')
      request.headers.set('x-user-role', 'ADMIN')
      request.headers.set('content-type', 'application/json')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Security check failed')
    })
  })
})