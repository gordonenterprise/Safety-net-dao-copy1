'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Users,
  Eye,
  UserCheck,
  UserX,
  Crown,
  Shield,
  AlertTriangle,
  Filter,
  Search,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  walletAddress: string
  membershipStatus: string
  membershipTier: string
  joinedAt: string
  lastActiveAt: string
  riskScore: number
  totalClaimsAmount: number
  approvedClaimsAmount: number
  claimsCount: number
  votingPower: number
  nftTokenId?: string
  verificationLevel: string
  paymentStatus: string
  monthlyContribution: number
  isAdmin: boolean
  isSuspended: boolean
  notes?: string
  referralCode: string
  referredCount: number
}

interface AdminMemberManagementProps {
  members: Member[]
  onUpdateMember: (memberId: string, updates: any) => Promise<void>
  onSuspendMember: (memberId: string, reason: string) => Promise<void>
  onReactivateMember: (memberId: string) => Promise<void>
  onDeleteMember: (memberId: string, reason: string) => Promise<void>
}

export default function AdminMemberManagement({
  members,
  onUpdateMember,
  onSuspendMember,
  onReactivateMember,
  onDeleteMember
}: AdminMemberManagementProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterTier, setFilterTier] = useState('ALL')
  const [filterRisk, setFilterRisk] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'suspend' | 'delete' | 'promote'>('suspend')
  const [actionReason, setActionReason] = useState('')
  const [loading, setLoading] = useState(false)

  const membershipTiers = {
    BASIC: { name: "Basic", color: "bg-gray-100 text-gray-800", emoji: "🏷️" },
    PREMIUM: { name: "Premium", color: "bg-blue-100 text-blue-800", emoji: "💎" },
    FOUNDER: { name: "Founder", color: "bg-purple-100 text-purple-800", emoji: "👑" },
    EARLY_ADOPTER: { name: "Early Adopter", color: "bg-green-100 text-green-800", emoji: "🚀" },
    VALIDATOR: { name: "Validator", color: "bg-yellow-100 text-yellow-800", emoji: "⚖️" },
    CONTRIBUTOR: { name: "Contributor", color: "bg-red-100 text-red-800", emoji: "🛠️" }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const filteredMembers = members.filter(member => {
    const matchesStatus = filterStatus === 'ALL' || member.membershipStatus === filterStatus
    const matchesTier = filterTier === 'ALL' || member.membershipTier === filterTier
    const matchesRisk = filterRisk === 'ALL' || 
      (filterRisk === 'HIGH' && member.riskScore >= 70) ||
      (filterRisk === 'MEDIUM' && member.riskScore >= 40 && member.riskScore < 70) ||
      (filterRisk === 'LOW' && member.riskScore < 40)
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesTier && matchesRisk && matchesSearch
  })

  const handleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)))
    }
  }

  const handleMemberAction = async (action: 'suspend' | 'delete' | 'promote') => {
    if (!selectedMember) return

    setLoading(true)
    try {
      switch (action) {
        case 'suspend':
          await onSuspendMember(selectedMember.id, actionReason.trim())
          break
        case 'delete':
          await onDeleteMember(selectedMember.id, actionReason.trim())
          break
        case 'promote':
          await onUpdateMember(selectedMember.id, { isAdmin: true })
          break
      }
      
      setShowActionModal(false)
      setSelectedMember(null)
      setActionReason('')
    } catch (error) {
      console.error(`Failed to ${action} member:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600">Manage DAO members and their permissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-lg font-semibold">{members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-lg font-semibold">
                {members.filter(m => m.membershipStatus === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Premium</p>
              <p className="text-lg font-semibold">
                {members.filter(m => m.membershipTier !== 'BASIC').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-lg font-semibold">
                {members.filter(m => m.riskScore >= 70).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <UserX className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-lg font-semibold">
                {members.filter(m => m.isSuspended).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Tiers</option>
            {Object.entries(membershipTiers).map(([key, tier]) => (
              <option key={key} value={key}>{tier.name}</option>
            ))}
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk (70+)</option>
            <option value="MEDIUM">Medium Risk (40-69)</option>
            <option value="LOW">Low Risk (&lt;40)</option>
          </select>

          <div className="flex-1 relative min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search members..."
            />
          </div>

          {selectedMembers.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => console.log('Bulk action needed')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Bulk Actions ({selectedMembers.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              {filteredMembers.length} members ({selectedMembers.size} selected)
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-6">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedMembers.has(member.id)}
                  onChange={() => handleSelectMember(member.id)}
                  className="mt-1 rounded border-gray-300"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {member.isAdmin ? (
                          <Shield className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Users className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {member.name || member.email}
                          </h4>
                          {member.isAdmin && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          {member.walletAddress.slice(0, 10)}...{member.walletAddress.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(member.membershipStatus)}`}>
                        {member.membershipStatus}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${membershipTiers[member.membershipTier as keyof typeof membershipTiers]?.color}`}>
                        {membershipTiers[member.membershipTier as keyof typeof membershipTiers]?.emoji} {membershipTiers[member.membershipTier as keyof typeof membershipTiers]?.name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(member.paymentStatus)}`}>
                        {member.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-600">Joined:</span>
                      <p className="text-sm font-medium">
                        {format(new Date(member.joinedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Risk Score:</span>
                      <p className={`text-sm font-medium ${getRiskColor(member.riskScore)}`}>
                        {member.riskScore}/100
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Claims:</span>
                      <p className="text-sm font-medium">
                        {member.claimsCount} (${(member.totalClaimsAmount / 100).toLocaleString()})
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Voting Power:</span>
                      <p className="text-sm font-medium">{member.votingPower}x</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Monthly:</span>
                      <p className="text-sm font-medium">
                        ${(member.monthlyContribution / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {member.referredCount > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800">
                        <strong>Referrals:</strong> {member.referredCount} members referred
                        <span className="ml-2 text-green-600">Code: {member.referralCode}</span>
                      </p>
                    </div>
                  )}

                  {member.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Admin Notes:</strong> {member.notes}
                      </p>
                    </div>
                  )}

                  {member.isSuspended && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800">
                        <strong>⚠️ Account Suspended</strong>
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <span>Last active: {format(new Date(member.lastActiveAt), 'MMM dd, yyyy')}</span>
                    {member.nftTokenId && (
                      <>
                        <span className="mx-2">•</span>
                        <span>NFT Token: #{member.nftTokenId}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowMemberModal(true)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                  
                  {!member.isSuspended ? (
                    <button
                      onClick={() => {
                        setSelectedMember(member)
                        setActionType('suspend')
                        setShowActionModal(true)
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivateMember(member.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Reactivate
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      // Show more actions menu
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <MoreHorizontal className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No members found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Member Details - {selectedMember.name || selectedMember.email}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Member info content would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedMember.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> {selectedMember.email}</p>
                    <p><strong>Wallet:</strong> {selectedMember.walletAddress}</p>
                    <p><strong>Status:</strong> {selectedMember.membershipStatus}</p>
                    <p><strong>Tier:</strong> {membershipTiers[selectedMember.membershipTier as keyof typeof membershipTiers]?.name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Activity Stats</h3>
                  <div className="space-y-2">
                    <p><strong>Risk Score:</strong> {selectedMember.riskScore}/100</p>
                    <p><strong>Total Claims:</strong> {selectedMember.claimsCount}</p>
                    <p><strong>Claims Amount:</strong> ${(selectedMember.totalClaimsAmount / 100).toLocaleString()}</p>
                    <p><strong>Voting Power:</strong> {selectedMember.votingPower}x</p>
                    <p><strong>Referrals:</strong> {selectedMember.referredCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowMemberModal(false)
                    setActionType('suspend')
                    setShowActionModal(true)
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Suspend Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {actionType === 'suspend' ? 'Suspend' : actionType === 'delete' ? 'Delete' : 'Promote'} Member
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Member:</strong> {selectedMember.name || selectedMember.email}</p>
                <p><strong>Status:</strong> {selectedMember.membershipStatus}</p>
              </div>

              {(actionType === 'suspend' || actionType === 'delete') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={`Explain why this member should be ${actionType}d...`}
                    required
                    maxLength={500}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMemberAction(actionType)}
                  className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                    actionType === 'suspend' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={loading || ((actionType === 'suspend' || actionType === 'delete') && !actionReason.trim())}
                >
                  {loading ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Member`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}