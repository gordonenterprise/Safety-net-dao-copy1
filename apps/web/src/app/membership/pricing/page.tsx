'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Check, Crown, Shield, Users, Zap, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import RouteGuard from '../../../components/auth/RouteGuard'
import FeatureGuard from '../../../components/auth/FeatureGuard'
import { MEMBERSHIP_PLANS } from '../../../lib/stripe'
import getStripe from '../../../lib/stripe-client'

export default function MembershipPricing() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin?callbackUrl=/membership/pricing'
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          returnUrl: window.location.origin
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId, url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        const stripe = await getStripe()
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Membership
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join SafetyNet DAO and gain access to community-powered financial protection, 
          governance participation, and exclusive member benefits.
        </p>
      </div>

      {/* Membership Benefits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <CardHeader>
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <CardTitle>Financial Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Submit claims for emergencies and get community support when you need it most.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <CardTitle>Community Governance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Vote on proposals, influence treasury decisions, and shape the future of the DAO.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Crown className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <CardTitle>Exclusive Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Get priority support, early feature access, and governance token rewards.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Basic Plan */}
        <Card className="relative border-2 border-blue-200 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
              Most Popular
            </Badge>
          </div>
          
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-2" />
              <CardTitle className="text-2xl">{MEMBERSHIP_PLANS.BASIC.name}</CardTitle>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">
                ${MEMBERSHIP_PLANS.BASIC.price / 100}
              </span>
              <span className="text-gray-600 ml-2">per month</span>
            </div>
            <CardDescription className="text-gray-600">
              {MEMBERSHIP_PLANS.BASIC.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-8">
              {MEMBERSHIP_PLANS.BASIC.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Claim Limit:</span>
                <span className="font-medium">${MEMBERSHIP_PLANS.BASIC.claimLimit / 100}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Voting Power:</span>
                <span className="font-medium">{MEMBERSHIP_PLANS.BASIC.votingPower}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Governance Boost:</span>
                <span className="font-medium">{MEMBERSHIP_PLANS.BASIC.governanceMultiplier}x</span>
              </div>
            </div>

            <Button 
              onClick={() => handleSubscribe('basic')}
              disabled={loading === 'basic'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              {loading === 'basic' ? 'Processing...' : 'Start Basic Membership'}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-2 border-purple-200 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-sm">
              <Star className="w-4 h-4 mr-1" />
              Premium
            </Badge>
          </div>
          
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-purple-600 mr-2" />
              <CardTitle className="text-2xl">{MEMBERSHIP_PLANS.PREMIUM.name}</CardTitle>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">
                ${MEMBERSHIP_PLANS.PREMIUM.price / 100}
              </span>
              <span className="text-gray-600 ml-2">per month</span>
            </div>
            <CardDescription className="text-gray-600">
              {MEMBERSHIP_PLANS.PREMIUM.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-8">
              {MEMBERSHIP_PLANS.PREMIUM.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Claim Limit:</span>
                <span className="font-medium">${MEMBERSHIP_PLANS.PREMIUM.claimLimit / 100}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Voting Power:</span>
                <span className="font-medium text-purple-600">{MEMBERSHIP_PLANS.PREMIUM.votingPower}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Governance Boost:</span>
                <span className="font-medium text-purple-600">{MEMBERSHIP_PLANS.PREMIUM.governanceMultiplier}x</span>
              </div>
            </div>

            <Button 
              onClick={() => handleSubscribe('premium')}
              disabled={loading === 'premium'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
              size="lg"
            >
              {loading === 'premium' ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How does the claims process work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Submit a claim with supporting documentation. The community validates claims through 
                a democratic voting process. Approved claims are paid out from the community treasury.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's the 60-day eligibility requirement?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                New members must maintain active membership for 60 days before becoming eligible 
                to submit claims. This helps prevent fraud and ensures community commitment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel my membership?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes, you can cancel anytime. Your membership remains active until the end of your 
                current billing period. You'll retain access to governance participation but lose 
                claim submission privileges.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How are governance tokens distributed?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Governance tokens are awarded monthly based on membership tier, participation in 
                voting, and community contributions. Tokens grant voting power in DAO governance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-16 text-center">
        <h3 className="text-xl font-semibold mb-6">Trusted by the Community</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div>
            <div className="text-2xl font-bold text-blue-600">$2M+</div>
            <div className="text-gray-600">Treasury Balance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">1,200+</div>
            <div className="text-gray-600">Active Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">95%</div>
            <div className="text-gray-600">Claims Approval Rate</div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      {!session && (
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Ready to join the community?
          </p>
          <Link href="/auth/signin?callbackUrl=/membership/pricing">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              Sign Up Now
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}