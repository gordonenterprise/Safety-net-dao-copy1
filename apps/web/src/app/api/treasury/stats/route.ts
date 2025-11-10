import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Calculate treasury statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get total balance from treasury transactions
    const allTransactions = await prisma.treasuryTransaction.findMany({
      where: {
        status: 'COMPLETED'
      }
    })

    const totalBalance = allTransactions.reduce((balance, transaction) => {
      return transaction.type === 'INCOME' 
        ? balance + transaction.amount
        : balance - transaction.amount
    }, 0)

    // Monthly income (membership fees)
    const monthlyIncome = await prisma.subscription.aggregate({
      where: {
        status: 'ACTIVE',
        updatedAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    })

    // Monthly outgoing (claim payouts)
    const monthlyOutgoing = await prisma.treasuryTransaction.aggregate({
      where: {
        type: 'PAYOUT',
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    })

    // Total active members
    const totalMembers = await prisma.user.count({
      where: {
        subscription: {
          some: {
            status: {
              in: ['ACTIVE', 'PAST_DUE']
            }
          }
        }
      }
    })

    // Active claims (submitted, under review, voting)
    const activeClaims = await prisma.claim.count({
      where: {
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'VOTING']
        }
      }
    })

    // Pending payouts (approved but not paid)
    const pendingPayouts = await prisma.claim.aggregate({
      where: {
        status: 'APPROVED'
      },
      _sum: {
        requestedAmount: true
      }
    })

    // Calculate burn rate (average monthly outgoing)
    const lastThreeMonthsOutgoing = await prisma.treasuryTransaction.aggregate({
      where: {
        type: 'PAYOUT',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 3, 1)
        }
      },
      _sum: {
        amount: true
      }
    })

    const burnRate = (lastThreeMonthsOutgoing._sum.amount || 0) / 3
    const runwayMonths = burnRate > 0 ? Math.floor(totalBalance / burnRate) : 999

    const stats = {
      totalBalance,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      monthlyOutgoing: monthlyOutgoing._sum.amount || 0,
      totalMembers,
      activeClaims,
      pendingPayouts: pendingPayouts._sum.requestedAmount || 0,
      burnRate,
      runwayMonths
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching treasury stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}