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

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        cancelAtPeriodEnd: true
      }
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found that can be reactivated' },
        { status: 404 }
      )
    }

    // Reactivate subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    })

    // Update local subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        cancelAtPeriodEnd: false,
        canceledAt: null
      }
    })

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: {
        action: 'reactivate',
        stripeSubscriptionId: subscription.stripeSubscriptionId
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Subscription has been reactivated'
    })

  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}