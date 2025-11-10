'use client'

import { Shield, Users, FileText, Coins, Settings, Crown } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import RouteGuard from '../../components/auth/RouteGuard'
import FeatureGuard from '../../components/auth/FeatureGuard'
import RoleBadge from '../../components/ui/role-badge'
import { useSession } from 'next-auth/react'

// Mock data - replace with real data from APIs
const adminStats = {
  totalMembers: 1247,
  pendingClaims: 23,
  totalNFTs: 892,
  pendingNFTRequests: 8,
  treasuryBalance: 125000,
  monthlyPayouts: 18500
}

export default function AdminDashboard() {
  const quickActions = [
    {
      title: 'NFT Management',
      description: 'Review mint requests and manage membership NFTs',
      href: '/admin/nft',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Claims Review',
      description: 'Review and approve member claims',
      href: '/admin/claims',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Member Management',
      description: 'Manage member accounts and permissions',
      href: '/admin/members',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Treasury',
      description: 'Monitor treasury and financial operations',
      href: '/admin/treasury',
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Governance',
      description: 'Manage proposals and voting',
      href: '/admin/governance',
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Settings',
      description: 'System configuration and settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ]

  const { data: session } = useSession()

  return (
    <RouteGuard requiredRole="ADMIN">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage SafetyNet DAO operations</p>
          </div>
          {session?.user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className="text-sm font-medium">{session.user.email}</span>
              <RoleBadge role={session.user.role} />
            </div>
          )}
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalMembers.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              NFTs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.totalNFTs.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Issued NFTs • {adminStats.pendingNFTRequests} pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.pendingClaims}
            </div>
            <p className="text-sm text-gray-600 mt-1">Pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              Treasury
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${adminStats.treasuryBalance.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${adminStats.monthlyPayouts.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-600" />
              Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats.pendingNFTRequests}
            </div>
            <p className="text-sm text-gray-600 mt-1">NFT mint requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block p-4 rounded-lg border hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent NFT Activity</CardTitle>
            <CardDescription>Latest NFT mints and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Premium NFT minted</p>
                  <p className="text-xs text-gray-600">alice.eth • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mint request submitted</p>
                  <p className="text-xs text-gray-600">bob.eth • 4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Crown className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Founder NFT upgraded</p>
                  <p className="text-xs text-gray-600">charlie.eth • 6 hours ago</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/admin/nft" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all NFT activity →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Latest claim submissions and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Emergency claim pending</p>
                  <p className="text-xs text-gray-600">$500 • 1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Medical claim approved</p>
                  <p className="text-xs text-gray-600">$1,200 • 3 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Housing claim flagged</p>
                  <p className="text-xs text-gray-600">$800 • 5 hours ago</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/admin/claims" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Review all claims →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RouteGuard>
  )
}