'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import confetti from 'canvas-confetti'
import { 
  Shield, 
  Crown, 
  Rocket, 
  Scale, 
  Wrench,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Zap,
  Users,
  TrendingUp,
  Award
} from 'lucide-react'

interface NFTMembershipDashboardProps {
  user: {
    id: string
    name: string
    walletAddress: string
    membershipStatus: string
  }
  nftStatus: {
    nft: any | null
    benefits: any | null
    hasActiveNFT: boolean
    pendingRequest: any | null
  }
  onSubmitMintRequest: (data: any) => Promise<void>
  onSyncNFT: () => Promise<void>
}

export default function NFTMembershipDashboard({
  user,
  nftStatus,
  onSubmitMintRequest,
  onSyncNFT
}: NFTMembershipDashboardProps) {
  const [showMintForm, setShowMintForm] = useState(false)
  const [selectedTier, setSelectedTier] = useState('BASIC')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  const tiers = {
    BASIC: {
      name: "Basic Member",
      emoji: "🏷️",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      benefits: ["Standard voting power", "$500 claim limit", "Basic features"],
      price: "Free",
      description: "Perfect for getting started with SafetyNet DAO"
    },
    PREMIUM: {
      name: "Premium Member", 
      emoji: "💎",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      benefits: ["1.5x voting power", "$1,000 claim limit", "Premium features", "Priority support"],
      price: "Verification Required",
      description: "Enhanced benefits for active members"
    },
    FOUNDER: {
      name: "Founder",
      emoji: "👑", 
      color: "bg-purple-100 text-purple-800 border-purple-200",
      benefits: ["3x voting power", "$2,500 claim limit", "All premium features", "Founder privileges"],
      price: "By Invitation",
      description: "Exclusive tier for founding members"
    },
    EARLY_ADOPTER: {
      name: "Early Adopter",
      emoji: "🚀",
      color: "bg-green-100 text-green-800 border-green-200", 
      benefits: ["2x voting power", "$1,500 claim limit", "Early access features", "Special recognition"],
      price: "Limited Time",
      description: "For early supporters of the DAO"
    },
    VALIDATOR: {
      name: "Validator",
      emoji: "⚖️",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      benefits: ["2.5x voting power", "$2,000 claim limit", "Governance privileges", "Validator rewards"],
      price: "Stake Required", 
      description: "For active governance participants"
    },
    CONTRIBUTOR: {
      name: "Contributor",
      emoji: "🛠️",
      color: "bg-red-100 text-red-800 border-red-200",
      benefits: ["2x voting power", "$1,500 claim limit", "Contributor access", "Recognition rewards"],
      price: "Proof of Work",
      description: "For active community contributors"
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'BASIC': return <Shield className="w-5 h-5" />
      case 'PREMIUM': return <Gift className="w-5 h-5" />
      case 'FOUNDER': return <Crown className="w-5 h-5" />
      case 'EARLY_ADOPTER': return <Rocket className="w-5 h-5" />
      case 'VALIDATOR': return <Scale className="w-5 h-5" />
      case 'CONTRIBUTOR': return <Wrench className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmitMintRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!justification.trim()) return

    setLoading(true)
    try {
      await onSubmitMintRequest({
        requestedTier: selectedTier,
        justification: justification.trim()
      })
      
      setShowMintForm(false)
      setJustification('')
      
      // Celebration for submission
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (error) {
      console.error('Failed to submit mint request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNFT = async () => {
    setLoading(true)
    try {
      await onSyncNFT()
    } catch (error) {
      console.error('Failed to sync NFT:', error)
    } finally {
      setLoading(false)
    }
  }

  // If user has an active NFT
  if (nftStatus.hasActiveNFT && nftStatus.nft) {
    return (
      <div className="space-y-6">
        {/* Active NFT Display */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                {tiers[nftStatus.nft.tier as keyof typeof tiers]?.emoji}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{nftStatus.nft.name}</h2>
                <p className="text-purple-100">{nftStatus.nft.description}</p>
                <p className="text-sm text-purple-200 mt-1">
                  Token ID: {nftStatus.nft.tokenId} • Issued: {format(new Date(nftStatus.nft.issuedAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                Active Member
              </span>
              {nftStatus.nft.serialNumber && (
                <p className="text-sm text-purple-200 mt-1">
                  #{nftStatus.nft.serialNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Voting Power</p>
                <p className="text-lg font-semibold">
                  {nftStatus.nft.votingPowerMultiplier}x Multiplier
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Claim Limit</p>
                <p className="text-lg font-semibold">
                  ${(nftStatus.nft.claimLimitUsd / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Features</p>
                <p className="text-lg font-semibold">
                  {nftStatus.nft.premiumFeatures ? 'Premium' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NFT Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{nftStatus.nft.votingPowerMultiplier}x voting power in governance</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Up to ${(nftStatus.nft.claimLimitUsd / 100).toLocaleString()} claim limit</span>
                </li>
                {nftStatus.nft.governanceAccess && (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Full governance participation</span>
                  </li>
                )}
                {nftStatus.nft.premiumFeatures && (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Premium features access</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Verification</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Verification Level:</span>
                  <span className="font-medium">{nftStatus.nft.verificationLevel}</span>
                </div>
                {nftStatus.nft.verifiedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verified Date:</span>
                    <span className="font-medium">
                      {format(new Date(nftStatus.nft.verifiedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                {nftStatus.nft.verifier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verified By:</span>
                    <span className="font-medium">
                      {nftStatus.nft.verifier.name || 
                       `${nftStatus.nft.verifier.walletAddress?.slice(0, 6)}...${nftStatus.nft.verifier.walletAddress?.slice(-4)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleSyncNFT}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Syncing...' : 'Sync with Blockchain'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If user has a pending request
  if (nftStatus.pendingRequest) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Request Under Review</h2>
              <p className="text-blue-700">Your membership NFT request is being processed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Request Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Requested Tier:</span>
                  <span className="font-medium text-blue-900">
                    {tiers[nftStatus.pendingRequest.requestedTier as keyof typeof tiers]?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nftStatus.pendingRequest.status)}`}>
                    {nftStatus.pendingRequest.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Submitted:</span>
                  <span className="font-medium text-blue-900">
                    {format(new Date(nftStatus.pendingRequest.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-900 mb-2">Your Justification</h4>
              <p className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
                {nftStatus.pendingRequest.justification}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Review Process</h4>
              <p className="text-sm text-gray-600 mt-1">Admin team reviews your request and documentation</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">NFT Minting</h4>
              <p className="text-sm text-gray-600 mt-1">Once approved, your membership NFT will be created</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Full Access</h4>
              <p className="text-sm text-gray-600 mt-1">Enjoy all the benefits of your membership tier</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No NFT, show application form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join SafetyNet DAO</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get your membership NFT and unlock the benefits of our decentralized safety net community
        </p>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(tiers).map(([key, tier]) => (
          <div
            key={key}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
              selectedTier === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTier(key)}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{tier.emoji}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-600">{tier.price}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
            
            <div className="space-y-2">
              {tier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {selectedTier === key && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Application Form */}
      {!showMintForm ? (
        <div className="text-center py-8">
          <button
            onClick={() => setShowMintForm(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply for {tiers[selectedTier as keyof typeof tiers]?.name} NFT
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Application for {tiers[selectedTier as keyof typeof tiers]?.name}
          </h3>
          
          <form onSubmit={handleSubmitMintRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you deserve this membership tier? *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Explain your qualifications, contributions to the community, or reasons for requesting this tier..."
                required
                minLength={50}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {justification.length}/2000 characters (minimum 50)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Application Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Be specific about your contributions or qualifications</li>
                <li>• Higher tiers require stronger justification</li>
                <li>• Applications are reviewed by the admin team</li>
                <li>• Review process typically takes 1-3 business days</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowMintForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || justification.length < 50}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}