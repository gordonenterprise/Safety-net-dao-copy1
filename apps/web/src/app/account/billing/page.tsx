'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, CreditCard, Shield, Crown, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import RouteGuard from '../../../components/auth/RouteGuard'

interface Subscription {
  id: string
  status: string
  plan: string
  amount: number
  currency: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paidAt?: string
  failedAt?: string
}

export default function SubscriptionManagement() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionData()
    }
  }, [session])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll lose access to member benefits at the end of your current billing period.')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchSubscriptionData()
        alert('Your subscription has been cancelled. You\'ll retain access until the end of your current billing period.')
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again or contact support.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/user/subscription/reactivate', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchSubscriptionData()
        alert('Your subscription has been reactivated!')
      } else {
        throw new Error('Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      alert('Failed to reactivate subscription. Please try again or contact support.')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'PAST_DUE':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Past Due</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      case 'UNPAID':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Unpaid</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPlanIcon = (plan: string) => {
    return plan === 'PREMIUM' ? <Crown className="w-5 h-5 text-purple-600" /> : <Shield className="w-5 h-5 text-blue-600" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <RouteGuard requiredRole="MEMBER">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRole="MEMBER">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Management</h1>

        {subscription ? (
          <>
            {/* Current Subscription */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlanIcon(subscription.plan)}
                    <div>
                      <CardTitle>{subscription.plan} Membership</CardTitle>
                      <CardDescription>
                        {formatCurrency(subscription.amount, subscription.currency)} per month
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Billing Period
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Next Payment
                    </h3>
                    <p className="text-gray-600">
                      {subscription.cancelAtPeriodEnd 
                        ? 'Subscription will end on ' + formatDate(subscription.currentPeriodEnd)
                        : formatDate(subscription.currentPeriodEnd)
                      }
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Subscription Ending</h4>
                        <p className="text-yellow-700 mt-1">
                          Your subscription is set to end on {formatDate(subscription.currentPeriodEnd)}. 
                          You can reactivate it at any time before then.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button 
                      onClick={handleReactivateSubscription}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? 'Processing...' : 'Reactivate Subscription'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                      variant="destructive"
                    >
                      {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                    </Button>
                  )}
                  
                  <Button variant="outline">
                    Update Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent subscription payments</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.paidAt ? formatDate(payment.paidAt) : 
                             payment.failedAt ? formatDate(payment.failedAt) : 'Processing'}
                          </div>
                        </div>
                        <div className="text-right">
                          {payment.status === 'SUCCEEDED' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          )}
                          {payment.status === 'FAILED' && (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                          {payment.status === 'PENDING' && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No payment history available.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>You don't have an active membership subscription.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Join SafetyNet DAO to access community-powered financial protection, 
                governance participation, and exclusive member benefits.
              </p>
              <Button asChild>
                <a href="/membership/pricing">View Membership Plans</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RouteGuard>
  )
}