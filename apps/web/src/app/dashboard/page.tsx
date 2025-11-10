'use client';

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useAccount } from 'wagmi';
import Link from 'next/link';

// Mock data for development
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  membershipTier: 'free', // 'free', 'basic', 'supporter'
  joinDate: new Date('2024-01-15'),
  daoTokens: 0,
  votingPower: 0,
  claimsSubmitted: 0,
  totalStaked: 0,
};

const mockStats = {
  totalMembers: 1247,
  activeProposals: 8,
  totalClaims: 156,
  treasuryValue: '$2.4M',
  avgResponseTime: '2.3 days',
  successRate: '94%'
};

const mockProposals = [
  {
    id: 1,
    title: 'Increase Security Fund Allocation',
    description: 'Proposal to increase the security fund by 15% to better protect members',
    status: 'active',
    votes: 342,
    timeLeft: '5 days',
    isPremium: false
  },
  {
    id: 2,
    title: 'New Partner Integration Protocol',
    description: 'Establish partnerships with additional insurance providers',
    status: 'active',
    votes: 189,
    timeLeft: '12 days',
    isPremium: true
  },
  {
    id: 3,
    title: 'Community Rewards Program',
    description: 'Implement token rewards for active community participation',
    status: 'passed',
    votes: 567,
    timeLeft: 'Closed',
    isPremium: true
  }
];

const mockClaims = [
  {
    id: 1,
    title: 'Smart Contract Exploit',
    amount: '$45,000',
    status: 'approved',
    date: '2024-01-20',
    isPremium: false
  },
  {
    id: 2,
    title: 'DeFi Protocol Hack',
    amount: '$120,000',
    status: 'under-review',
    date: '2024-01-18',
    isPremium: true
  },
  {
    id: 3,
    title: 'Wallet Compromise',
    amount: '$8,500',
    status: 'pending',
    date: '2024-01-15',
    isPremium: true
  }
];

const UpgradePrompt = ({ feature }: { feature: string }) => (
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center max-w-sm mx-4">
      <div className="h-12 w-12 text-yellow-500 mx-auto mb-4">👑</div>
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {feature} is available for Basic and Supporter members
      </p>
      <Link href="/payment">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Upgrade Now →
        </button>
      </Link>
    </div>
  </div>
);

const LockedFeature = ({ children, isLocked, feature }: { children: React.ReactNode, isLocked: boolean, feature: string }) => (
  <div className="relative">
    {children}
    {isLocked && <UpgradePrompt feature={feature} />}
  </div>
);

