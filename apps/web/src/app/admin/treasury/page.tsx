'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Wallet, AlertCircle, Loader2 } from 'lucide-react'

interface TreasuryData {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  pendingTransactions: number
  transactions: Transaction[]
  balanceHistory: Array<{
    date: string
    balance: number
    income: number
    expenses: number
  }>
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    color: string
  }>
  walletBalances: Array<{
    address: string
    name: string
    balance: number
    network: string
    percentage: number
  }>
}

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CLAIM_PAYOUT'
  amount: number
  description: string
  category: string
  fromAddress?: string
  toAddress?: string
  txHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: string
  confirmedAt?: string
  metadata?: any
}

export default function AdminTreasuryPage() {
  const { isLoaded, userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [treasuryData, setTreasuryData] = useState<TreasuryData | null>(null)

  useEffect(() => {
    if (isLoaded && userId) {
      loadTreasuryData()
    }
  }, [isLoaded, userId])

  const loadTreasuryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load treasury data from API
      const response = await fetch('/api/admin/treasury')
      if (!response.ok) {
        throw new Error('Failed to load treasury data')
      }
      const data = await response.json()
      
      // Mock data for now - replace with real API data
      const mockTreasuryData: TreasuryData = {
        balance: 12500000, // $125,000 in cents
        monthlyIncome: 1494000, // $14,940 in cents
        monthlyExpenses: 267000, // $2,670 in cents
        pendingTransactions: 8,
        balanceHistory: [
          { date: 'Jan 2024', balance: 10200000, income: 1020000, expenses: 185000 },
          { date: 'Feb 2024', balance: 11162000, income: 1104000, expenses: 162000 },
          { date: 'Mar 2024', balance: 12161000, income: 1212000, expenses: 213000 },
          { date: 'Apr 2024', balance: 13229000, income: 1296000, expenses: 228000 },
          { date: 'May 2024', balance: 14368000, income: 1380000, expenses: 241000 },
          { date: 'Jun 2024', balance: 15595000, income: 1494000, expenses: 267000 }
        ],
        categoryBreakdown: [
          { category: 'Claims', amount: 2132000, percentage: 45.2, color: '#3B82F6' },
          { category: 'Operations', amount: 896000, percentage: 19.0, color: '#10B981' },
          { category: 'Development', amount: 658000, percentage: 14.0, color: '#F59E0B' },
          { category: 'Marketing', amount: 425000, percentage: 9.0, color: '#EF4444' },
          { category: 'Governance', amount: 312000, percentage: 6.6, color: '#8B5CF6' },
          { category: 'Security', amount: 289000, percentage: 6.1, color: '#06B6D4' }
        ],
        walletBalances: [
          {
            address: '0x742d35cc6ea8f6c5d9b6e5e3cf4d6b5c8e9a3f2b',
            name: 'Main Treasury',
            balance: 7500000, // $75,000
            network: 'Polygon',
            percentage: 60.0
          },
          {
            address: '0x8a7b6c5d9e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b',
            name: 'Operations Wallet',
            balance: 2500000, // $25,000
            network: 'Base',
            percentage: 20.0
          },
          {
            address: '0x1f2e3d4c5b6a7890fedcba0987654321abcdef12',
            name: 'Emergency Fund',
            balance: 1875000, // $18,750
            network: 'Mainnet',
            percentage: 15.0
          },
          {
            address: '0x9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c',
            name: 'Claims Reserve',
            balance: 625000, // $6,250
            network: 'Polygon',
            percentage: 5.0
          }
        ],
        transactions: [
          {
            id: 'tx_001',
            type: 'CLAIM_PAYOUT',
            amount: 55000,
            description: 'Insurance claim payout #CL-2024-156',
            category: 'claims',
            toAddress: '0x1234567890abcdef1234567890abcdef12345678',
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            status: 'PENDING',
            priority: 'HIGH',
            createdAt: '2024-06-15T10:30:00Z'
          },
          {
            id: 'tx_002',
            type: 'INCOME',
            amount: 125000,
            description: 'Monthly membership contributions',
            category: 'operations',
            fromAddress: '0x9876543210fedcba9876543210fedcba98765432',
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            status: 'CONFIRMED',
            priority: 'MEDIUM',
            createdAt: '2024-06-14T15:45:00Z',
            confirmedAt: '2024-06-14T15:47:30Z'
          },
          {
            id: 'tx_003',
            type: 'EXPENSE',
            amount: 28500,
            description: 'Smart contract audit fee',
            category: 'development',
            toAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
            txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
            status: 'CONFIRMED',
            priority: 'LOW',
            createdAt: '2024-06-13T09:15:00Z',
            confirmedAt: '2024-06-13T09:18:45Z'
          },
          {
            id: 'tx_004',
            type: 'TRANSFER',
            amount: 75000,
            description: 'Transfer to operations wallet',
            category: 'operations',
            fromAddress: '0x742d35cc6ea8f6c5d9b6e5e3cf4d6b5c8e9a3f2b',
            toAddress: '0x8a7b6c5d9e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b',
            txHash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
            status: 'PENDING',
            priority: 'MEDIUM',
            createdAt: '2024-06-12T14:20:00Z'
          },
          {
            id: 'tx_005',
            type: 'CLAIM_PAYOUT',
            amount: 42000,
            description: 'Insurance claim payout #CL-2024-144',
            category: 'claims',
            toAddress: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
            txHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
            status: 'CONFIRMED',
            priority: 'HIGH',
            createdAt: '2024-06-11T11:10:00Z',
            confirmedAt: '2024-06-11T11:12:15Z'
          },
          {
            id: 'tx_006',
            type: 'EXPENSE',
            amount: 15750,
            description: 'Marketing campaign budget',
            category: 'marketing',
            toAddress: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
            status: 'PENDING',
            priority: 'LOW',
            createdAt: '2024-06-10T16:30:00Z'
          },
          {
            id: 'tx_007',
            type: 'INCOME',
            amount: 89500,
            description: 'NFT sales revenue',
            category: 'operations',
            fromAddress: '0x7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d',
            txHash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1',
            status: 'CONFIRMED',
            priority: 'MEDIUM',
            createdAt: '2024-06-09T13:45:00Z',
            confirmedAt: '2024-06-09T13:47:20Z'
          },
          {
            id: 'tx_008',
            type: 'EXPENSE',
            amount: 32000,
            description: 'Infrastructure hosting costs',
            category: 'operations',
            toAddress: '0x6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
            status: 'FAILED',
            priority: 'MEDIUM',
            createdAt: '2024-06-08T08:20:00Z'
          }
        ]
      }

      setTreasuryData(mockTreasuryData)

    } catch (error: any) {
      console.error('Failed to load treasury data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'reject' | 'view') => {
    try {
      if (action === 'view') {
        // Open transaction details modal or page
        console.log('Viewing transaction:', transactionId)
        return
      }

      const response = await fetch(`/api/admin/treasury/transactions/${transactionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} transaction`)
      }

      // Refresh data after action
      await loadTreasuryData()

    } catch (error: any) {
      console.error(`Failed to ${action} transaction:`, error)
      // Show error notification to user
    }
  }

  const handleNewTransaction = () => {
    // Open new transaction modal or page
    console.log('Creating new transaction')
  }

  const handleRefreshData = async () => {
    await loadTreasuryData()
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
              onClick={loadTreasuryData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !treasuryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading treasury data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Wallet className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Treasury Management</h1>
          <p className="text-gray-600">Manage DAO funds and transactions</p>
        </div>
      </div>

      <AdminTreasury
        data={treasuryData}
        onTransactionAction={handleTransactionAction}
        onNewTransaction={handleNewTransaction}
        onRefreshData={handleRefreshData}
      />
    </div>
  )
}