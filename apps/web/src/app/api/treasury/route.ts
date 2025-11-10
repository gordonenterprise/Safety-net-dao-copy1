import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger, fraudDetector } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const createTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYOUT', 'INVESTMENT', 'FEE', 'REWARD']),
  amount: z.number().min(0),
  currency: z.string().default('ETH'),
  recipient: z.string().optional(),
  description: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional(),
  proposalId: z.string().optional(),
})

// GET /api/treasury - Get treasury information and transactions
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {}
    if (type) where.type = type
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Get treasury balance
    const transactions = await prisma.treasuryTransaction.findMany({
      where: { status: 'COMPLETED' }
    })

    const balance = transactions.reduce((acc, tx) => {
      if (['DEPOSIT', 'INVESTMENT'].includes(tx.type)) {
        return acc + tx.amount
      } else if (['WITHDRAWAL', 'PAYOUT', 'FEE'].includes(tx.type)) {
        return acc - tx.amount
      }
      return acc
    }, 0)

    // Get transaction history
    const [txHistory, total] = await Promise.all([
      prisma.treasuryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.treasuryTransaction.count({ where })
    ])

    // Calculate monthly statistics
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyStats = await prisma.treasuryTransaction.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: currentMonth },
        status: 'COMPLETED'
      },
      _sum: { amount: true },
      _count: true
    })

    const stats = {
      totalBalance: balance,
      monthlyIncome: monthlyStats
        .filter(s => ['DEPOSIT', 'INVESTMENT'].includes(s.type))
        .reduce((sum, s) => sum + (s._sum.amount || 0), 0),
      monthlyOutgoing: monthlyStats
        .filter(s => ['WITHDRAWAL', 'PAYOUT', 'FEE'].includes(s.type))
        .reduce((sum, s) => sum + (s._sum.amount || 0), 0),
      monthlyTransactions: monthlyStats.reduce((sum, s) => sum + s._count, 0)
    }

    return NextResponse.json({
      treasury: {
        balance,
        stats,
        transactions: txHistory
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Treasury GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/treasury - Create treasury transaction (admin only)
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    // Fraud detection check for large amounts
    if (validatedData.amount > 10000) {
      const userIP = request.ip || request.headers.get('x-forwarded-for') || ''
      const fraudCheck = await fraudDetector.checkForFraud(userId, 'LARGE_TREASURY_TRANSACTION', {
        amount: validatedData.amount,
        type: validatedData.type,
        userIP
      })

      if (fraudCheck.isFraudulent) {
        await auditLogger.logSecurityEvent('FRAUD_DETECTED', {
          userId,
          action: 'LARGE_TREASURY_TRANSACTION',
          reason: fraudCheck.reason,
          riskScore: fraudCheck.riskScore,
          amount: validatedData.amount
        })

        return NextResponse.json(
          { error: 'Security check failed. Large transactions require additional verification.' },
          { status: 400 }
        )
      }
    }

    // For withdrawals and payouts, check if there are sufficient funds
    if (['WITHDRAWAL', 'PAYOUT'].includes(validatedData.type)) {
      const currentTransactions = await prisma.treasuryTransaction.findMany({
        where: { status: 'COMPLETED' }
      })

      const currentBalance = currentTransactions.reduce((acc, tx) => {
        if (['DEPOSIT', 'INVESTMENT'].includes(tx.type)) {
          return acc + tx.amount
        } else if (['WITHDRAWAL', 'PAYOUT', 'FEE'].includes(tx.type)) {
          return acc - tx.amount
        }
        return acc
      }, 0)

      if (currentBalance < validatedData.amount) {
        return NextResponse.json(
          { error: 'Insufficient treasury funds' },
          { status: 400 }
        )
      }
    }

    // Create transaction
    const transaction = await prisma.treasuryTransaction.create({
      data: {
        ...validatedData,
        txHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING',
        initiatedBy: userId
      }
    })

    // For testing purposes, automatically complete the transaction
    // In production, this would be handled by blockchain integration
    const completedTransaction = await prisma.treasuryTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'TREASURY_TRANSACTION' as any,
      {
        transactionId: transaction.id,
        type: validatedData.type,
        amount: validatedData.amount,
        recipient: validatedData.recipient
      }
    )

    return NextResponse.json(completedTransaction, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Treasury POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}