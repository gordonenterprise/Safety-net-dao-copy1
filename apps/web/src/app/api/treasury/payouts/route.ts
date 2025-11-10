import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '../../../lib/prisma'
import { z } from 'zod'

const payoutSchema = z.object({
  claimIds: z.array(z.string()).optional(),
  method: z.enum(['USDC', 'ACH', 'CHECK']).default('USDC'),
  scheduledFor: z.string().optional(), // ISO date string
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { claimIds, method, scheduledFor, notes } = payoutSchema.parse(body)

    // If no specific claims provided, process all approved claims
    const whereClause = claimIds?.length 
      ? { id: { in: claimIds }, status: 'APPROVED' }
      : { status: 'APPROVED' }

    const approvedClaims = await prisma.claim.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        }
      }
    })

    if (approvedClaims.length === 0) {
      return NextResponse.json({ error: 'No approved claims found for payout' }, { status: 400 })
    }

    // Calculate total payout amount
    const totalAmount = approvedClaims.reduce((sum, claim) => sum + claim.requestedAmount, 0)

    // Check treasury balance
    const treasuryBalance = await calculateTreasuryBalance()
    
    if (totalAmount > treasuryBalance) {
      return NextResponse.json({ 
        error: 'Insufficient treasury funds',
        required: totalAmount,
        available: treasuryBalance
      }, { status: 400 })
    }

    const processedPayouts = []
    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date()

    // Process each claim
    for (const claim of approvedClaims) {
      try {
        // Create treasury transaction
        const treasuryTransaction = await prisma.treasuryTransaction.create({
          data: {
            type: 'PAYOUT',
            amount: claim.requestedAmount,
            recipient: claim.user.walletAddress || claim.user.email,
            description: `Claim payout: ${claim.title}`,
            method,
            status: isScheduled ? 'SCHEDULED' : 'PENDING',
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            metadata: {
              claimId: claim.id,
              claimTitle: claim.title,
              claimantName: claim.user.name,
              claimantEmail: claim.user.email,
              payoutMethod: method,
              notes
            },
            userId: claim.userId
          }
        })

        // Create payout record
        const payout = await prisma.claimPayout.create({
          data: {
            claimId: claim.id,
            amount: claim.requestedAmount,
            method,
            status: isScheduled ? 'SCHEDULED' : 'PENDING',
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            treasuryTransactionId: treasuryTransaction.id
          }
        })

        // Update claim status
        await prisma.claim.update({
          where: { id: claim.id },
          data: { 
            status: 'PAID',
            paidAt: isScheduled ? null : new Date()
          }
        })

        processedPayouts.push({
          claimId: claim.id,
          payoutId: payout.id,
          amount: claim.requestedAmount,
          recipient: claim.user.name,
          method,
          status: payout.status
        })

      } catch (error) {
        console.error(`Error processing payout for claim ${claim.id}:`, error)
        // Continue with other payouts even if one fails
      }
    }

    // Send notifications (in a real app, this would trigger email/webhook notifications)
    if (!isScheduled) {
      await sendPayoutNotifications(processedPayouts)
    }

    return NextResponse.json({
      message: `Successfully processed ${processedPayouts.length} payouts`,
      payouts: processedPayouts,
      totalAmount,
      scheduled: isScheduled
    })

  } catch (error) {
    console.error('Error processing payouts:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payout data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Get pending payouts
    const pendingPayouts = await prisma.claimPayout.findMany({
      where: {
        status: {
          in: ['PENDING', 'SCHEDULED']
        }
      },
      include: {
        claim: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get approved claims ready for payout
    const approvedClaims = await prisma.claim.findMany({
      where: {
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const treasuryBalance = await calculateTreasuryBalance()
    const totalPendingAmount = approvedClaims.reduce((sum, claim) => sum + claim.requestedAmount, 0)

    return NextResponse.json({
      pendingPayouts,
      approvedClaims,
      treasuryBalance,
      totalPendingAmount,
      canProcessPayouts: totalPendingAmount <= treasuryBalance
    })

  } catch (error) {
    console.error('Error fetching payout data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate current treasury balance
async function calculateTreasuryBalance(): Promise<number> {
  const transactions = await prisma.treasuryTransaction.findMany({
    where: {
      status: 'COMPLETED'
    },
    select: {
      type: true,
      amount: true
    }
  })

  return transactions.reduce((balance, transaction) => {
    return transaction.type === 'INCOME' 
      ? balance + transaction.amount
      : balance - transaction.amount
  }, 0)
}

// Helper function to send payout notifications
async function sendPayoutNotifications(payouts: any[]) {
  // In a real implementation, this would:
  // 1. Send email notifications to claim recipients
  // 2. Trigger webhook notifications to external systems
  // 3. Log payout events for audit trails
  
  console.log('Payout notifications sent for:', payouts.map(p => p.claimId))
}