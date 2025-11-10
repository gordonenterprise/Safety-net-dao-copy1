'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Progress } from '../../components/ui/progress'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart,
  BarChart3,
  Download
} from 'lucide-react'
import RouteGuard from '../../components/auth/RouteGuard'
import FeatureGuard from '../../components/auth/FeatureGuard'

interface TreasuryStats {
  totalBalance: number
  monthlyIncome: number
  monthlyOutgoing: number
  totalMembers: number
  activeClaims: number
  pendingPayouts: number
  burnRate: number
  runwayMonths: number
}

interface Transaction {
  id: string
  type: 'INCOME' | 'PAYOUT' | 'FEE' | 'REFUND'
  amount: number
  description: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

interface FinancialMetrics {
  revenue: {
    thisMonth: number
    lastMonth: number
    change: number
  }
  expenses: {
    thisMonth: number
    lastMonth: number
    change: number
  }
  members: {
    active: number
    new: number
    churned: number
  }
  claims: {
    submitted: number
    approved: number
    totalPaid: number
  }
}

export default function TreasuryPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<TreasuryStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchTreasuryData()
  }, [])

  const fetchTreasuryData = async () => {
    try {
      setLoading(true)
      
      const [statsRes, transactionsRes, metricsRes] = await Promise.all([
        fetch('/api/treasury/stats'),
        fetch('/api/treasury/transactions'),
        fetch('/api/treasury/metrics')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData.transactions)
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Error fetching treasury data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.PENDING}>
        {status}
      </Badge>
    )
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'PAYOUT':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'FEE':
        return <ArrowDownRight className="w-4 h-4 text-orange-600" />
      case 'REFUND':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <RouteGuard requiredRole="ADMIN">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRole="ADMIN">
      <FeatureGuard feature="ENABLE_TREASURY">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Treasury Management</h1>
              <p className="text-gray-600">Monitor DAO finances, member contributions, and claim payouts</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PieChart className="w-4 h-4 mr-2" />
                Financial Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalBalance)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600">
                      {stats.runwayMonths} months runway
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.monthlyIncome)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-green-600">
                      From {stats.totalMembers} active members
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Outgoing</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.monthlyOutgoing)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600">
                      Burn rate: {formatCurrency(stats.burnRate)}/month
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.pendingPayouts)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600">
                      {stats.activeClaims} active claims
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {metrics && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Revenue & Expenses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Performance</CardTitle>
                      <CardDescription>Monthly revenue and expense trends</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Revenue</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(metrics.revenue.thisMonth)}</span>
                            <span className={`text-sm ${metrics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(metrics.revenue.change)}
                            </span>
                          </div>
                        </div>
                        <Progress value={Math.min((metrics.revenue.thisMonth / 10000) * 100, 100)} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Expenses</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(metrics.expenses.thisMonth)}</span>
                            <span className={`text-sm ${metrics.expenses.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(metrics.expenses.change)}
                            </span>
                          </div>
                        </div>
                        <Progress value={Math.min((metrics.expenses.thisMonth / 10000) * 100, 100)} />
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Net Income</span>
                          <span className={`font-bold ${(metrics.revenue.thisMonth - metrics.expenses.thisMonth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metrics.revenue.thisMonth - metrics.expenses.thisMonth)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Member & Claims Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Community Metrics</CardTitle>
                      <CardDescription>Member activity and claims performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{metrics.members.active}</div>
                          <div className="text-xs text-gray-600">Active Members</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">+{metrics.members.new}</div>
                          <div className="text-xs text-gray-600">New This Month</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">-{metrics.members.churned}</div>
                          <div className="text-xs text-gray-600">Churned</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Claims Submitted</span>
                          <span className="font-bold">{metrics.claims.submitted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Claims Approved</span>
                          <span className="font-bold text-green-600">{metrics.claims.approved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Paid Out</span>
                          <span className="font-bold">{formatCurrency(metrics.claims.totalPaid)}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Approval Rate: {metrics.claims.submitted > 0 ? Math.round((metrics.claims.approved / metrics.claims.submitted) * 100) : 0}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>All treasury transactions and fund movements</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(transaction.createdAt).toLocaleDateString()} 
                                {transaction.user && ` • ${transaction.user.name}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                      <p className="text-gray-600">No treasury transactions have been recorded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Analytics</CardTitle>
                  <CardDescription>Detailed financial insights and forecasting</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-600">Advanced financial analytics and forecasting will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Controls Tab */}
            <TabsContent value="controls" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Treasury Controls</CardTitle>
                  <CardDescription>Administrative controls and emergency actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Emergency Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Pause All Payouts
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          Emergency Member Freeze
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Treasury Operations</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="w-4 h-4 mr-2" />
                          Export Financial Data
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Payouts
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </FeatureGuard>
    </RouteGuard>
  )
}