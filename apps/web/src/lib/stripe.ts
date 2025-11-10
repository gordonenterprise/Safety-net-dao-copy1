import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  priceIdBasic: process.env.STRIPE_PRICE_ID_BASIC,
} as const

// Validate required Stripe configuration
export function validateStripeConfig() {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID_BASIC'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`)
  }
  
  return true
}

// Subscription plans configuration
export const MEMBERSHIP_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Membership',
    description: 'Access to claims submission, community voting, and basic governance rights',
    price: 800, // $8.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Submit claims up to $500',
      'Vote on community proposals',
      'Access to member-only Discord',
      'Basic governance token allocation',
      'Priority customer support'
    ],
    governanceMultiplier: 1.0,
    claimLimit: 50000, // $500 in cents
    votingPower: 1.0
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Membership',
    description: 'Enhanced benefits with increased limits and governance participation',
    price: 2000, // $20.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Submit claims up to $1,000',
      'Enhanced voting power (1.5x)',
      'Access to validator discussions',
      'Premium governance token allocation',
      'Early access to new features',
      'Priority claim processing',
      'Advanced analytics dashboard'
    ],
    governanceMultiplier: 1.5,
    claimLimit: 100000, // $1000 in cents
    votingPower: 1.5
  }
} as const

export type MembershipPlan = keyof typeof MEMBERSHIP_PLANS