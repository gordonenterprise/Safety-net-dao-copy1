'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import {
  Settings,
  Shield,
  Database,
  Bell,
  Key,
  Globe,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Copy
} from 'lucide-react'

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

interface AdminSettingsProps {
  config: AdminConfig
  onSaveConfig?: (config: AdminConfig) => void
  onResetConfig?: () => void
  onExportConfig?: () => void
  onImportConfig?: (file: File) => void
}

export default function AdminSettings({ config, onSaveConfig, onResetConfig, onExportConfig, onImportConfig }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [localConfig, setLocalConfig] = useState<AdminConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')

  useEffect(() => {
    setLocalConfig(config)
    setHasChanges(false)
  }, [config])

  const updateConfig = (section: string, field: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof AdminConfig],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSaveConfig?.(localConfig)
    setHasChanges(false)
  }

  const handleReset = () => {
    onResetConfig?.()
    setHasChanges(false)
  }

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'dao_'
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const addApiKey = () => {
    if (!newApiKeyName.trim()) return

    const newKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: generateApiKey(),
      permissions: ['read'],
      createdAt: new Date().toISOString(),
      isActive: true
    }

    updateConfig('api', 'apiKeys', [...localConfig.api.apiKeys, newKey])
    setNewApiKeyName('')
  }

  const removeApiKey = (keyId: string) => {
    updateConfig('api', 'apiKeys', localConfig.api.apiKeys.filter(key => key.id !== keyId))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImportConfig?.(file)
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'membership', name: 'Membership', icon: Users },
    { id: 'claims', name: 'Claims', icon: Database },
    { id: 'treasury', name: 'Treasury', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'api', name: 'API', icon: Key }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DAO Settings</h2>
          <p className="text-gray-600">Configure your DAO parameters and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onExportConfig}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                        activeTab === tab.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <Card>
            <CardContent className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">DAO Name</label>
                      <input
                        type="text"
                        value={localConfig.general.daoName}
                        onChange={(e) => updateConfig('general', 'daoName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Website</label>
                      <input
                        type="url"
                        value={localConfig.general.website}
                        onChange={(e) => updateConfig('general', 'website', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={localConfig.general.description}
                      onChange={(e) => updateConfig('general', 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Email</label>
                      <input
                        type="email"
                        value={localConfig.general.supportEmail}
                        onChange={(e) => updateConfig('general', 'supportEmail', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select
                        value={localConfig.general.timezone}
                        onChange={(e) => updateConfig('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern</option>
                        <option value="PST">Pacific</option>
                        <option value="GMT">GMT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <select
                        value={localConfig.general.currency}
                        onChange={(e) => updateConfig('general', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="ETH">ETH</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">Require Multi-Factor Authentication</label>
                        <p className="text-sm text-gray-600">Require MFA for admin access</p>
                      </div>
                      <Switch
                        checked={localConfig.security.requireMFA}
                        onCheckedChange={(checked) => updateConfig('security', 'requireMFA', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium">Enable Audit Logging</label>
                        <p className="text-sm text-gray-600">Log all admin actions</p>
                      </div>
                      <Switch
                        checked={localConfig.security.enableAuditLog}
                        onCheckedChange={(checked) => updateConfig('security', 'enableAuditLog', checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={localConfig.security.sessionTimeout}
                        onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        value={localConfig.security.maxLoginAttempts}
                        onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* API Settings */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">API Settings</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKeys(!showApiKeys)}
                      >
                        {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showApiKeys ? 'Hide' : 'Show'} Keys
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Enable Public API</label>
                      <p className="text-sm text-gray-600">Allow external access to DAO data</p>
                    </div>
                    <Switch
                      checked={localConfig.api.enablePublicAPI}
                      onCheckedChange={(checked) => updateConfig('api', 'enablePublicAPI', checked)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rate Limit (requests/minute)</label>
                    <input
                      type="number"
                      value={localConfig.api.rateLimit}
                      onChange={(e) => updateConfig('api', 'rateLimit', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg max-w-xs"
                    />
                  </div>

                  {/* API Keys */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">API Keys</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="API key name"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <Button onClick={addApiKey} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Key
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {localConfig.api.apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{apiKey.name}</div>
                            <div className="text-sm text-gray-500">
                              {showApiKeys ? apiKey.key : '•'.repeat(20)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(apiKey.key)}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-400">
                              Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                              {apiKey.lastUsed && ` • Last used: ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                              {apiKey.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeApiKey(apiKey.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional tabs would be implemented similarly */}
              {activeTab === 'membership' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Membership Settings</h3>
                  <p className="text-gray-600">Configure membership tiers and requirements</p>
                  {/* Membership settings content */}
                </div>
              )}

              {activeTab === 'claims' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Claims Settings</h3>
                  <p className="text-gray-600">Configure claim processing and approval rules</p>
                  {/* Claims settings content */}
                </div>
              )}

              {activeTab === 'treasury' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Treasury Settings</h3>
                  <p className="text-gray-600">Configure treasury management and security</p>
                  {/* Treasury settings content */}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Notification Settings</h3>
                  <p className="text-gray-600">Configure alerts and integrations</p>
                  {/* Notifications settings content */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}