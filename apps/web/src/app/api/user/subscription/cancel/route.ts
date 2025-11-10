import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { stripe } from '../../../../../lib/stripe'
import { PrismaClient } from '@prisma/client'
import { auditLog } from '../../../../../lib/audit'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        status: 'ACTIVE'
      }
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe (at period end)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    })

    // Update local subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    })

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: {
        action: 'cancel_at_period_end',
        stripeSubscriptionId: subscription.stripeSubscriptionId
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be cancelled at the end of the current period'
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}