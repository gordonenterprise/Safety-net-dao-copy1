'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Vote,
  Clock,
  Users,
  Target,
  MessageSquare,
  ExternalLink
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
  discussionUrl?: string
  tags: string[]
  proposer: {
    id: string
    name: string
    walletAddress: string
  }
}

interface VoteChoice {
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN'
  reason?: string
}

interface VotingComponentProps {
  proposal: Proposal
  userVotingPower: {
    totalPower: string
    eligibleToVote: boolean
  }
  hasVoted: boolean
  userVote?: {
    vote: string
    reason?: string
    votingPower: string
  }
  onVote: (data: VoteChoice) => Promise<void>
}

export default function VotingComponent({
  proposal,
  userVotingPower,
  hasVoted,
  userVote,
  onVote
}: VotingComponentProps) {
  const [selectedVote, setSelectedVote] = useState<'FOR' | 'AGAINST' | 'ABSTAIN' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVoteForm, setShowVoteForm] = useState(false)

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVote) return

    setLoading(true)
    try {
      await onVote({
        vote: selectedVote,
        reason: reason.trim() || undefined
      })
      setShowVoteForm(false)
      setSelectedVote(null)
      setReason('')
    } catch (error) {
      console.error('Failed to cast vote:', error)
    } finally {
      setLoading(false)
    }
  }

  const isVotingActive = () => {
    const now = new Date()
    const start = new Date(proposal.startTime)
    const end = new Date(proposal.endTime)
    return now >= start && now <= end && proposal.status === 'ACTIVE'
  }

  const calculateVotePercentages = () => {
    const total = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes)
    if (total === 0n) return { for: 0, against: 0, abstain: 0 }

    return {
      for: Number((BigInt(proposal.forVotes) * 100n) / total),
      against: Number((BigInt(proposal.againstVotes) * 100n) / total),
      abstain: Number((BigInt(proposal.abstainVotes) * 100n) / total)
    }
  }

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

  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case 'FOR': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'AGAINST': return <XCircle className="w-5 h-5 text-red-600" />
      case 'ABSTAIN': return <MinusCircle className="w-5 h-5 text-gray-600" />
      default: return null
    }
  }

  const percentages = calculateVotePercentages()
  const votingActive = isVotingActive()

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getCategoryIcon(proposal.category)}</span>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                  {proposal.status}
                </span>
                {votingActive && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 animate-pulse">
                    🔴 VOTING ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Quorum: {proposal.quorumRequired}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span>Threshold: {proposal.votingThreshold}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Ends: {format(new Date(proposal.endTime), 'MMM dd, HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Vote className="w-4 h-4" />
            <span>{proposal.totalVotes} votes cast</span>
          </div>
        </div>

        {/* Tags */}
        {proposal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {proposal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            By: {proposal.proposer.name || `${proposal.proposer.walletAddress?.slice(0, 6)}...${proposal.proposer.walletAddress?.slice(-4)}`}
          </span>
          {proposal.discussionUrl && (
            <a
              href={proposal.discussionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <MessageSquare className="w-4 h-4" />
              Discussion
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
        <div className="prose prose-sm max-w-none text-gray-700">
          {proposal.description.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Voting Results */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Voting Results</h2>
        
        <div className="space-y-4">
          {/* For Votes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-20">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">For</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentages.for}%` }}
              />
            </div>
            <div className="text-right min-w-[80px]">
              <div className="text-sm font-semibold">{percentages.for.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">
                {Number(proposal.forVotes).toLocaleString()} votes
              </div>
            </div>
          </div>

          {/* Against Votes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-20">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Against</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentages.against}%` }}
              />
            </div>
            <div className="text-right min-w-[80px]">
              <div className="text-sm font-semibold">{percentages.against.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">
                {Number(proposal.againstVotes).toLocaleString()} votes
              </div>
            </div>
          </div>

          {/* Abstain Votes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-20">
              <MinusCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Abstain</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentages.abstain}%` }}
              />
            </div>
            <div className="text-right min-w-[80px]">
              <div className="text-sm font-semibold">{percentages.abstain.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">
                {Number(proposal.abstainVotes).toLocaleString()} votes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      <div className="p-6">
        {hasVoted ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {getVoteIcon(userVote?.vote || '')}
              <h3 className="font-semibold text-blue-900">You voted: {userVote?.vote}</h3>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              Voting power used: {Number(userVote?.votingPower || 0).toLocaleString()}
            </p>
            {userVote?.reason && (
              <p className="text-sm text-blue-700">
                <strong>Your reasoning:</strong> {userVote.reason}
              </p>
            )}
          </div>
        ) : votingActive && userVotingPower.eligibleToVote ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cast Your Vote</h3>
              <div className="text-sm text-gray-600">
                Your voting power: {Number(userVotingPower.totalPower).toLocaleString()}
              </div>
            </div>

            {!showVoteForm ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setSelectedVote('FOR')
                    setShowVoteForm(true)
                  }}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Vote For
                </button>
                
                <button
                  onClick={() => {
                    setSelectedVote('AGAINST')
                    setShowVoteForm(true)
                  }}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Vote Against
                </button>
                
                <button
                  onClick={() => {
                    setSelectedVote('ABSTAIN')
                    setShowVoteForm(true)
                  }}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <MinusCircle className="w-5 h-5" />
                  Abstain
                </button>
              </div>
            ) : (
              <form onSubmit={handleVoteSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getVoteIcon(selectedVote || '')}
                    <span className="font-semibold">Voting: {selectedVote}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    This will use {Number(userVotingPower.totalPower).toLocaleString()} voting power
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reasoning (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Explain your vote (optional)..."
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/1000 characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVoteForm(false)
                      setSelectedVote(null)
                      setReason('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : !userVotingPower.eligibleToVote ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Not Eligible to Vote</h3>
            <p className="text-sm text-yellow-700">
              You need active membership and voting power to participate in governance.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Voting Closed</h3>
            <p className="text-sm text-gray-600">
              The voting period for this proposal has ended.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}