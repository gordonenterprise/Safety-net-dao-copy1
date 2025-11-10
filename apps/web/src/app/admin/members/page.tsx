'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Users, AlertCircle, Loader2 } from 'lucide-react'

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

export default function AdminMembersPage() {
  const { isLoaded, userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    if (isLoaded && userId) {
      loadMembers()
    }
  }, [isLoaded, userId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all members for admin management
      const response = await fetch('/api/admin/members')
      if (!response.ok) {
        throw new Error('Failed to load members')
      }
      const data = await response.json()
      
      // Mock data for now - replace with real API data
      const mockMembers: Member[] = [
        {
          id: 'member_001',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          walletAddress: '0x1234567890123456789012345678901234567890',
          membershipStatus: 'ACTIVE',
          membershipTier: 'PREMIUM',
          joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 25,
          totalClaimsAmount: 150000, // $1500 in cents
          approvedClaimsAmount: 120000,
          claimsCount: 3,
          votingPower: 2,
          nftTokenId: '001',
          verificationLevel: 'VERIFIED',
          paymentStatus: 'CURRENT',
          monthlyContribution: 1500, // $15 in cents
          isAdmin: false,
          isSuspended: false,
          referralCode: 'ALICE2024',
          referredCount: 5
        },
        {
          id: 'member_002',
          name: 'Bob Smith',
          email: 'bob@example.com',
          walletAddress: '0x9876543210987654321098765432109876543210',
          membershipStatus: 'ACTIVE',
          membershipTier: 'FOUNDER',
          joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          riskScore: 15,
          totalClaimsAmount: 50000,
          approvedClaimsAmount: 50000,
          claimsCount: 1,
          votingPower: 5,
          nftTokenId: '042',
          verificationLevel: 'VERIFIED',
          paymentStatus: 'CURRENT',
          monthlyContribution: 2500,
          isAdmin: true,
          isSuspended: false,
          referralCode: 'FOUNDER42',
          referredCount: 12
        },
        {
          id: 'member_003',
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          walletAddress: '0x5555555555555555555555555555555555555555',
          membershipStatus: 'SUSPENDED',
          membershipTier: 'BASIC',
          joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 85,
          totalClaimsAmount: 400000, // $4000 in cents
          approvedClaimsAmount: 200000,
          claimsCount: 8,
          votingPower: 1,
          verificationLevel: 'BASIC',
          paymentStatus: 'OVERDUE',
          monthlyContribution: 800,
          isAdmin: false,
          isSuspended: true,
          notes: 'Suspended for suspicious claim patterns and payment issues',
          referralCode: 'CHARLIE60',
          referredCount: 0
        },
        {
          id: 'member_004',
          name: 'Diana Prince',
          email: 'diana@example.com',
          walletAddress: '0x7777777777777777777777777777777777777777',
          membershipStatus: 'ACTIVE',
          membershipTier: 'VALIDATOR',
          joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          riskScore: 20,
          totalClaimsAmount: 75000,
          approvedClaimsAmount: 75000,
          claimsCount: 2,
          votingPower: 3,
          nftTokenId: '089',
          verificationLevel: 'VERIFIED',
          paymentStatus: 'CURRENT',
          monthlyContribution: 2000,
          isAdmin: false,
          isSuspended: false,
          referralCode: 'DIANA120',
          referredCount: 8
        },
        {
          id: 'member_005',
          name: 'Eva Martinez',
          email: 'eva@example.com',
          walletAddress: '0x8888888888888888888888888888888888888888',
          membershipStatus: 'PENDING',
          membershipTier: 'BASIC',
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          riskScore: 35,
          totalClaimsAmount: 0,
          approvedClaimsAmount: 0,
          claimsCount: 0,
          votingPower: 1,
          verificationLevel: 'BASIC',
          paymentStatus: 'PENDING',
          monthlyContribution: 800,
          isAdmin: false,
          isSuspended: false,
          referralCode: 'EVA2024',
          referredCount: 0
        }
      ]

      setMembers(mockMembers)

    } catch (error: any) {
      console.error('Failed to load members:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (memberId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member')
      }

      // Reload members to reflect changes
      await loadMembers()
    } catch (error: any) {
      console.error('Failed to update member:', error)
      throw error
    }
  }

  const handleSuspendMember = async (memberId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to suspend member')
      }

      // Reload members to reflect changes
      await loadMembers()
    } catch (error: any) {
      console.error('Failed to suspend member:', error)
      throw error
    }
  }

  const handleReactivateMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reactivate member')
      }

      // Reload members to reflect changes
      await loadMembers()
    } catch (error: any) {
      console.error('Failed to reactivate member:', error)
      throw error
    }
  }

  const handleDeleteMember = async (memberId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete member')
      }

      // Reload members to reflect changes
      await loadMembers()
    } catch (error: any) {
      console.error('Failed to delete member:', error)
      throw error
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!userId) {
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
              onClick={loadMembers}
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
          <p className="text-gray-600">Loading members data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Administration</h1>
          <p className="text-gray-600">Manage DAO members and their permissions</p>
        </div>
      </div>

      <AdminMemberManagement
        members={members}
        onUpdateMember={handleUpdateMember}
        onSuspendMember={handleSuspendMember}
        onReactivateMember={handleReactivateMember}
        onDeleteMember={handleDeleteMember}
      />
    </div>
  )
}