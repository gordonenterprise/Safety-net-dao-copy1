'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PaymentPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  popular?: boolean
}

const plans: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic Membership',
    price: 8,
    description: 'Full access to SafetyNet DAO mutual aid network',
    features: [
      'Submit claims up to $500',
      'Vote on community claims',
      'Transparent treasury access',
      'Emergency financial support',
      'Community governance participation',
      'Member NFT certificate'
    ],
    popular: true
  },
  {
    id: 'supporter',
    name: 'Supporter Membership',
    price: 15,
    description: 'Enhanced support for the community',
    features: [
      'All Basic features included',
      'Submit claims up to $1,000',
      'Priority claim processing',
      'Advanced voting rights',
      'Special supporter badge',
      'Early access to new features'
    ]
  }
]

export default function PaymentSetupPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('basic')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true)
    
    try {
      // For development, simulate payment processing
      console.log('Processing payment for plan:', planId)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In production, this would integrate with Stripe
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          paymentMethod
        })
      })
      
      if (response.ok) {
        // Redirect to success page or dashboard
        window.location.href = '/dashboard?payment=success'
      } else {
        throw new Error('Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of members in the world's most transparent mutual aid network. 
            Your monthly contribution helps create a safety net for everyone.
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              💳 Credit/Debit Card
            </button>
            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                paymentMethod === 'crypto'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              ⟠ Cryptocurrency
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  ${plan.price}
                  <span className="text-lg text-gray-500 font-normal">/month</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isProcessing}
                className={`w-full py-3 px-6 rounded-lg font-medium transition ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  'Choose This Plan'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Security Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Secure Payment Processing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              256-bit SSL encryption
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              PCI DSS compliant
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Treasury Transparency */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 100% Transparent Treasury</h3>
          <p className="text-blue-800 mb-4">
            Every payment is tracked on-chain. See exactly how funds are used to help members in need.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">$12,450</div>
              <div className="text-sm text-blue-700">Current Treasury</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">142</div>
              <div className="text-sm text-blue-700">Active Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-blue-700">Claims Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">2.3</div>
              <div className="text-sm text-blue-700">Avg. Days to Payout</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Can I cancel anytime?</h4>
              <p className="text-gray-600 text-sm mt-1">
                Yes, you can cancel your membership at any time with no penalties or fees.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What if I need help immediately?</h4>
              <p className="text-gray-600 text-sm mt-1">
                Submit a claim and the community will vote. Most urgent claims are processed within 24-48 hours.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Is my payment information secure?</h4>
              <p className="text-gray-600 text-sm mt-1">
                We use bank-level encryption and never store your payment details. All processing is handled by Stripe.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">
            ← Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}