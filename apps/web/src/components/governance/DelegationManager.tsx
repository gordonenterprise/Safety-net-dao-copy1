'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Users, 
  UserCheck, 
  ArrowRight, 
  Calendar,
  Shield,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react'

interface Delegation {
  id: string
  delegateId: string
  delegatorId: string
  votingPower: string
  scope: string
  expiresAt?: string
  active: boolean
  delegate: {
    id: string
    name: string
    walletAddress: string
  }
  delegator: {
    id: string
    name: string
    walletAddress: string
  }
}

interface DelegationManagerProps {
  userDelegations: Delegation[] // Delegations user has made
  receivedDelegations: Delegation[] // Delegations received by user
  availableDelegates: Array<{
    id: string
    name: string
    walletAddress: string
    totalDelegatedPower: string
    delegationCount: number
    participationRate: number
  }>
  userVotingPower: {
    totalPower: string
    eligibleToVote: boolean
  }
  onDelegate: (data: any) => Promise<void>
  onRevoke: () => Promise<void>
}

export default function DelegationManager({
  userDelegations,
  receivedDelegations,
  availableDelegates,
  userVotingPower,
  onDelegate,
  onRevoke
}: DelegationManagerProps) {
  const [activeTab, setActiveTab] = useState<'delegate' | 'received'>('delegate')
  const [showDelegateForm, setShowDelegateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState('ALL')
  const [selectedDelegate, setSelectedDelegate] = useState<string>('')
  const [delegationScope, setDelegationScope] = useState('ALL')
  const [expirationDate, setExpirationDate] = useState('')
  const [loading, setLoading] = useState(false)

  const activeDelegation = userDelegations.find(d => d.active)
  const totalReceivedPower = receivedDelegations.reduce((sum, d) => 
    sum + BigInt(d.votingPower), 0n
  )

  const filteredDelegates = availableDelegates.filter(delegate => {
    const matchesSearch = delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         delegate.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDelegate) return

    setLoading(true)
    try {
      await onDelegate({
        delegateId: selectedDelegate,
        scope: delegationScope,
        expiresAt: expirationDate ? new Date(expirationDate) : undefined
      })
      setShowDelegateForm(false)
      setSelectedDelegate('')
      setDelegationScope('ALL')
      setExpirationDate('')
    } catch (error) {
      console.error('Delegation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'TREASURY': return '💰'
      case 'GOVERNANCE': return '⚖️'
      case 'MEMBERSHIP': return '👥'
      case 'CLAIMS': return '📋'
      case 'TECHNICAL': return '⚙️'
      default: return '🌐'
    }
  }

  const getScopeDescription = (scope: string) => {
    switch (scope) {
      case 'TREASURY': return 'Treasury and financial decisions'
      case 'GOVERNANCE': return 'Governance rules and structure'
      case 'MEMBERSHIP': return 'Membership policies and benefits'
      case 'CLAIMS': return 'Claims process and criteria'
      case 'TECHNICAL': return 'Technical updates and integrations'
      default: return 'All proposal categories'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Your Voting Power</p>
              <p className="text-lg font-semibold">
                {Number(userVotingPower.totalPower).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Delegated Power</p>
              <p className="text-lg font-semibold">
                {activeDelegation ? Number(activeDelegation.votingPower).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Received Power</p>
              <p className="text-lg font-semibold">
                {Number(totalReceivedPower).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Delegation Status */}
      {activeDelegation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Active Delegation</h3>
              <p className="text-sm text-blue-700">
                Delegated to: {activeDelegation.delegate.name || 
                `${activeDelegation.delegate.walletAddress.slice(0, 6)}...${activeDelegation.delegate.walletAddress.slice(-4)}`}
              </p>
              <p className="text-sm text-blue-700">
                Scope: {getScopeIcon(activeDelegation.scope)} {getScopeDescription(activeDelegation.scope)}
              </p>
              {activeDelegation.expiresAt && (
                <p className="text-sm text-blue-700">
                  Expires: {format(new Date(activeDelegation.expiresAt), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
            <button
              onClick={onRevoke}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Revoke
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('delegate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'delegate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Delegate Voting Power
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline w-4 h-4 mr-2" />
            Received Delegations ({receivedDelegations.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'delegate' && (
        <div className="space-y-6">
          {/* Delegate Form */}
          {!activeDelegation && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delegate Your Voting Power</h3>
                {!showDelegateForm && (
                  <button
                    onClick={() => setShowDelegateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    New Delegation
                  </button>
                )}
              </div>

              {showDelegateForm && (
                <form onSubmit={handleDelegate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Delegate
                    </label>
                    <select
                      value={selectedDelegate}
                      onChange={(e) => setSelectedDelegate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a delegate...</option>
                      {filteredDelegates.map((delegate) => (
                        <option key={delegate.id} value={delegate.id}>
                          {delegate.name || delegate.walletAddress} 
                          ({delegate.delegationCount} delegations, {delegate.participationRate}% participation)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delegation Scope
                    </label>
                    <select
                      value={delegationScope}
                      onChange={(e) => setDelegationScope(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">🌐 All Proposals</option>
                      <option value="TREASURY">💰 Treasury Only</option>
                      <option value="GOVERNANCE">⚖️ Governance Only</option>
                      <option value="MEMBERSHIP">👥 Membership Only</option>
                      <option value="CLAIMS">📋 Claims Only</option>
                      <option value="TECHNICAL">⚙️ Technical Only</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {getScopeDescription(delegationScope)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date (optional)
                    </label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for permanent delegation
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Important:</p>
                        <p>Delegating your voting power means the delegate can vote on your behalf for the selected scope. You can revoke this delegation at any time.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDelegateForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading || !selectedDelegate}
                    >
                      {loading ? 'Delegating...' : 'Delegate Power'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Available Delegates */}
          {!showDelegateForm && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Delegates</h3>
                
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search delegates..."
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredDelegates.map((delegate) => (
                  <div key={delegate.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {delegate.name || `${delegate.walletAddress.slice(0, 6)}...${delegate.walletAddress.slice(-4)}`}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {delegate.walletAddress}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Delegated Power:</span>
                            <span className="ml-1 font-medium">
                              {Number(delegate.totalDelegatedPower).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Delegations:</span>
                            <span className="ml-1 font-medium">{delegate.delegationCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Participation:</span>
                            <span className="ml-1 font-medium">{delegate.participationRate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {!activeDelegation && (
                        <button
                          onClick={() => {
                            setSelectedDelegate(delegate.id)
                            setShowDelegateForm(true)
                          }}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Delegate
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredDelegates.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No delegates found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'received' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Delegations You've Received</h3>
            <p className="text-sm text-gray-600 mt-1">
              Other members have delegated their voting power to you
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {receivedDelegations.map((delegation) => (
              <div key={delegation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {delegation.delegator.name || 
                      `${delegation.delegator.walletAddress.slice(0, 6)}...${delegation.delegator.walletAddress.slice(-4)}`}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Voting Power: {Number(delegation.votingPower).toLocaleString()}</p>
                      <p>Scope: {getScopeIcon(delegation.scope)} {getScopeDescription(delegation.scope)}</p>
                      {delegation.expiresAt && (
                        <p>Expires: {format(new Date(delegation.expiresAt), 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    delegation.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {delegation.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}

            {receivedDelegations.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>You haven't received any delegations yet.</p>
                <p className="text-sm mt-1">
                  Build your reputation by participating in governance to receive delegations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}