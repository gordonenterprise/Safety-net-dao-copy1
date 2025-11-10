'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Vote, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Plus,
  Filter
} from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string
  category: string
  status: string
  forVotes: string
  againstVotes: string
  abstainVotes: string
  totalVotes: number
  startTime: string
  endTime: string
  quorumRequired: number
  votingThreshold: number
  proposer: {
    id: string
    name: string
    walletAddress: string
  }
}

interface GovernanceDashboardProps {
  proposals: Proposal[]
  userVotingPower: {
    totalPower: string
    eligibleToVote: boolean
  }
  canCreateProposal: boolean
}

export default function GovernanceDashboard({
  proposals,
  userVotingPower,
  canCreateProposal
}: GovernanceDashboardProps) {
  const [filter, setFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [filteredProposals, setFilteredProposals] = useState(proposals)

  useEffect(() => {
    let filtered = proposals

    if (filter !== 'ALL') {
      filtered = filtered.filter(p => p.status === filter)
    }

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    setFilteredProposals(filtered)
  }, [filter, categoryFilter, proposals])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'SUCCEEDED': return 'bg-blue-100 text-blue-800'
      case 'DEFEATED': return 'bg-red-100 text-red-800'
      case 'EXECUTED': return 'bg-purple-100 text-purple-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TREASURY': return '💰'
      case 'GOVERNANCE': return '⚖️'
      case 'MEMBERSHIP': return '👥'
      case 'CLAIMS': return '📋'
      case 'TECHNICAL': return '⚙️'
      default: return '📋'
    }
  }

  const calculateVotePercentages = (proposal: Proposal) => {
    const total = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes)
    if (total === 0n) return { for: 0, against: 0, abstain: 0 }

    return {
      for: Number((BigInt(proposal.forVotes) * 100n) / total),
      against: Number((BigInt(proposal.againstVotes) * 100n) / total),
      abstain: Number((BigInt(proposal.abstainVotes) * 100n) / total)
    }
  }

  const isVotingActive = (proposal: Proposal) => {
    const now = new Date()
    const start = new Date(proposal.startTime)
    const end = new Date(proposal.endTime)
    return now >= start && now <= end && proposal.status === 'ACTIVE'
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
            <p className="text-gray-600">Participate in DAO decision making</p>
          </div>
          {canCreateProposal && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Proposal
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Vote className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Your Voting Power</p>
                <p className="text-lg font-semibold">
                  {Number(userVotingPower.totalPower).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-lg font-semibold">{proposals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Votes</p>
                <p className="text-lg font-semibold">
                  {proposals.filter(p => p.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-lg font-semibold">
                  {proposals.filter(p => p.status === 'SUCCEEDED' || p.status === 'EXECUTED').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="DEFEATED">Defeated</option>
            <option value="EXECUTED">Executed</option>
            <option value="DRAFT">Draft</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="TREASURY">Treasury</option>
            <option value="GOVERNANCE">Governance</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="CLAIMS">Claims</option>
            <option value="TECHNICAL">Technical</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => {
          const percentages = calculateVotePercentages(proposal)
          const votingActive = isVotingActive(proposal)

          return (
            <div key={proposal.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(proposal.category)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    {votingActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 animate-pulse">
                        🔴 LIVE
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {proposal.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {proposal.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>By: {proposal.proposer.name || `${proposal.proposer.walletAddress?.slice(0, 6)}...${proposal.proposer.walletAddress?.slice(-4)}`}</span>
                    <span>•</span>
                    <span>Ends: {format(new Date(proposal.endTime), 'MMM dd, yyyy HH:mm')}</span>
                    <span>•</span>
                    <span>{proposal.totalVotes} votes</span>
                  </div>
                </div>

                <div className="ml-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>

              {/* Vote Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Voting Results</span>
                  <span className="text-gray-500">
                    Quorum: {proposal.quorumRequired}% | Threshold: {proposal.votingThreshold}%
                  </span>
                </div>

                <div className="space-y-2">
                  {/* For Votes */}
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="w-12 text-sm text-gray-600">For</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentages.for}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right font-medium">
                      {percentages.for.toFixed(1)}%
                    </span>
                  </div>

                  {/* Against Votes */}
                  <div className="flex items-center gap-3">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="w-12 text-sm text-gray-600">Against</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentages.against}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right font-medium">
                      {percentages.against.toFixed(1)}%
                    </span>
                  </div>

                  {/* Abstain Votes */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <span className="w-12 text-sm text-gray-600">Abstain</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentages.abstain}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right font-medium">
                      {percentages.abstain.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredProposals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
            <p className="text-gray-600">
              {filter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Be the first to create a proposal!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}