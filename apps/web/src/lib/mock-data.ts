// Simple development database mock for testing without full PostgreSQL setup
export const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@safetynet.dao',
    role: 'ADMIN',
    membershipStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    walletAddress: null,
  },
  {
    id: '2', 
    name: 'John Doe',
    email: 'john@example.com',
    role: 'MEMBER',
    membershipStatus: 'ACTIVE',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    walletAddress: '0x742d35Cc6638C0532925a3b8',
  },
  {
    id: '3',
    name: 'Jane Smith', 
    email: 'jane@example.com',
    role: 'MEMBER',
    membershipStatus: 'PENDING',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    walletAddress: null,
  }
]

export const mockClaims = [
  {
    id: '1',
    amount: 150,
    reason: 'Medical Emergency - Urgent Care Visit',
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '2',
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    amount: 75,
    reason: 'Car Repair - Flat Tire',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: '3',
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  }
]

export const mockStats = {
  totalUsers: 156,
  activeMembers: 142,
  pendingClaims: 3,
  totalTreasuryValue: 12450,
  monthlyRevenue: 1136,
  recentSignups: 8
}