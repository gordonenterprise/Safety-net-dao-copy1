'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Crown,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

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

interface AdminAnalyticsProps {
  data: AnalyticsData
  onExportReport: (format: 'pdf' | 'csv') => Promise<void>
  onRefreshData: () => Promise<void>
}

export default function AdminAnalytics({
  data,
  onExportReport,
  onRefreshData
}: AdminAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('6months')
  const [refreshing, setRefreshing] = useState(false)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value / 100)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefreshData()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">DAO performance metrics and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 inline mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => onExportReport('pdf')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{data.topMetrics.totalMembers.toLocaleString()}</p>
              <p className={`text-sm ${data.topMetrics.monthlyGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                {data.topMetrics.monthlyGrowthRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatPercentage(data.topMetrics.monthlyGrowthRate)} this month
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Treasury Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.topMetrics.treasuryBalance)}</p>
              <p className="text-sm text-gray-600">Monthly revenue: {formatCurrency(data.topMetrics.monthlyRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Claims Processed</p>
              <p className="text-2xl font-bold text-gray-900">{data.topMetrics.totalClaims.toLocaleString()}</p>
              <p className="text-sm text-green-600">{data.topMetrics.approvalRate.toFixed(1)}% approval rate</p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">NFT Holders</p>
              <p className="text-2xl font-bold text-gray-900">{data.topMetrics.nftHolders.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Avg claim: {formatCurrency(data.topMetrics.avgClaimAmount)}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Growth */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.membershipGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'total' ? 'Total Members' : name === 'new' ? 'New Members' : 'Churned']} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="total" />
              <Line type="monotone" dataKey="new" stroke="#10B981" strokeWidth={2} name="new" />
              <Line type="monotone" dataKey="churned" stroke="#EF4444" strokeWidth={2} name="churned" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Claims Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.claimsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'amount' ? formatCurrency(value as number) : value,
                name === 'submitted' ? 'Submitted' : name === 'approved' ? 'Approved' : 'Amount'
              ]} />
              <Bar dataKey="submitted" fill="#F59E0B" name="submitted" />
              <Bar dataKey="approved" fill="#10B981" name="approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 100).toLocaleString()}`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line type="monotone" dataKey="contributions" stroke="#10B981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Membership Tier Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Tiers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.tierDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tier, percentage }) => `${tier} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {data.tierDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [
                `${value} members (${props.payload.percentage}%)`,
                props.payload.tier
              ]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.riskMetrics.map((metric, index) => {
            const color = index === 0 ? 'text-green-600' : index === 1 ? 'text-yellow-600' : 'text-red-600'
            const bgColor = index === 0 ? 'bg-green-50' : index === 1 ? 'bg-yellow-50' : 'bg-red-50'
            
            return (
              <div key={metric.riskLevel} className={`${bgColor} rounded-lg p-4`}>
                <h4 className={`font-medium ${color}`}>{metric.riskLevel} Risk</h4>
                <p className="text-2xl font-bold text-gray-900">{metric.count}</p>
                <p className="text-sm text-gray-600">
                  Total claims: {formatCurrency(metric.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Months</h3>
          <div className="space-y-3">
            {data.membershipGrowth
              .sort((a, b) => b.new - a.new)
              .slice(0, 5)
              .map((month, index) => (
                <div key={month.month} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{month.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">+{month.new} members</p>
                    <p className="text-sm text-gray-600">{month.total} total</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Trends */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800">Growth Trend</h4>
              <p className="text-sm text-blue-700 mt-1">
                Member growth has been steady with {formatPercentage(data.topMetrics.monthlyGrowthRate)} increase this month.
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800">Claims Health</h4>
              <p className="text-sm text-green-700 mt-1">
                {data.topMetrics.approvalRate.toFixed(1)}% approval rate indicates healthy claim quality.
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800">NFT Adoption</h4>
              <p className="text-sm text-purple-700 mt-1">
                {((data.topMetrics.nftHolders / data.topMetrics.totalMembers) * 100).toFixed(1)}% of members hold membership NFTs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}