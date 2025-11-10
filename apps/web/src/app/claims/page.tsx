'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import RouteGuard from '../../components/auth/RouteGuard'
import FeatureGuard from '../../components/auth/FeatureGuard'

interface Claim {
  id: string
  title: string
  description: string
  category: string
  requestedAmount: number
  status: string
  priority: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  _count?: {
    votes: number
  }
}

interface ClaimsFilters {
  status: string
  category: string
  priority: string
  search: string
}

export default function ClaimsPage() {
  const { data: session } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ClaimsFilters>({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  })

  useEffect(() => {
    fetchClaims()
  }, [filters])

  const fetchClaims = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.category !== 'all') params.append('category', filters.category)
      if (filters.priority !== 'all') params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/claims?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'SUBMITTED': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'FLAGGED': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'UNDER_REVIEW': { color: 'bg-purple-100 text-purple-800', icon: Eye },
      'VOTING': { color: 'bg-indigo-100 text-indigo-800', icon: Eye },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'DENIED': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'PAID': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['SUBMITTED']
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'LOW': 'bg-gray-100 text-gray-700',
      'NORMAL': 'bg-blue-100 text-blue-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'URGENT': 'bg-red-100 text-red-700'
    }

    return (
      <Badge className={priorityColors[priority as keyof typeof priorityColors] || priorityColors['NORMAL']}>
        {priority}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <RouteGuard requiredRole="MEMBER">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard requiredRole="MEMBER">
      <FeatureGuard feature="ENABLE_CLAIMS">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Claims</h1>
              <p className="text-gray-600">Review and vote on member assistance requests</p>
            </div>
            <Link href="/claims/submit">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Submit Claim
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search claims..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="VOTING">Voting</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="DENIED">Denied</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="MEDICAL">Medical</SelectItem>
                      <SelectItem value="VEHICLE">Vehicle</SelectItem>
                      <SelectItem value="DEVICE">Equipment</SelectItem>
                      <SelectItem value="INCOME_LOSS">Income Loss</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claims List */}
          {claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              <Link 
                                href={`/claims/${claim.id}`}
                                className="hover:text-blue-600 transition-colors"
                              >
                                {claim.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {claim.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span>By {claim.user.name}</span>
                          <span>•</span>
                          <span>{formatDate(claim.createdAt)}</span>
                          <span>•</span>
                          <span className="capitalize">{claim.category.replace('_', ' ').toLowerCase()}</span>
                          {claim._count && (
                            <>
                              <span>•</span>
                              <span>{claim._count.votes} votes</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(claim.requestedAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(claim.status)}
                          {getPriorityBadge(claim.priority)}
                        </div>

                        <Link href={`/claims/${claim.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claims Found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status !== 'all' || filters.category !== 'all' || filters.priority !== 'all'
                    ? 'No claims match your current filters. Try adjusting your search criteria.'
                    : 'No claims have been submitted yet. Be the first to submit a claim!'
                  }
                </p>
                {(!filters.search && filters.status === 'all' && filters.category === 'all' && filters.priority === 'all') && (
                  <Link href="/claims/submit">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Submit First Claim
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Claims Statistics */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Claims Overview</CardTitle>
              <CardDescription>Community claims statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {claims.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'VOTING'].includes(c.status)).length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {claims.filter(c => ['APPROVED', 'PAID'].includes(c.status)).length}
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(claims.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.requestedAmount, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid Out</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {claims.length > 0 ? Math.round((claims.filter(c => ['APPROVED', 'PAID'].includes(c.status)).length / claims.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Approval Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGuard>
    </RouteGuard>
  )
}