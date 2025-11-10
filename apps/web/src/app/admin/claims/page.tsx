'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { FileText, AlertCircle, Loader2 } from 'lucide-react'

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

export default function AdminClaimsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadClaims()
    }
  }, [status, session])

  const loadClaims = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all claims for admin review
      const response = await fetch('/api/admin/claims')
      if (!response.ok) {
        throw new Error('Failed to load claims')
      }
      const data = await response.json()
      
      // Mock data for now - replace with real API data
      const mockClaims: Claim[] = [
        {
          id: 'claim_001',
          claimType: 'EMERGENCY',
          status: 'SUBMITTED',
          amountRequested: 50000, // $500 in cents
          urgencyLevel: 'HIGH',
          description: 'Emergency car repair needed to get to work. Engine failure requires immediate attention to maintain employment.',
          evidenceUrls: ['https://ipfs.io/ipfs/QmExample1', 'https://ipfs.io/ipfs/QmExample2'],
          ipfsCid: 'QmExample1',
          riskScore: 25,
          flaggedReasons: [],
          submittedAt: new Date().toISOString(),
          user: {
            id: 'user_001',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            walletAddress: '0x1234567890123456789012345678901234567890',
            membershipStatus: 'ACTIVE',
            riskScore: 20,
            totalClaimsAmount: 75000,
            claimsCount: 3
          },
          votes: [
            {
              id: 'vote_001',
              vote: 'APPROVE',
              reasoning: 'Documentation looks legitimate, emergency situation verified',
              confidence: 8,
              user: {
                name: 'Bob Smith',
                walletAddress: '0x9876543210987654321098765432109876543210'
              }
            }
          ]
        },
        {
          id: 'claim_002',
          claimType: 'MEDICAL',
          status: 'FLAGGED',
          amountRequested: 120000, // $1200 in cents
          urgencyLevel: 'MEDIUM',
          description: 'Prescription medication costs not covered by insurance. Chronic condition requires ongoing treatment.',
          evidenceUrls: ['https://ipfs.io/ipfs/QmExample3'],
          riskScore: 75,
          flaggedReasons: ['High claim amount relative to membership tier', 'Multiple recent claims from same user'],
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user_002',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            walletAddress: '0x5555555555555555555555555555555555555555',
            membershipStatus: 'ACTIVE',
            riskScore: 65,
            totalClaimsAmount: 300000,
            claimsCount: 8
          },
          votes: [
            {
              id: 'vote_002',
              vote: 'REJECT',
              reasoning: 'Insufficient documentation, concerns about frequency',
              confidence: 6,
              user: {
                name: 'Diana Prince',
                walletAddress: '0x7777777777777777777777777777777777777777'
              }
            },
            {
              id: 'vote_003',
              vote: 'APPROVE',
              reasoning: 'Medical needs are legitimate based on provided evidence',
              confidence: 7,
              user: {
                name: 'Eva Martinez',
                walletAddress: '0x8888888888888888888888888888888888888888'
              }
            }
          ]
        },
        {
          id: 'claim_003',
          claimType: 'HOUSING',
          status: 'UNDER_REVIEW',
          amountRequested: 80000, // $800 in cents
          urgencyLevel: 'CRITICAL',
          description: 'Urgent rent payment to avoid eviction. Lost job due to company layoffs, actively seeking new employment.',
          evidenceUrls: ['https://ipfs.io/ipfs/QmExample4', 'https://ipfs.io/ipfs/QmExample5'],
          riskScore: 40,
          flaggedReasons: [],
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user_003',
            name: 'Frank Wilson',
            email: 'frank@example.com',
            walletAddress: '0x3333333333333333333333333333333333333333',
            membershipStatus: 'ACTIVE',
            riskScore: 35,
            totalClaimsAmount: 80000,
            claimsCount: 1
          },
          votes: []
        }
      ]

      setClaims(mockClaims)

    } catch (error: any) {
      console.error('Failed to load claims:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewClaim = async (
    claimId: string, 
    action: 'APPROVE' | 'REJECT' | 'FLAG', 
    data: any
  ) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to review claim')
      }

      // Reload claims to reflect changes
      await loadClaims()
    } catch (error: any) {
      console.error('Failed to review claim:', error)
      throw error
    }
  }

  const handleBulkAction = async (
    claimIds: string[],
    action: string,
    data?: any
  ) => {
    try {
      const response = await fetch('/api/admin/claims/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          claimIds,
          action,
          ...data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process bulk action')
      }

      // Reload claims to reflect changes
      await loadClaims()
    } catch (error: any) {
      console.error('Failed to process bulk action:', error)
      throw error
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
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
              onClick={loadClaims}
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
          <p className="text-gray-600">Loading claims data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims Administration</h1>
          <p className="text-gray-600">Review and process member claims</p>
        </div>
      </div>

      <div className="grid gap-6">
        {claims.map((claim) => (
          <Card key={claim.id}>
            <CardHeader>
              <CardTitle>Claim #{claim.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Status:</strong> {claim.status}</p>
                  <p><strong>Type:</strong> {claim.claimType}</p>
                  <p><strong>Amount:</strong> ${(claim.amountRequested / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p><strong>User:</strong> {claim.user.name}</p>
                  <p><strong>Risk Score:</strong> {claim.riskScore}</p>
                  <p><strong>Submitted:</strong> {new Date(claim.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4">
                <p><strong>Description:</strong> {claim.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {claims.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-center text-gray-500 py-8">No claims to review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}