const AuthWall = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <div className="text-6xl mb-4">🛡️</div>
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Access Member Dashboard
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Sign in to your account or start your membership
      </p>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="space-y-4">
          {/* Sign In Button */}
          <Link href="/auth/signin">
            <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Sign In to Dashboard
            </button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to SafetyNet?</span>
            </div>
          </div>

          {/* Start Membership Button */}
          <Link href="/auth/signup">
            <button className="w-full flex justify-center py-3 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Start Membership
            </button>
          </Link>
        </div>

        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-blue-400">ℹ️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Member Benefits
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Submit and track insurance claims</li>
                    <li>Participate in governance voting</li>
                    <li>Access treasury analytics</li>
                    <li>Community support network</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth wall if not authenticated
  if (!session) {
    return <AuthWall />;
  }

  const user = mockUser;
  const isPaidMember = user.membershipTier === 'basic' || user.membershipTier === 'supporter';

  const getMembershipBadge = () => {
    switch (user.membershipTier) {
      case 'supporter':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">👑 Supporter</span>;
      case 'basic':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">⭐ Basic</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">👥 Free Member</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Member Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getMembershipBadge()}
              {!isPaidMember && (
                <Link href="/payment">
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-colors">
                    👑 Upgrade
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Free Member Notice */}
        {!isPaidMember && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 text-blue-600 mr-4">🛡️</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Free Membership Active
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You have limited access to DAO features. Upgrade to unlock full capabilities including claims submission, governance voting, and premium analytics.
                  </p>
                </div>
              </div>
              <Link href="/payment">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'governance', label: 'Governance' },
                { id: 'claims', label: 'Claims' },
                { id: 'treasury', label: 'Treasury' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'settings', label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">DAO Tokens</p>
                    <p className="text-2xl font-bold text-gray-900">{user.daoTokens}</p>
                  </div>
                  <div className="text-2xl">💰</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!isPaidMember ? 'Earn tokens by upgrading' : '+12 from last month'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Voting Power</p>
                    <p className="text-2xl font-bold text-gray-900">{user.votingPower}%</p>
                  </div>
                  <div className="text-2xl">🗳️</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!isPaidMember ? 'Upgrade to participate' : 'Based on token holdings'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Claims Submitted</p>
                    <p className="text-2xl font-bold text-gray-900">{user.claimsSubmitted}</p>
                  </div>
                  <div className="text-2xl">⚠️</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!isPaidMember ? 'Submit claims with membership' : 'All time'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user.joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-2xl">📅</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Welcome to SafetyNet!
                </p>
              </div>
            </div>

            {/* DAO Overview Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="text-xl mr-2">📈</div>
                <h3 className="text-lg font-semibold">DAO Overview</h3>
              </div>
              <p className="text-gray-600 mb-6">Current state of the SafetyNet DAO</p>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockStats.totalMembers}</div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mockStats.activeProposals}</div>
                  <div className="text-sm text-gray-600">Active Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockStats.totalClaims}</div>
                  <div className="text-sm text-gray-600">Total Claims</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{mockStats.treasuryValue}</div>
                  <div className="text-sm text-gray-600">Treasury Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{mockStats.avgResponseTime}</div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{mockStats.successRate}</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Recent Activity - Limited for free users */}
            <LockedFeature isLocked={!isPaidMember} feature="Activity History">
              <div className={`bg-white rounded-lg shadow p-6 ${!isPaidMember ? 'opacity-50' : ''}`}>
                <div className="flex items-center mb-4">
                  <div className="text-xl mr-2">💬</div>
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <p className="text-gray-600 mb-6">Latest governance and claims activity</p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Proposal #45 approved</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New claim submitted by Member #1234</p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Treasury rebalancing completed</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </LockedFeature>
          </div>
        )}

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-xl mr-2">🗳️</div>
                  <h3 className="text-lg font-semibold">Active Proposals</h3>
                </div>
                {!isPaidMember && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                    🔒 Voting Requires Membership
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-6">Participate in DAO governance and decision making</p>
              <div className="space-y-4">
                {mockProposals.map((proposal) => (
                  <LockedFeature key={proposal.id} isLocked={!isPaidMember && proposal.isPremium} feature="Premium Proposals">
                    <div className={`border rounded-lg p-4 ${!isPaidMember && proposal.isPremium ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{proposal.title}</h4>
                        <div className="flex items-center space-x-2">
                          {proposal.isPremium && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                              👑 Premium
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            proposal.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{proposal.votes} votes • {proposal.timeLeft}</span>
                        {proposal.status === 'active' && (
                          <button 
                            disabled={!isPaidMember}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              !isPaidMember 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {!isPaidMember ? 'Upgrade to Vote' : 'Vote'}
                          </button>
                        )}
                      </div>
                    </div>
                  </LockedFeature>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Insurance Claims</h2>
                <p className="text-gray-600">Submit and track your protection claims</p>
              </div>
              <button 
                disabled={!isPaidMember}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  !isPaidMember 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                📄 {!isPaidMember ? 'Upgrade to Submit' : 'New Claim'}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="text-xl mr-2">⚠️</div>
                <h3 className="text-lg font-semibold">Recent Claims</h3>
                {!isPaidMember && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 ml-2">
                    🔒 Limited Access
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {mockClaims.map((claim) => (
                  <LockedFeature key={claim.id} isLocked={!isPaidMember && claim.isPremium} feature="Premium Claims">
                    <div className={`border rounded-lg p-4 ${!isPaidMember && claim.isPremium ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{claim.title}</h4>
                          <p className="text-sm text-gray-600">Amount: {claim.amount}</p>
                          <p className="text-xs text-gray-500">Submitted: {claim.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {claim.isPremium && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                              👑 Premium
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            claim.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            claim.status === 'under-review' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </LockedFeature>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Treasury Tab */}
        {activeTab === 'treasury' && (
          <LockedFeature isLocked={!isPaidMember} feature="Treasury Analytics">
            <div className={`bg-white rounded-lg shadow p-6 ${!isPaidMember ? 'opacity-50' : ''}`}>
              <div className="flex items-center mb-4">
                <div className="text-xl mr-2">💰</div>
                <h3 className="text-lg font-semibold">Treasury Overview</h3>
              </div>
              <p className="text-gray-600 mb-6">DAO treasury status and your stake</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">$2.4M</div>
                  <div className="text-sm text-gray-600">Total Treasury</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">${user.totalStaked}</div>
                  <div className="text-sm text-gray-600">Your Stake</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">0%</div>
                  <div className="text-sm text-gray-600">Your Share</div>
                </div>
              </div>
              {!isPaidMember && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600 mb-4">Upgrade to participate in treasury staking and earn rewards</p>
                  <Link href="/payment">
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                      Upgrade to Stake
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </LockedFeature>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <LockedFeature isLocked={!isPaidMember} feature="Advanced Analytics">
            <div className={`bg-white rounded-lg shadow p-6 ${!isPaidMember ? 'opacity-50' : ''}`}>
              <div className="flex items-center mb-4">
                <div className="text-xl mr-2">📈</div>
                <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
              </div>
              <p className="text-gray-600 mb-6">Detailed insights and performance metrics</p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h4 className="text-lg font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-gray-600 mb-6">
                  Access detailed performance metrics, trend analysis, and custom reports
                </p>
                {!isPaidMember && (
                  <Link href="/payment">
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors">
                      👑 Upgrade for Analytics
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </LockedFeature>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="text-xl mr-2">⚙️</div>
              <h3 className="text-lg font-semibold">Account Settings</h3>
            </div>
            <p className="text-gray-600 mb-6">Manage your account preferences and membership</p>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input 
                      type="text" 
                      value={user.name} 
                      className="w-full p-2 border rounded-md"
                      disabled={!isPaidMember}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      className="w-full p-2 border rounded-md"
                      disabled={!isPaidMember}
                    />
                  </div>
                </div>
                {!isPaidMember && (
                  <p className="text-sm text-orange-600 mt-2">
                    🔒 Profile editing requires membership upgrade
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Membership Status</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {getMembershipBadge()}
                    </div>
                    <p className="text-sm text-gray-600">
                      {isPaidMember 
                        ? 'You have full access to all DAO features' 
                        : 'Limited access - upgrade to unlock all features'
                      }
                    </p>
                  </div>
                  {!isPaidMember && (
                    <Link href="/payment">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        Upgrade Now
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              <LockedFeature isLocked={!isPaidMember} feature="Notification Preferences">
                <div className={!isPaidMember ? 'opacity-50' : ''}>
                  <h4 className="text-lg font-semibold mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Governance Notifications</span>
                      <input type="checkbox" disabled={!isPaidMember} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Claims Updates</span>
                      <input type="checkbox" disabled={!isPaidMember} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Treasury Alerts</span>
                      <input type="checkbox" disabled={!isPaidMember} />
                    </div>
                  </div>
                </div>
              </LockedFeature>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}