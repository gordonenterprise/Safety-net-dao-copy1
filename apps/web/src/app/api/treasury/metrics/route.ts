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

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Revenue metrics
    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          updatedAt: {
            gte: startOfThisMonth
          }
        },
        _sum: { amount: true }
      }),
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          updatedAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth
          }
        },
        _sum: { amount: true }
      })
    ])

    const revenueThisMonth = thisMonthRevenue._sum.amount || 0
    const revenueLastMonth = lastMonthRevenue._sum.amount || 0
    const revenueChange = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
      : 0

    // Expense metrics
    const [thisMonthExpenses, lastMonthExpenses] = await Promise.all([
      prisma.treasuryTransaction.aggregate({
        where: {
          type: 'PAYOUT',
          status: 'COMPLETED',
          createdAt: {
            gte: startOfThisMonth
          }
        },
        _sum: { amount: true }
      }),
      prisma.treasuryTransaction.aggregate({
        where: {
          type: 'PAYOUT',
          status: 'COMPLETED',
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth
          }
        },
        _sum: { amount: true }
      })
    ])

    const expensesThisMonth = thisMonthExpenses._sum.amount || 0
    const expensesLastMonth = lastMonthExpenses._sum.amount || 0
    const expensesChange = expensesLastMonth > 0 
      ? ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100 
      : 0

    // Member metrics
    const [activeMembers, newMembersThisMonth, churnedMembersThisMonth] = await Promise.all([
      prisma.user.count({
        where: {
          subscription: {
            some: {
              status: {
                in: ['ACTIVE', 'PAST_DUE']
              }
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfThisMonth
          },
          subscription: {
            some: {
              status: 'ACTIVE'
            }
          }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            gte: startOfThisMonth
          }
        }
      })
    ])

    // Claims metrics
    const [submittedClaims, approvedClaims, totalPaidOut] = await Promise.all([
      prisma.claim.count({
        where: {
          createdAt: {
            gte: startOfThisMonth
          }
        }
      }),
      prisma.claim.count({
        where: {
          status: 'APPROVED',
          updatedAt: {
            gte: startOfThisMonth
          }
        }
      }),
      prisma.claim.aggregate({
        where: {
          status: 'PAID',
          updatedAt: {
            gte: startOfThisMonth
          }
        },
        _sum: { requestedAmount: true }
      })
    ])

    const metrics = {
      revenue: {
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        change: revenueChange
      },
      expenses: {
        thisMonth: expensesThisMonth,
        lastMonth: expensesLastMonth,
        change: expensesChange
      },
      members: {
        active: activeMembers,
        new: newMembersThisMonth,
        churned: churnedMembersThisMonth
      },
      claims: {
        submitted: submittedClaims,
        approved: approvedClaims,
        totalPaid: totalPaidOut._sum.requestedAmount || 0
      }
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error fetching treasury metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}