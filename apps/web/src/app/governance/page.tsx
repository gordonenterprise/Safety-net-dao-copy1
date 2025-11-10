'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Plus, Calendar, Users, Vote, CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import RouteGuard from '../../components/auth/RouteGuard'
import FeatureGuard from '../../components/auth/FeatureGuard'

interface Proposal {
  id: string
  title: string
  description: string
  type: 'PARAMETER_CHANGE' | 'POLICY_UPDATE' | 'TREASURY_ALLOCATION' | 'TECHNICAL_UPGRADE' | 'OTHER'
  status: 'DRAFT' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED'
  createdAt: string
  votingEndsAt: string
  proposer: {
    name: string
    role: string
  }
  votes: {
    for: number
    against: number
    abstain: number
  }
  totalVotes: number
  quorumRequired: number
  passThreshold: number
  _count?: {
    comments: number
  }
}

interface GovernanceStats {
  totalProposals: number
  activeProposals: number
  passedProposals: number
  totalVoters: number
  participationRate: number
}

export default function GovernancePage() {
  const { data: session } = useSession()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [stats, setStats] = useState<GovernanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    fetchGovernanceData()
  }, [])

  const fetchGovernanceData = async () => {
    try {
      setLoading(true)
      
      const [proposalsRes, statsRes] = await Promise.all([
        fetch('/api/governance/proposals'),
        fetch('/api/governance/stats')
      ])

      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json()
        setProposals(proposalsData.proposals)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching governance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'ACTIVE': { color: 'bg-blue-100 text-blue-800', icon: Vote },
      'PASSED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'EXECUTED': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT']
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeColors = {
      'PARAMETER_CHANGE': 'bg-purple-100 text-purple-700',
      'POLICY_UPDATE': 'bg-blue-100 text-blue-700',
      'TREASURY_ALLOCATION': 'bg-green-100 text-green-700',
      'TECHNICAL_UPGRADE': 'bg-orange-100 text-orange-700',
      'OTHER': 'bg-gray-100 text-gray-700'
    }

    const label = type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || typeColors['OTHER']}>
        {label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateVotingProgress = (proposal: Proposal) => {
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain
    const quorumProgress = (totalVotes / proposal.quorumRequired) * 100
    const forPercentage = totalVotes > 0 ? (proposal.votes.for / totalVotes) * 100 : 0
    
    return {
      quorumProgress: Math.min(quorumProgress, 100),
      forPercentage,
      againstPercentage: totalVotes > 0 ? (proposal.votes.against / totalVotes) * 100 : 0,
      abstainPercentage: totalVotes > 0 ? (proposal.votes.abstain / totalVotes) * 100 : 0,
      hasQuorum: totalVotes >= proposal.quorumRequired,
      willPass: forPercentage >= proposal.passThreshold
    }
  }

  const filterProposals = (status: string) => {
    switch (status) {
      case 'active':
        return proposals.filter(p => p.status === 'ACTIVE')
      case 'pending':
        return proposals.filter(p => p.status === 'DRAFT')
      case 'completed':
        return proposals.filter(p => ['PASSED', 'REJECTED', 'EXECUTED'].includes(p.status))
      default:
        return proposals
    }
  }

  if (loading) {
    return (
      <RouteGuard requiredRole="MEMBER">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRole="MEMBER">
      <FeatureGuard feature="ENABLE_GOVERNANCE">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DAO Governance</h1>
              <p className="text-gray-600">Participate in community decision-making and proposal voting</p>
            </div>
            <Link href="/governance/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProposals}</p>
                    </div>
                    <Vote className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Voting</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.activeProposals}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.passedProposals}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Voters</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.totalVoters}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Participation</p>
                      <p className="text-2xl font-bold text-indigo-600">{stats.participationRate}%</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Proposals Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active ({proposals.filter(p => p.status === 'ACTIVE').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({proposals.filter(p => p.status === 'DRAFT').length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({proposals.filter(p => ['PASSED', 'REJECTED', 'EXECUTED'].includes(p.status)).length})</TabsTrigger>
              <TabsTrigger value="all">All ({proposals.length})</TabsTrigger>
            </TabsList>

            {/* Active Proposals */}
            <TabsContent value="active" className="space-y-6">
              {filterProposals('active').map((proposal) => {
                const progress = calculateVotingProgress(proposal)
                return (
                  <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                <Link 
                                  href={`/governance/${proposal.id}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {proposal.title}
                                </Link>
                              </h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {proposal.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>By {proposal.proposer.name}</span>
                                <span>•</span>
                                <span>Ends {formatDate(proposal.votingEndsAt)}</span>
                                {proposal._count && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {proposal._count.comments}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {getStatusBadge(proposal.status)}
                              {getTypeBadge(proposal.type)}
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-80 space-y-4">
                          {/* Voting Progress */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Quorum Progress</span>
                              <span>{progress.quorumProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress.quorumProgress} className="h-2" />
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-green-600">{proposal.votes.for}</div>
                                <div>For</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">{proposal.votes.against}</div>
                                <div>Against</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-gray-600">{proposal.votes.abstain}</div>
                                <div>Abstain</div>
                              </div>
                            </div>
                          </div>

                          {/* Voting Status */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {progress.hasQuorum ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Quorum reached
                                </span>
                              ) : (
                                <span className="text-orange-600 font-medium">
                                  Needs {proposal.quorumRequired - (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)} more votes
                                </span>
                              )}
                            </div>
                            
                            <Link href={`/governance/${proposal.id}`}>
                              <Button variant="outline" size="sm">
                                <Vote className="w-4 h-4 mr-2" />
                                Vote
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filterProposals('active').length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Proposals</h3>
                    <p className="text-gray-600 mb-6">There are currently no proposals open for voting.</p>
                    <Link href="/governance/create">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create First Proposal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pending Proposals */}
            <TabsContent value="pending" className="space-y-6">
              {filterProposals('pending').map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <Link 
                            href={`/governance/${proposal.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {proposal.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By {proposal.proposer.name}</span>
                          <span>•</span>
                          <span>Created {formatDate(proposal.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {getTypeBadge(proposal.type)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filterProposals('pending').length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Proposals</h3>
                    <p className="text-gray-600">All proposals are either active or completed.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Completed Proposals */}
            <TabsContent value="completed" className="space-y-6">
              {filterProposals('completed').map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <Link 
                            href={`/governance/${proposal.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {proposal.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By {proposal.proposer.name}</span>
                          <span>•</span>
                          <span>Ended {formatDate(proposal.votingEndsAt)}</span>
                          <span>•</span>
                          <span>{proposal.votes.for + proposal.votes.against + proposal.votes.abstain} votes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {getTypeBadge(proposal.type)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filterProposals('completed').length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Proposals</h3>
                    <p className="text-gray-600">No proposals have been completed yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* All Proposals */}
            <TabsContent value="all" className="space-y-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          <Link 
                            href={`/governance/${proposal.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {proposal.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By {proposal.proposer.name}</span>
                          <span>•</span>
                          <span>{proposal.status === 'ACTIVE' ? 'Ends' : 'Created'} {formatDate(proposal.status === 'ACTIVE' ? proposal.votingEndsAt : proposal.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {getTypeBadge(proposal.type)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </FeatureGuard>
    </RouteGuard>
  )
}