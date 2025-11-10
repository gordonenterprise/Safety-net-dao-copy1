'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Settings, AlertCircle, Loader2 } from 'lucide-react'

interface AdminConfig {
  general: {
    daoName: string
    description: string
    website: string
    supportEmail: string
    timezone: string
    currency: string
    language: string
  }
  security: {
    requireMFA: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requirePasswordComplexity: boolean
    allowedDomains: string[]
    ipWhitelist: string[]
    enableAuditLog: boolean
  }
  membership: {
    autoApproveMembers: boolean
    requireInviteCode: boolean
    maxMembersPerTier: {
      BASIC: number
      PREMIUM: number
      FOUNDER: number
    }
    membershipFees: {
      BASIC: number
      PREMIUM: number
      FOUNDER: number
    }
    gracePeriodDays: number
  }
  claims: {
    autoApprovalThreshold: number
    requireMultipleApprovers: boolean
    minApprovers: number
    maxClaimAmount: number
    claimExpirationDays: number
    enableCommunityVoting: boolean
    votingPeriodHours: number
  }
  treasury: {
    multiSigRequired: boolean
    requiredSigners: number
    dailyWithdrawLimit: number
    enableAutomatedPayments: boolean
    backupWallets: string[]
  }
  notifications: {
    emailNotifications: boolean
    slackIntegration: boolean
    discordIntegration: boolean
    webhookUrl: string
    notifyOnClaims: boolean
    notifyOnMembership: boolean
    notifyOnTreasury: boolean
  }
  api: {
    enablePublicAPI: boolean
    rateLimit: number
    apiKeys: Array<{
      id: string
      name: string
      key: string
      permissions: string[]
      createdAt: string
      lastUsed?: string
      isActive: boolean
    }>
  }
}

export default function AdminSettingsPage() {
  const { isLoaded, userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<AdminConfig | null>(null)

  useEffect(() => {
    if (isLoaded && userId) {
      loadConfig()
    }
  }, [isLoaded, userId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load configuration from API
      const response = await fetch('/api/admin/settings')
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      const data = await response.json()
      
      // Mock data for now - replace with real API data
      const mockConfig: AdminConfig = {
        general: {
          daoName: 'Safety Net DAO',
          description: 'A decentralized autonomous organization providing social safety nets through blockchain technology.',
          website: 'https://safetynetdao.org',
          supportEmail: 'support@safetynetdao.org',
          timezone: 'UTC',
          currency: 'USD',
          language: 'en'
        },
        security: {
          requireMFA: true,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          passwordMinLength: 12,
          requirePasswordComplexity: true,
          allowedDomains: ['safetynetdao.org', 'admin.safetynetdao.org'],
          ipWhitelist: [],
          enableAuditLog: true
        },
        membership: {
          autoApproveMembers: false,
          requireInviteCode: true,
          maxMembersPerTier: {
            BASIC: 10000,
            PREMIUM: 5000,
            FOUNDER: 100
          },
          membershipFees: {
            BASIC: 2500, // $25.00 in cents
            PREMIUM: 10000, // $100.00 in cents
            FOUNDER: 50000 // $500.00 in cents
          },
          gracePeriodDays: 30
        },
        claims: {
          autoApprovalThreshold: 10000, // $100.00 in cents
          requireMultipleApprovers: true,
          minApprovers: 2,
          maxClaimAmount: 1000000, // $10,000.00 in cents
          claimExpirationDays: 90,
          enableCommunityVoting: true,
          votingPeriodHours: 72
        },
        treasury: {
          multiSigRequired: true,
          requiredSigners: 3,
          dailyWithdrawLimit: 5000000, // $50,000.00 in cents
          enableAutomatedPayments: true,
          backupWallets: [
            '0x742d35cc6ea8f6c5d9b6e5e3cf4d6b5c8e9a3f2b',
            '0x8a7b6c5d9e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b'
          ]
        },
        notifications: {
          emailNotifications: true,
          slackIntegration: true,
          discordIntegration: false,
          webhookUrl: 'https://hooks.slack.com/services/...',
          notifyOnClaims: true,
          notifyOnMembership: true,
          notifyOnTreasury: true
        },
        api: {
          enablePublicAPI: true,
          rateLimit: 100,
          apiKeys: [
            {
              id: '1',
              name: 'Frontend App',
              key: 'dao_abc123def456ghi789jkl012mno345pqr',
              permissions: ['read', 'write'],
              createdAt: '2024-01-15T10:30:00Z',
              lastUsed: '2024-06-15T14:22:00Z',
              isActive: true
            },
            {
              id: '2',
              name: 'Analytics Service',
              key: 'dao_xyz987wvu654tsr321poi098mnb765cxz',
              permissions: ['read'],
              createdAt: '2024-02-01T09:15:00Z',
              lastUsed: '2024-06-14T11:45:00Z',
              isActive: true
            },
            {
              id: '3',
              name: 'Legacy Integration',
              key: 'dao_qwe456rty789uio012asd345fgh678jkl',
              permissions: ['read'],
              createdAt: '2024-01-01T00:00:00Z',
              isActive: false
            }
          ]
        }
      }

      setConfig(mockConfig)

    } catch (error: any) {
      console.error('Failed to load settings:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (newConfig: AdminConfig) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setConfig(newConfig)
      // Show success notification

    } catch (error: any) {
      console.error('Failed to save settings:', error)
      // Show error notification
    }
  }

  const handleResetConfig = async () => {
    try {
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reset settings')
      }

      await loadConfig()
      // Show success notification

    } catch (error: any) {
      console.error('Failed to reset settings:', error)
      // Show error notification
    }
  }

  const handleExportConfig = () => {
    if (!config) return

    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `dao-config-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const handleImportConfig = async (file: File) => {
    try {
      const text = await file.text()
      const importedConfig = JSON.parse(text)
      
      // Validate config structure
      if (!importedConfig.general || !importedConfig.security) {
        throw new Error('Invalid configuration file format')
      }

      await handleSaveConfig(importedConfig)
      // Show success notification

    } catch (error: any) {
      console.error('Failed to import config:', error)
      // Show error notification
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!userId) {
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
              onClick={loadConfig}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600">Configure DAO parameters and security settings</p>
        </div>
      </div>

      <AdminSettings
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetConfig={handleResetConfig}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />
    </div>
  )
}