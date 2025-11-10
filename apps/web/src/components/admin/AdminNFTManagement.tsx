'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Shield,
  Crown,
  Rocket,
  Scale,
  Wrench,
  Gift,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ArrowUpCircle,
  Ban,
  FileText,
  User,
  Calendar
} from 'lucide-react'

interface MintRequest {
  id: string
  requestedTier: string
  justification: string
  status: string
  documentsUploaded: boolean
  createdAt: string
  reviewedAt?: string
  reviewNotes?: string
  user: {
    id: string
    name: string
    email: string
    walletAddress: string
    joinedAt: string
  }
  reviewer?: {
    id: string
    name: string
    walletAddress: string
  }
}

interface NFT {
  id: string
  tokenId: string
  tier: string
  name: string
  isActive: boolean
  issuedAt: string
  revokedAt?: string
  revokedReason?: string
  votingPowerMultiplier: number
  claimLimitUsd: number
  serialNumber?: number
  owner: {
    id: string
    name: string
    email: string
    walletAddress: string
  }
}

interface AdminNFTManagementProps {
  mintRequests: MintRequest[]
  issuedNFTs: NFT[]
  onReviewRequest: (requestId: string, action: 'APPROVE' | 'REJECT', data: any) => Promise<void>
  onUpgradeNFT: (nftId: string, newTier: string, reason: string) => Promise<void>
  onRevokeNFT: (nftId: string, reason: string) => Promise<void>
}

