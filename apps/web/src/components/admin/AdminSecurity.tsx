'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Lock,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  Search
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface SecurityMetrics {
  overview: {
    totalAlerts: number
    criticalAlerts: number
    activeThreats: number
    blockedAttacks: number
    systemHealth: 'healthy' | 'degraded' | 'unhealthy'
  }
  rateLimiting: {
    totalRequests: number
    blockedRequests: number
    topBlockedIPs: Array<{
      ip: string
      requests: number
      country?: string
    }>
  }
  authentication: {
    totalLogins: number
    failedLogins: number
    suspiciousLogins: number
    activeSessions: number
  }
  fraud: {
    suspiciousActivities: number
    flaggedUsers: number
    blockedTransactions: number
    riskDistribution: Array<{
      level: string
      count: number
      percentage: number
    }>
  }
  audit: {
    totalLogs: number
    criticalEvents: number
    recentActivity: Array<{
      timestamp: string
      action: string
      user: string
      severity: string
    }>
  }
}

interface SecurityAlert {
  id: string
  category: 'SECURITY' | 'FRAUD' | 'PERFORMANCE' | 'SYSTEM'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  timestamp: string
  resolved: boolean
  metadata?: Record<string, any>
}

interface AdminSecurityProps {
  metrics: SecurityMetrics
  alerts: SecurityAlert[]
  onResolveAlert?: (alertId: string) => void
  onRefreshData?: () => void
  onExportLogs?: () => void
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AdminSecurity({ metrics, alerts, onResolveAlert, onRefreshData, onExportLogs }: AdminSecurityProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAlerts = alerts.filter(alert => {
    const matchesCategory = selectedCategory === 'all' || alert.category === selectedCategory
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const matchesSearch = searchQuery === '' || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSeverity && matchesSearch
  })

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'MEDIUM':
        return <Eye className="w-4 h-4 text-yellow-500" />
      case 'LOW':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return <Shield className="w-4 h-4" />
      case 'FRAUD':
        return <AlertTriangle className="w-4 h-4" />
      case 'PERFORMANCE':
        return <Activity className="w-4 h-4" />
      case 'SYSTEM':
        return <Zap className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-gray-600">Monitor security threats and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onExportLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button
            variant="outline"
            onClick={onRefreshData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getHealthStatusColor(metrics.overview.systemHealth)}`}>
              {metrics.overview.systemHealth}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(metrics.overview.totalAlerts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.criticalAlerts} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attacks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(metrics.overview.blockedAttacks)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(metrics.authentication.failedLogins)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.authentication.suspiciousLogins} suspicious
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(metrics.fraud.suspiciousActivities)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.fraud.flaggedUsers} users flagged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limiting Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting & Blocking</CardTitle>
            <div className="flex gap-2">
              {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Requests</span>
                <span className="font-bold">{formatNumber(metrics.rateLimiting.totalRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Blocked Requests</span>
                <span className="font-bold text-red-600">{formatNumber(metrics.rateLimiting.blockedRequests)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Block Rate</span>
                <span className="font-bold">
                  {((metrics.rateLimiting.blockedRequests / metrics.rateLimiting.totalRequests) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metrics.fraud.riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ level, percentage }) => `${level} (${percentage}%)`}
                >
                  {metrics.fraud.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Blocked IPs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Blocked IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.rateLimiting.topBlockedIPs.map((ip, index) => (
              <div key={ip.ip} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{ip.ip}</div>
                    {ip.country && (
                      <div className="text-sm text-gray-500">{ip.country}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{formatNumber(ip.requests)}</div>
                  <div className="text-sm text-gray-500">blocked requests</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Security Alerts</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border rounded-lg w-48"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="SECURITY">Security</option>
                <option value="FRAUD">Fraud</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="SYSTEM">System</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No alerts found matching your criteria
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(alert.category)}
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600">{alert.description}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                        <Badge variant="outline" className="ml-2">
                          {alert.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        alert.severity === 'CRITICAL' ? 'destructive' :
                        alert.severity === 'HIGH' ? 'destructive' :
                        alert.severity === 'MEDIUM' ? 'default' : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    
                    {!alert.resolved ? (
                      <Button
                        size="sm"
                        onClick={() => onResolveAlert?.(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.audit.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(activity.severity)}
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-500">User: {activity.user}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}