'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Shield, AlertCircle, Loader2 } from 'lucide-react'

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

export default function AdminSecurityPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])

  useEffect(() => {
    if (session?.user) {
      loadSecurityData()
    }
  }, [session])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load security metrics and alerts from API
      const [metricsResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/security/metrics'),
        fetch('/api/admin/security/alerts')
      ])

      if (!metricsResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to load security data')
      }

      // Mock data for now - replace with real API data
      const mockMetrics: SecurityMetrics = {
        overview: {
          totalAlerts: 23,
          criticalAlerts: 3,
          activeThreats: 5,
          blockedAttacks: 156,
          systemHealth: 'healthy'
        },
        rateLimiting: {
          totalRequests: 45678,
          blockedRequests: 892,
          topBlockedIPs: [
            { ip: '192.168.1.100', requests: 234, country: 'Unknown' },
            { ip: '10.0.0.15', requests: 187, country: 'Russia' },
            { ip: '172.16.0.5', requests: 145, country: 'China' },
            { ip: '203.0.113.42', requests: 98, country: 'North Korea' },
            { ip: '198.51.100.23', requests: 76, country: 'Iran' }
          ]
        },
        authentication: {
          totalLogins: 1247,
          failedLogins: 89,
          suspiciousLogins: 12,
          activeSessions: 892
        },
        fraud: {
          suspiciousActivities: 34,
          flaggedUsers: 8,
          blockedTransactions: 15,
          riskDistribution: [
            { level: 'Low', count: 234, percentage: 78.5 },
            { level: 'Medium', count: 45, percentage: 15.1 },
            { level: 'High', count: 15, percentage: 5.0 },
            { level: 'Critical', count: 4, percentage: 1.3 }
          ]
        },
        audit: {
          totalLogs: 15678,
          criticalEvents: 23,
          recentActivity: [
            {
              timestamp: '2024-06-15T14:32:00Z',
              action: 'SUSPICIOUS_LOGIN',
              user: 'user_12345',
              severity: 'HIGH'
            },
            {
              timestamp: '2024-06-15T14:28:00Z',
              action: 'RATE_LIMIT_EXCEEDED',
              user: '192.168.1.100',
              severity: 'MEDIUM'
            },
            {
              timestamp: '2024-06-15T14:25:00Z',
              action: 'FRAUD_DETECTED',
              user: 'user_67890',
              severity: 'CRITICAL'
            },
            {
              timestamp: '2024-06-15T14:20:00Z',
              action: 'UNAUTHORIZED_ACCESS',
              user: 'user_54321',
              severity: 'HIGH'
            },
            {
              timestamp: '2024-06-15T14:15:00Z',
              action: 'FAILED_LOGIN',
              user: 'user_98765',
              severity: 'MEDIUM'
            }
          ]
        }
      }

      const mockAlerts: SecurityAlert[] = [
        {
          id: 'alert_001',
          category: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Multiple Failed Login Attempts',
          description: 'User account user_12345 has 15 failed login attempts in the last hour from IP 192.168.1.100',
          timestamp: '2024-06-15T14:30:00Z',
          resolved: false,
          metadata: { userId: 'user_12345', ip: '192.168.1.100', attempts: 15 }
        },
        {
          id: 'alert_002',
          category: 'FRAUD',
          severity: 'HIGH',
          title: 'Suspicious Claim Pattern',
          description: 'User user_67890 has submitted 5 claims in the last 24 hours with similar patterns',
          timestamp: '2024-06-15T13:45:00Z',
          resolved: false,
          metadata: { userId: 'user_67890', claimCount: 5 }
        },
        {
          id: 'alert_003',
          category: 'SECURITY',
          severity: 'HIGH',
          title: 'Rate Limit Abuse',
          description: 'IP address 203.0.113.42 is consistently hitting rate limits across multiple endpoints',
          timestamp: '2024-06-15T13:20:00Z',
          resolved: false,
          metadata: { ip: '203.0.113.42', endpoints: ['claims', 'votes', 'proposals'] }
        },
        {
          id: 'alert_004',
          category: 'SYSTEM',
          severity: 'MEDIUM',
          title: 'Database Connection Pool Warning',
          description: 'Database connection pool is at 85% capacity',
          timestamp: '2024-06-15T12:50:00Z',
          resolved: false,
          metadata: { poolUsage: 85, maxConnections: 100 }
        },
        {
          id: 'alert_005',
          category: 'FRAUD',
          severity: 'CRITICAL',
          title: 'Coordinated Attack Detected',
          description: 'Multiple accounts are voting in coordinated patterns on proposal PROP-2024-15',
          timestamp: '2024-06-15T12:15:00Z',
          resolved: false,
          metadata: { proposalId: 'PROP-2024-15', accountCount: 12 }
        },
        {
          id: 'alert_006',
          category: 'SECURITY',
          severity: 'LOW',
          title: 'VPN Usage Detected',
          description: 'User user_11111 is consistently logging in from VPN addresses',
          timestamp: '2024-06-15T11:30:00Z',
          resolved: true,
          metadata: { userId: 'user_11111', vpnCount: 8 }
        }
      ]

      setMetrics(mockMetrics)
      setAlerts(mockAlerts)

    } catch (error: any) {
      console.error('Failed to load security data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      // Update local state
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      )

    } catch (error: any) {
      console.error('Failed to resolve alert:', error)
      // Show error notification to user
    }
  }

  const handleRefreshData = async () => {
    await loadSecurityData()
  }

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/admin/security/logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Failed to export logs:', error)
      // Show error notification to user
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session.user) {
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
              onClick={loadSecurityData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading security data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600">Monitor threats, alerts, and system security</p>
        </div>
      </div>

      <AdminSecurity
        metrics={metrics}
        alerts={alerts}
        onResolveAlert={handleResolveAlert}
        onRefreshData={handleRefreshData}
        onExportLogs={handleExportLogs}
      />
    </div>
  )
}