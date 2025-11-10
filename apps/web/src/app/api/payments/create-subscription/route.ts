import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

// Mock Stripe configuration for development
const STRIPE_MOCK_CONFIG = {
  basic: {
    priceId: 'price_mock_basic_monthly',
    amount: 800, // $8.00 in cents
  },
  supporter: {
    priceId: 'price_mock_supporter_monthly',
    amount: 1500, // $15.00 in cents
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, paymentMethod } = body

    if (!planId || !STRIPE_MOCK_CONFIG[planId as keyof typeof STRIPE_MOCK_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const plan = STRIPE_MOCK_CONFIG[planId as keyof typeof STRIPE_MOCK_CONFIG]

    // In development, simulate successful payment
    if (process.env.NODE_ENV === 'development') {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockSubscription = {
        id: `sub_mock_${Date.now()}`,
        customerId: `cus_mock_${session.user.id}`,
        status: 'active',
        planId,
        amount: plan.amount,
        currency: 'usd',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      }

      console.log('Mock subscription created:', mockSubscription)

      return NextResponse.json({
        success: true,
        subscription: mockSubscription,
        message: 'Subscription created successfully!',
        redirectUrl: '/dashboard?welcome=true'
      })
    }

    // Production Stripe integration would go here
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    // Create or retrieve customer
    let customer = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    })

    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: {
          userId: session.user.id,
        },
      })
    } else {
      customer = customer.data[0]
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // Save subscription to database
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'PENDING',
        plan: planId.toUpperCase(),
        amount: plan.amount,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    })
    */

    return NextResponse.json({
      success: true,
      message: 'Production Stripe integration not yet configured'
    })

  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}