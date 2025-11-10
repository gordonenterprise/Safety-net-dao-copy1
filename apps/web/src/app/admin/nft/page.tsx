'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Shield, AlertCircle, Loader2 } from 'lucide-react'

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

export default function AdminNFTPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mintRequests, setMintRequests] = useState<MintRequest[]>([])
  const [issuedNFTs, setIssuedNFTs] = useState<NFT[]>([])

  useEffect(() => {
    if (session?.user) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load mint requests
      const requestsResponse = await fetch('/api/nft/requests')
      if (!requestsResponse.ok) {
        throw new Error('Failed to load mint requests')
      }
      const requestsData = await requestsResponse.json()
      setMintRequests(requestsData.mintRequests || [])

      // Load issued NFTs
      const nftsResponse = await fetch('/api/nft/manage?includeInactive=true')
      if (!nftsResponse.ok) {
        throw new Error('Failed to load NFTs')
      }
      const nftsData = await nftsResponse.json()
      setIssuedNFTs(nftsData.nfts || [])

    } catch (error: any) {
      console.error('Failed to load admin data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewRequest = async (
    requestId: string, 
    action: 'APPROVE' | 'REJECT', 
    data: any
  ) => {
    try {
      const response = await fetch('/api/nft/requests?action=review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          action,
          ...data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to review request')
      }

      // Reload data to reflect changes
      await loadData()
    } catch (error: any) {
      console.error('Failed to review request:', error)
      throw error
    }
  }

  const handleUpgradeNFT = async (
    nftId: string,
    newTier: string,
    reason: string
  ) => {
    try {
      const response = await fetch('/api/nft/manage?action=upgrade', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nftId,
          newTier,
          reason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upgrade NFT')
      }

      // Reload data to reflect changes
      await loadData()
    } catch (error: any) {
      console.error('Failed to upgrade NFT:', error)
      throw error
    }
  }

  const handleRevokeNFT = async (
    nftId: string,
    reason: string
  ) => {
    try {
      const response = await fetch('/api/nft/manage?action=revoke', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nftId,
          reason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke NFT')
      }

      // Reload data to reflect changes
      await loadData()
    } catch (error: any) {
      console.error('Failed to revoke NFT:', error)
      throw error
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
              onClick={loadData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage membership NFTs and requests</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mint Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {mintRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No mint requests found</p>
            ) : (
              <div className="space-y-4">
                {mintRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{request.user.name}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Tier: {request.requestedTier}</p>
                    <p className="text-sm">{request.justification}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issued NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            {issuedNFTs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No NFTs found</p>
            ) : (
              <div className="space-y-4">
                {issuedNFTs.map((nft) => (
                  <div key={nft.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{nft.name}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        nft.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {nft.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Owner: {nft.owner.name} | Tier: {nft.tier}
                    </p>
                    <p className="text-sm text-gray-600">
                      Token ID: {nft.tokenId} | Voting Power: {nft.votingPowerMultiplier}x
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Issued: {new Date(nft.issuedAt).toLocaleDateString()}
                    </p>
                    {nft.revokedAt && (
                      <p className="text-xs text-red-500">
                        Revoked: {new Date(nft.revokedAt).toLocaleDateString()} - {nft.revokedReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}