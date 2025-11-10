import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '../../../lib/stripe'
import { PrismaClient } from '@prisma/client'
import { auditLog } from '../../../lib/audit'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!STRIPE_CONFIG.webhookSecret) {
      console.error('Missing webhook secret')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: any

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Processing Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout completed:', session.id)
  
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  try {
    // Update user subscription status
    await prisma.subscription.create({
      data: {
        userId: userId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        status: 'ACTIVE',
        plan: planId === 'premium' ? 'PREMIUM' : 'BASIC',
        amount: session.amount_total || 800,
        currency: 'usd',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    })

    // Update user membership status
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: 'ACTIVE'
      }
    })

    // Audit log
    await auditLog({
      userId: userId,
      action: 'CREATE',
      entityType: 'subscription',
      entityId: session.subscription,
      metadata: {
        stripeSessionId: session.id,
        planId: planId,
        amount: session.amount_total
      }
    })

    console.log(`Subscription created for user ${userId}`)

  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing subscription created:', subscription.id)
  
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  try {
    // Ensure subscription record exists and is up to date
    await prisma.subscription.upsert({
      where: { 
        stripeSubscriptionId: subscription.id
      },
      update: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'PENDING',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      },
      create: {
        userId: userId,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        status: subscription.status === 'active' ? 'ACTIVE' : 'PENDING',
        plan: 'BASIC',
        amount: 800,
        currency: 'usd',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    })

  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing subscription updated:', subscription.id)

  try {
    await prisma.subscription.update({
      where: { 
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      }
    })

    // Update user membership status based on subscription status
    const userId = subscription.metadata?.userId
    if (userId) {
      const membershipStatus = subscription.status === 'active' ? 'ACTIVE' : 'SUSPENDED'
      
      await prisma.user.update({
        where: { id: userId },
        data: { membershipStatus }
      })
    }

  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription deleted:', subscription.id)

  try {
    await prisma.subscription.update({
      where: { 
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date()
      }
    })

    // Update user membership status
    const userId = subscription.metadata?.userId
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { membershipStatus: 'CANCELLED' }
      })
    }

  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('Processing payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription

  try {
    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!subscription) {
      console.error('Subscription not found for payment:', subscriptionId)
      return
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'SUCCEEDED',
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number
        }
      }
    })

    // Audit log
    await auditLog({
      userId: subscription.userId,
      action: 'CREATE',
      entityType: 'payment',
      entityId: invoice.payment_intent,
      metadata: {
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoiceId: invoice.id
      }
    })

  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('Processing payment failed:', invoice.id)
  
  const subscriptionId = invoice.subscription

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!subscription) {
      console.error('Subscription not found for failed payment:', subscriptionId)
      return
    }

    // Create failed payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'FAILED',
        failedAt: new Date(),
        metadata: {
          invoiceId: invoice.id,
          failureReason: 'Payment failed'
        }
      }
    })

    // Update subscription to past due if multiple failures
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' }
    })

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

function mapStripeStatus(stripeStatus: string) {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
    case 'cancelled':
      return 'CANCELLED'
    case 'unpaid':
      return 'UNPAID'
    default:
      return 'PENDING'
  }
}