'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BarChart, AlertCircle, Loader2 } from 'lucide-react'

interface AnalyticsData {
  membershipGrowth: Array<{
    month: string
    total: number
    new: number
    churned: number
  }>
  claimsData: Array<{
    month: string
    submitted: number
    approved: number
    amount: number
  }>
  tierDistribution: Array<{
    tier: string
    count: number
    percentage: number
  }>
  riskMetrics: Array<{
    riskLevel: string
    count: number
    amount: number
  }>
  revenueData: Array<{
    month: string
    contributions: number
    expenses: number
    net: number
  }>
  topMetrics: {
    totalMembers: number
    activeMembers: number
    monthlyGrowthRate: number
    totalClaims: number
    approvalRate: number
    avgClaimAmount: number
    treasuryBalance: number
    monthlyRevenue: number
    nftHolders: number
  }
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadAnalyticsData()
    }
  }, [status, session])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load analytics data from API
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }
      const data = await response.json()
      
      // Mock data for now - replace with real API data
      const mockAnalyticsData: AnalyticsData = {
        membershipGrowth: [
          { month: 'Jan 2024', total: 850, new: 120, churned: 15 },
          { month: 'Feb 2024', total: 920, new: 85, churned: 10 },
          { month: 'Mar 2024', total: 1010, new: 105, churned: 12 },
          { month: 'Apr 2024', total: 1080, new: 95, churned: 18 },
          { month: 'May 2024', total: 1150, new: 88, churned: 8 },
          { month: 'Jun 2024', total: 1247, new: 112, churned: 15 }
        ],
        claimsData: [
          { month: 'Jan 2024', submitted: 145, approved: 128, amount: 18500000 },
          { month: 'Feb 2024', submitted: 132, approved: 115, amount: 16200000 },
          { month: 'Mar 2024', submitted: 158, approved: 142, amount: 21300000 },
          { month: 'Apr 2024', submitted: 167, approved: 149, amount: 22800000 },
          { month: 'May 2024', submitted: 173, approved: 156, amount: 24100000 },
          { month: 'Jun 2024', submitted: 189, approved: 168, amount: 26700000 }
        ],
        tierDistribution: [
          { tier: 'BASIC', count: 678, percentage: 54.3 },
          { tier: 'PREMIUM', count: 312, percentage: 25.0 },
          { tier: 'FOUNDER', count: 89, percentage: 7.1 },
          { tier: 'EARLY_ADOPTER', count: 98, percentage: 7.9 },
          { tier: 'VALIDATOR', count: 45, percentage: 3.6 },
          { tier: 'CONTRIBUTOR', count: 25, percentage: 2.0 }
        ],
        riskMetrics: [
          { riskLevel: 'Low', count: 892, amount: 8900000 },
          { riskLevel: 'Medium', count: 267, amount: 5200000 },
          { riskLevel: 'High', count: 88, amount: 1800000 }
        ],
        revenueData: [
          { month: 'Jan 2024', contributions: 1020000, expenses: 185000, net: 835000 },
          { month: 'Feb 2024', contributions: 1104000, expenses: 162000, net: 942000 },
          { month: 'Mar 2024', contributions: 1212000, expenses: 213000, net: 999000 },
          { month: 'Apr 2024', contributions: 1296000, expenses: 228000, net: 1068000 },
          { month: 'May 2024', contributions: 1380000, expenses: 241000, net: 1139000 },
          { month: 'Jun 2024', contributions: 1494000, expenses: 267000, net: 1227000 }
        ],
        topMetrics: {
          totalMembers: 1247,
          activeMembers: 1198,
          monthlyGrowthRate: 8.4,
          totalClaims: 964,
          approvalRate: 88.9,
          avgClaimAmount: 15750, // $157.50 in cents
          treasuryBalance: 12500000, // $125,000 in cents
          monthlyRevenue: 1494000, // $14,940 in cents
          nftHolders: 892
        }
      }

      setAnalyticsData(mockAnalyticsData)

    } catch (error: any) {
      console.error('Failed to load analytics data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      })

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `dao-analytics-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Failed to export report:', error)
      // Show error notification to user
    }
  }

  const handleRefreshData = async () => {
    await loadAnalyticsData()
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You must be signed in to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadAnalyticsData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DAO Analytics</h1>
          <p className="text-gray-600">Performance metrics and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.topMetrics.totalMembers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">
              {analyticsData.topMetrics.activeMembers} active
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analyticsData.topMetrics.monthlyRevenue / 100).toLocaleString()}
            </div>
            <div className="text-sm text-green-600">
              +{analyticsData.topMetrics.monthlyGrowthRate}% growth
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.topMetrics.totalClaims}</div>
            <div className="text-sm text-gray-600">
              {analyticsData.topMetrics.approvalRate}% approval rate
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Treasury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analyticsData.topMetrics.treasuryBalance / 100).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              USDC + MATIC
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}