'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Download,
  ExternalLink,
  User,
  Calendar,
  DollarSign,
  Shield,
  Flag,
  MessageSquare
} from 'lucide-react'

interface Claim {
  id: string
  claimType: string
  status: string
  amountRequested: number
  amountApproved?: number
  urgencyLevel: string
  description: string
  evidenceUrls: string[]
  ipfsCid?: string
  riskScore: number
  flaggedReasons: string[]
  submittedAt: string
  reviewedAt?: string
  paidAt?: string
  rejectionReason?: string
  user: {
    id: string
    name: string
    email: string
    walletAddress: string
    membershipStatus: string
    riskScore: number
    totalClaimsAmount: number
    claimsCount: number
  }
  reviewer?: {
    id: string
    name: string
    walletAddress: string
  }
  votes: Array<{
    id: string
    vote: string
    reasoning?: string
    confidence: number
    user: {
      name: string
      walletAddress: string
    }
  }>
}

interface AdminClaimsManagementProps {
  claims: Claim[]
  onReviewClaim: (claimId: string, action: 'APPROVE' | 'REJECT' | 'FLAG', data: any) => Promise<void>
  onBulkAction: (claimIds: string[], action: string, data?: any) => Promise<void>
}

export default function AdminClaimsManagement({
  claims,
  onReviewClaim,
  onBulkAction
}: AdminClaimsManagementProps) {
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterRisk, setFilterRisk] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'FLAG'>('APPROVE')
  const [reviewNotes, setReviewNotes] = useState('')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const claimTypes = {
    EMERGENCY: { name: "Emergency", color: "bg-red-100 text-red-800", icon: AlertTriangle },
    MEDICAL: { name: "Medical", color: "bg-blue-100 text-blue-800", icon: Shield },
    HOUSING: { name: "Housing", color: "bg-green-100 text-green-800", icon: FileText },
    EDUCATION: { name: "Education", color: "bg-purple-100 text-purple-800", icon: FileText },
    OTHER: { name: "Other", color: "bg-gray-100 text-gray-800", icon: FileText }
  }

  const urgencyLevels = {
    LOW: { name: "Low", color: "bg-gray-100 text-gray-800" },
    MEDIUM: { name: "Medium", color: "bg-yellow-100 text-yellow-800" },
    HIGH: { name: "High", color: "bg-orange-100 text-orange-800" },
    CRITICAL: { name: "Critical", color: "bg-red-100 text-red-800" }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PAID': return 'bg-purple-100 text-purple-800'
      case 'FLAGGED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = filterStatus === 'ALL' || claim.status === filterStatus
    const matchesRisk = filterRisk === 'ALL' || 
      (filterRisk === 'HIGH' && claim.riskScore >= 70) ||
      (filterRisk === 'MEDIUM' && claim.riskScore >= 40 && claim.riskScore < 70) ||
      (filterRisk === 'LOW' && claim.riskScore < 40)
    const matchesSearch = 
      claim.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesRisk && matchesSearch
  })

  const handleSelectClaim = (claimId: string) => {
    const newSelected = new Set(selectedClaims)
    if (newSelected.has(claimId)) {
      newSelected.delete(claimId)
    } else {
      newSelected.add(claimId)
    }
    setSelectedClaims(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedClaims.size === filteredClaims.length) {
      setSelectedClaims(new Set())
    } else {
      setSelectedClaims(new Set(filteredClaims.map(c => c.id)))
    }
  }

  const handleReviewClaim = async (action: 'APPROVE' | 'REJECT' | 'FLAG') => {
    if (!selectedClaim) return

    setLoading(true)
    try {
      const data: any = {
        reviewNotes: reviewNotes.trim() || undefined
      }

      if (action === 'APPROVE' && approvedAmount) {
        data.approvedAmount = parseFloat(approvedAmount) * 100 // Convert to cents
      }

      await onReviewClaim(selectedClaim.id, action, data)
      
      setShowReviewModal(false)
      setSelectedClaim(null)
      setReviewNotes('')
      setApprovedAmount('')
    } catch (error) {
      console.error('Failed to review claim:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedClaims.size === 0) return

    try {
      await onBulkAction(Array.from(selectedClaims), 'APPROVE')
      setSelectedClaims(new Set())
    } catch (error) {
      console.error('Failed to bulk approve:', error)
    }
  }

  const handleBulkReject = async () => {
    if (selectedClaims.size === 0) return

    try {
      await onBulkAction(Array.from(selectedClaims), 'REJECT')
      setSelectedClaims(new Set())
    } catch (error) {
      console.error('Failed to bulk reject:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-600">Review and process member claims</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-lg font-semibold">
                {claims.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length}
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
                {claims.filter(c => c.riskScore >= 70).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Flag className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-lg font-semibold">
                {claims.filter(c => c.status === 'FLAGGED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-lg font-semibold">
                {claims.filter(c => c.status === 'APPROVED' && c.reviewedAt && 
                  new Date(c.reviewedAt).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-lg font-semibold">
                ${(claims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + (c.amountApproved || c.amountRequested), 0) / 100).toLocaleString()}
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
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid</option>
            <option value="FLAGGED">Flagged</option>
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
              placeholder="Search claims, users, or descriptions..."
            />
          </div>

          {selectedClaims.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Bulk Approve ({selectedClaims.size})
              </button>
              <button
                onClick={handleBulkReject}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Bulk Reject ({selectedClaims.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredClaims.length > 0 && selectedClaims.size === filteredClaims.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              {filteredClaims.length} claims ({selectedClaims.size} selected)
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredClaims.map((claim) => {
            const ClaimIcon = claimTypes[claim.claimType as keyof typeof claimTypes]?.icon || FileText

            return (
              <div key={claim.id} className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedClaims.has(claim.id)}
                    onChange={() => handleSelectClaim(claim.id)}
                    className="mt-1 rounded border-gray-300"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ClaimIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {claim.user.name || claim.user.email}
                          </h4>
                          <p className="text-sm text-gray-600">Claim ID: {claim.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${claimTypes[claim.claimType as keyof typeof claimTypes]?.color}`}>
                          {claimTypes[claim.claimType as keyof typeof claimTypes]?.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${urgencyLevels[claim.urgencyLevel as keyof typeof urgencyLevels]?.color}`}>
                          {urgencyLevels[claim.urgencyLevel as keyof typeof urgencyLevels]?.name}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600">Amount Requested:</span>
                        <p className="text-sm font-medium">${(claim.amountRequested / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Risk Score:</span>
                        <p className={`text-sm font-medium ${getRiskColor(claim.riskScore)}`}>
                          {claim.riskScore}/100
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Submitted:</span>
                        <p className="text-sm font-medium">
                          {format(new Date(claim.submittedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Evidence:</span>
                        <p className="text-sm font-medium">
                          {claim.evidenceUrls.length} files
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Description:</h5>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {claim.description}
                      </p>
                    </div>

                    {claim.flaggedReasons.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <h5 className="text-sm font-medium text-red-800 mb-1">Flagged Issues:</h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          {claim.flaggedReasons.map((reason, index) => (
                            <li key={index}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {claim.votes.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Community Votes:</h5>
                        <div className="space-y-2">
                          {claim.votes.slice(0, 3).map((vote) => (
                            <div key={vote.id} className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                vote.vote === 'APPROVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {vote.vote}
                              </span>
                              <span className="text-gray-600">
                                {vote.user.name || vote.user.walletAddress.slice(0, 8)}...
                              </span>
                              <span className="text-gray-500">
                                Confidence: {vote.confidence}/10
                              </span>
                            </div>
                          ))}
                          {claim.votes.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{claim.votes.length - 3} more votes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {claim.reviewedAt && claim.reviewer && (
                      <div className="text-sm text-gray-600">
                        <span>Reviewed by: {claim.reviewer.name || claim.reviewer.walletAddress.slice(0, 8)}...</span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(claim.reviewedAt), 'MMM dd, yyyy')}</span>
                        {claim.rejectionReason && (
                          <p className="mt-1 text-red-600 italic">Reason: {claim.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {(claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW') && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedClaim(claim)
                            setReviewAction('APPROVE')
                            setApprovedAmount((claim.amountRequested / 100).toString())
                            setShowReviewModal(true)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClaim(claim)
                            setReviewAction('REJECT')
                            setShowReviewModal(true)
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClaim(claim)
                            setReviewAction('FLAG')
                            setShowReviewModal(true)
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          Flag
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedClaim(claim)
                        // Could open a detailed view modal
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    {claim.evidenceUrls.length > 0 && (
                      <button
                        onClick={() => window.open(claim.evidenceUrls[0], '_blank')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <ExternalLink className="w-4 h-4 inline mr-1" />
                        Evidence
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredClaims.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No claims found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {reviewAction === 'APPROVE' ? 'Approve' : reviewAction === 'REJECT' ? 'Reject' : 'Flag'} Claim
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Claim Details</h4>
                <p><strong>User:</strong> {selectedClaim.user.name || selectedClaim.user.email}</p>
                <p><strong>Amount:</strong> ${(selectedClaim.amountRequested / 100).toLocaleString()}</p>
                <p><strong>Type:</strong> {claimTypes[selectedClaim.claimType as keyof typeof claimTypes]?.name}</p>
                <p><strong>Risk Score:</strong> {selectedClaim.riskScore}/100</p>
                <p className="mt-2"><strong>Description:</strong></p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {selectedClaim.description}
                </p>
              </div>

              {reviewAction === 'APPROVE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved Amount ($)
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter approved amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {reviewAction === 'REJECT' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={`Add notes for the ${reviewAction.toLowerCase()} decision...`}
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
                  onClick={() => handleReviewClaim(reviewAction)}
                  className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                    reviewAction === 'APPROVE' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : reviewAction === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  disabled={loading || (reviewAction === 'REJECT' && !reviewNotes.trim())}
                >
                  {loading ? 'Processing...' : `${reviewAction} Claim`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}