'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Crown, Shield, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'

export default function MembershipSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // In a real implementation, you'd verify the session with Stripe
      // For now, we'll just show success
      setLoading(false)
      setSessionData({ 
        id: sessionId,
        planName: 'Basic Membership',
        amount: 800
      })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your membership...</p>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">No Session Found</h1>
        <p className="text-gray-600 mb-8">
          We couldn't find your payment session. Please check your email for confirmation 
          or contact support if you've been charged.
        </p>
        <Link href="/membership/pricing">
          <Button>Return to Pricing</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-600" />
            <div className="absolute inset-0 bg-green-100 rounded-full -z-10 animate-pulse"></div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SafetyNet DAO! 🎉
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Your membership has been successfully activated. You're now part of our 
          community-powered financial protection network.
        </p>

        <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">
          <Shield className="w-4 h-4 mr-2" />
          Basic Member
        </Badge>
      </div>

      {/* Membership Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            Membership Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Plan</h3>
              <p className="text-gray-600">Basic Membership ($8/month)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
              <p className="text-green-600 font-medium">Active</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Claims Eligibility</h3>
              <p className="text-amber-600">Available in 60 days</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Session ID</h3>
              <p className="text-gray-600 text-sm font-mono">{sessionId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Join the Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Connect with other members, participate in discussions, and stay updated 
              on DAO governance.
            </p>
            <Button className="w-full" variant="outline">
              Join Discord Server
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Set Up Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Complete your profile to enhance security and prepare for claims eligibility.
            </p>
            <Link href="/profile">
              <Button className="w-full" variant="outline">
                Complete Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Member Benefits Reminder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Member Benefits</CardTitle>
          <CardDescription>Here's what you can do as a Basic member:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Submit Claims (after 60 days)</h4>
                <p className="text-sm text-gray-600">Up to $500 per claim</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Vote on Proposals</h4>
                <p className="text-sm text-gray-600">Participate in DAO governance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Governance Tokens</h4>
                <p className="text-sm text-gray-600">Monthly token allocation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-sm text-gray-600">Fast response times</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="border-amber-200 bg-amber-50 mb-8">
        <CardHeader>
          <CardTitle className="text-amber-800">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-amber-700">
            <li className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Claims eligibility begins 60 days after membership activation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>You'll receive a confirmation email with membership details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Governance tokens are distributed monthly based on participation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Your subscription will automatically renew monthly</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        
        <Link href="/governance">
          <Button variant="outline" className="px-8 py-3">
            Explore Governance
          </Button>
        </Link>
      </div>

      {/* Support Information */}
      <div className="mt-12 text-center text-gray-600">
        <p className="mb-2">
          Need help? Contact our support team at{' '}
          <a href="mailto:support@safetynet.dao" className="text-blue-600 hover:underline">
            support@safetynet.dao
          </a>
        </p>
        <p className="text-sm">
          You can also manage your subscription in your{' '}
          <Link href="/account/billing" className="text-blue-600 hover:underline">
            account settings
          </Link>
        </p>
      </div>
    </div>
  )
}