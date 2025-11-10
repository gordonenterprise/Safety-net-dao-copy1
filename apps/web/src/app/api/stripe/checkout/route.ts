import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { stripe, MEMBERSHIP_PLANS, type MembershipPlan } from '../../../lib/stripe'
import { rateLimit } from '../../../lib/rate-limit'
import { auditLog } from '../../../lib/audit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({
      identifier: request.ip || 'unknown',
      action: 'stripe_checkout',
      limit: 5,
      window: 60 * 1000 // 5 requests per minute
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, returnUrl } = body

    // Validate plan
    if (!planId || !(planId in MEMBERSHIP_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid membership plan' },
        { status: 400 }
      )
    }

    const plan = MEMBERSHIP_PLANS[planId as MembershipPlan]

    // Create or retrieve Stripe customer
    let customerId: string
    
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: session.user.email!,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: session.user.email!,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id,
            membershipPlan: planId
          }
        })
        customerId = customer.id
      }
    } catch (error) {
      console.error('Error managing Stripe customer:', error)
      return NextResponse.json(
        { error: 'Failed to set up payment account' },
        { status: 500 }
      )
    }

    // Create checkout session
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: plan.currency,
              product_data: {
                name: plan.name,
                description: plan.description,
                metadata: {
                  planId: planId,
                  features: JSON.stringify(plan.features)
                }
              },
              recurring: {
                interval: plan.interval as 'month'
              },
              unit_amount: plan.price
            },
            quantity: 1
          }
        ],
        success_url: `${returnUrl || process.env.NEXTAUTH_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || process.env.NEXTAUTH_URL}/membership/pricing`,
        metadata: {
          userId: session.user.id,
          planId: planId,
          userEmail: session.user.email!
        },
        subscription_data: {
          metadata: {
            userId: session.user.id,
            planId: planId
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        }
      })

      // Audit log
      await auditLog({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'stripe_checkout',
        entityId: checkoutSession.id,
        metadata: {
          planId,
          amount: plan.price,
          currency: plan.currency
        }
      })

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url
      })

    } catch (error) {
      console.error('Error creating Stripe checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}