export default function AdminNFTManagement({
  mintRequests,
  issuedNFTs,
  onReviewRequest,
  onUpgradeNFT,
  onRevokeNFT
}: AdminNFTManagementProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'nfts'>('requests')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<MintRequest | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [reviewNotes, setReviewNotes] = useState('')
  const [approvedTier, setApprovedTier] = useState('')
  const [loading, setLoading] = useState(false)

  // NFT Management states
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [upgradeTier, setUpgradeTier] = useState('')
  const [upgradeReason, setUpgradeReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')

  const tiers = {
    BASIC: { name: "Basic Member", emoji: "🏷️", color: "bg-gray-100 text-gray-800" },
    PREMIUM: { name: "Premium Member", emoji: "💎", color: "bg-blue-100 text-blue-800" },
    FOUNDER: { name: "Founder", emoji: "👑", color: "bg-purple-100 text-purple-800" },
    EARLY_ADOPTER: { name: "Early Adopter", emoji: "🚀", color: "bg-green-100 text-green-800" },
    VALIDATOR: { name: "Validator", emoji: "⚖️", color: "bg-yellow-100 text-yellow-800" },
    CONTRIBUTOR: { name: "Contributor", emoji: "🛠️", color: "bg-red-100 text-red-800" }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'MINTED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = mintRequests.filter(request => {
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus
    const matchesSearch = 
      request.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredNFTs = issuedNFTs.filter(nft => {
    const matchesSearch = 
      nft.owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.owner.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleReviewRequest = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      await onReviewRequest(selectedRequest.id, action, {
        approvedTier: action === 'APPROVE' ? (approvedTier || selectedRequest.requestedTier) : undefined,
        reviewNotes: reviewNotes.trim() || undefined
      })
      
      setShowReviewModal(false)
      setSelectedRequest(null)
      setReviewNotes('')
      setApprovedTier('')
    } catch (error) {
      console.error('Failed to review request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeNFT = async () => {
    if (!selectedNFT || !upgradeTier || !upgradeReason.trim()) return

    setLoading(true)
    try {
      await onUpgradeNFT(selectedNFT.id, upgradeTier, upgradeReason.trim())
      
      setShowUpgradeModal(false)
      setSelectedNFT(null)
      setUpgradeTier('')
      setUpgradeReason('')
    } catch (error) {
      console.error('Failed to upgrade NFT:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeNFT = async () => {
    if (!selectedNFT || !revokeReason.trim()) return

    setLoading(true)
    try {
      await onRevokeNFT(selectedNFT.id, revokeReason.trim())
      
      setShowRevokeModal(false)
      setSelectedNFT(null)
      setRevokeReason('')
    } catch (error) {
      console.error('Failed to revoke NFT:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NFT Management</h1>
          <p className="text-gray-600">Manage membership NFT requests and issued tokens</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-lg font-semibold">
                {mintRequests.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active NFTs</p>
              <p className="text-lg font-semibold">
                {issuedNFTs.filter(nft => nft.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Premium Members</p>
              <p className="text-lg font-semibold">
                {issuedNFTs.filter(nft => nft.isActive && nft.tier !== 'BASIC').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Revoked NFTs</p>
              <p className="text-lg font-semibold">
                {issuedNFTs.filter(nft => !nft.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="inline w-4 h-4 mr-2" />
            Mint Requests ({mintRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'nfts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline w-4 h-4 mr-2" />
            Issued NFTs ({issuedNFTs.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          
          {activeTab === 'requests' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MINTED">Minted</option>
            </select>
          )}

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Search ${activeTab === 'requests' ? 'requests' : 'NFT holders'}...`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'requests' ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {request.user.name || 'Anonymous User'}
                        </h4>
                        <p className="text-sm text-gray-600">{request.user.email}</p>
                        <p className="text-xs text-gray-500">
                          {request.user.walletAddress}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600">Requested Tier:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${tiers[request.requestedTier as keyof typeof tiers]?.color}`}>
                            {tiers[request.requestedTier as keyof typeof tiers]?.emoji} {tiers[request.requestedTier as keyof typeof tiers]?.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Submitted:</span>
                        <p className="text-sm font-medium mt-1">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Justification:</h5>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {request.justification}
                      </p>
                    </div>

                    {request.reviewedAt && request.reviewer && (
                      <div className="text-sm text-gray-600">
                        <span>Reviewed by: {request.reviewer.name || request.reviewer.walletAddress}</span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(request.reviewedAt), 'MMM dd, yyyy')}</span>
                        {request.reviewNotes && (
                          <p className="mt-1 italic">"{request.reviewNotes}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    {request.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setReviewAction('APPROVE')
                            setApprovedTier(request.requestedTier)
                            setShowReviewModal(true)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setReviewAction('REJECT')
                            setShowReviewModal(true)
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        // Could open a detailed view modal
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No mint requests found.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y divide-gray-200">
            {filteredNFTs.map((nft) => (
              <div key={nft.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{tiers[nft.tier as keyof typeof tiers]?.emoji}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{nft.name}</h4>
                        <p className="text-sm text-gray-600">
                          Owner: {nft.owner.name || nft.owner.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Token ID: {nft.tokenId} • {nft.owner.walletAddress}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600">Tier:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${tiers[nft.tier as keyof typeof tiers]?.color}`}>
                            {tiers[nft.tier as keyof typeof tiers]?.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Voting Power:</span>
                        <p className="text-sm font-medium mt-1">{nft.votingPowerMultiplier}x</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Claim Limit:</span>
                        <p className="text-sm font-medium mt-1">${(nft.claimLimitUsd / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${nft.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {nft.isActive ? 'Active' : 'Revoked'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span>Issued: {format(new Date(nft.issuedAt), 'MMM dd, yyyy')}</span>
                      {nft.serialNumber && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Serial #{nft.serialNumber}</span>
                        </>
                      )}
                      {nft.revokedAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-red-600">
                            Revoked: {format(new Date(nft.revokedAt), 'MMM dd, yyyy')}
                          </span>
                          {nft.revokedReason && (
                            <p className="mt-1 text-red-600 italic">Reason: {nft.revokedReason}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {nft.isActive && (
                    <div className="ml-6 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedNFT(nft)
                          setUpgradeTier(nft.tier)
                          setShowUpgradeModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <ArrowUpCircle className="w-4 h-4 inline mr-1" />
                        Upgrade
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNFT(nft)
                          setShowRevokeModal(true)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <Ban className="w-4 h-4 inline mr-1" />
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredNFTs.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No NFTs found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {reviewAction === 'APPROVE' ? 'Approve' : 'Reject'} NFT Request
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <p><strong>User:</strong> {selectedRequest.user.name || selectedRequest.user.email}</p>
                <p><strong>Requested Tier:</strong> {tiers[selectedRequest.requestedTier as keyof typeof tiers]?.name}</p>
                <p><strong>Justification:</strong></p>
                <p className="text-sm text-gray-700 mt-1 bg-white p-3 rounded border">
                  {selectedRequest.justification}
                </p>
              </div>

              {reviewAction === 'APPROVE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved Tier
                  </label>
                  <select
                    value={approvedTier}
                    onChange={(e) => setApprovedTier(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(tiers).map(([key, tier]) => (
                      <option key={key} value={key}>{tier.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes for the user..."
                  maxLength={1000}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewRequest(reviewAction)}
                  className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                    reviewAction === 'APPROVE' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `${reviewAction === 'APPROVE' ? 'Approve' : 'Reject'} Request`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade NFT Tier</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Current:</strong> {tiers[selectedNFT.tier as keyof typeof tiers]?.name}</p>
                <p><strong>Owner:</strong> {selectedNFT.owner.name || selectedNFT.owner.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Tier
                </label>
                <select
                  value={upgradeTier}
                  onChange={(e) => setUpgradeTier(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(tiers).map(([key, tier]) => (
                    <option key={key} value={key}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Upgrade *
                </label>
                <textarea
                  value={upgradeReason}
                  onChange={(e) => setUpgradeReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explain why this upgrade is warranted..."
                  required
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeNFT}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading || !upgradeReason.trim()}
                >
                  {loading ? 'Upgrading...' : 'Upgrade NFT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Revoke NFT</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  <strong>Warning:</strong> This action will permanently revoke the membership NFT and remove all associated benefits.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>NFT:</strong> {selectedNFT.name}</p>
                <p><strong>Owner:</strong> {selectedNFT.owner.name || selectedNFT.owner.email}</p>
                <p><strong>Tier:</strong> {tiers[selectedNFT.tier as keyof typeof tiers]?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Revocation *
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explain why this NFT is being revoked..."
                  required
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeNFT}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={loading || !revokeReason.trim()}
                >
                  {loading ? 'Revoking...' : 'Revoke NFT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}