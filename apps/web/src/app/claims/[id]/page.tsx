'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, Download, Eye, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { Textarea } from '../../../components/ui/textarea'
import RouteGuard from '../../../components/auth/RouteGuard'
import FeatureGuard from '../../../components/auth/FeatureGuard'

interface ClaimFile {
  id: string
  filename: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

interface ClaimVote {
  id: string
  type: 'APPROVE' | 'DENY'
  reason?: string
  user: {
    id: string
    name: string
    role: string
  }
  createdAt: string
}

interface ClaimComment {
  id: string
  content: string
  user: {
    id: string
    name: string
    role: string
  }
  createdAt: string
}

interface ClaimDetails {
  id: string
  title: string
  description: string
  category: string
  requestedAmount: number
  status: string
  priority: string
  riskScore?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  files: ClaimFile[]
  votes: ClaimVote[]
  comments: ClaimComment[]
}

export default function ClaimDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const claimId = params.id as string

  const [claim, setClaim] = useState<ClaimDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (claimId) {
      fetchClaimDetails()
    }
  }, [claimId])

  const fetchClaimDetails = async () => {
    try {
      const response = await fetch(`/api/claims/${claimId}`)
      if (response.ok) {
        const data = await response.json()
        setClaim(data.claim)
      } else {
        console.error('Failed to fetch claim details')
      }
    } catch (error) {
      console.error('Error fetching claim details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteType: 'APPROVE' | 'DENY', reason?: string) => {
    if (!claim || voting) return

    setVoting(true)
    try {
      const response = await fetch(`/api/claims/${claim.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: voteType,
          reason
        })
      })

      if (response.ok) {
        await fetchClaimDetails() // Refresh the claim data
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit vote')
      }
    } catch (error) {
      console.error('Error voting on claim:', error)
      alert('Failed to submit vote')
    } finally {
      setVoting(false)
    }
  }

  const handleComment = async () => {
    if (!claim || !newComment.trim() || commenting) return

    setCommenting(true)
    try {
      const response = await fetch(`/api/claims/${claim.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      if (response.ok) {
        setNewComment('')
        await fetchClaimDetails() // Refresh the claim data
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to submit comment')
    } finally {
      setCommenting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'SUBMITTED': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'FLAGGED': { color: 'bg-yellow-100 text-yellow-800', label: 'Flagged' },
      'UNDER_REVIEW': { color: 'bg-purple-100 text-purple-800', label: 'Under Review' },
      'VOTING': { color: 'bg-indigo-100 text-indigo-800', label: 'Community Voting' },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'DENIED': { color: 'bg-red-100 text-red-800', label: 'Denied' },
      'PAID': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['SUBMITTED']
    return <Badge className={config.color}>{config.label}</Badge>
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const canVote = (claim: ClaimDetails) => {
    if (!session?.user?.id) return false
    if (claim.user.id === session.user.id) return false // Can't vote on own claim
    if (claim.status !== 'VOTING') return false
    
    // Check if user already voted
    const existingVote = claim.votes.find(vote => vote.user.id === session.user.id)
    return !existingVote
  }

  const getUserVote = (claim: ClaimDetails) => {
    if (!session?.user?.id) return null
    return claim.votes.find(vote => vote.user.id === session.user.id)
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

  if (!claim) {
    return (
      <RouteGuard requiredRole="MEMBER">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Claim Not Found</h1>
            <p className="text-gray-600 mb-6">The requested claim could not be found.</p>
            <Link href="/claims">
              <Button>Back to Claims</Button>
            </Link>
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
          <div className="mb-8">
            <Link href="/claims" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Claims
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{claim.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {claim.user.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(claim.createdAt)}
                  </span>
                  <span className="capitalize">{claim.category.replace('_', ' ').toLowerCase()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(claim.requestedAmount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(claim.status)}
                  {getPriorityBadge(claim.priority)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Claim Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{claim.description}</p>
                </CardContent>
              </Card>

              {/* Files */}
              {claim.files && claim.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attached Files</CardTitle>
                    <CardDescription>Supporting documentation for this claim</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claim.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-medium">{file.filename}</div>
                              <div className="text-sm text-gray-500">
                                {formatFileSize(file.size)} • {file.type}
                              </div>
                            </div>
                          </div>
                          {file.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Voting Section */}
              {claim.status === 'VOTING' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Community Voting</CardTitle>
                    <CardDescription>
                      Community members review and vote on this claim
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {canVote(claim) ? (
                      <div className="space-y-4">
                        <p className="text-gray-600">
                          Please review the claim details and vote based on the provided evidence.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleVote('APPROVE')}
                            disabled={voting}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVote('DENY')}
                            disabled={voting}
                            variant="destructive"
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {getUserVote(claim) ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <ThumbsUp className="w-4 h-4" />
                            You have voted on this claim
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            {claim.user.id === session?.user?.id 
                              ? "You cannot vote on your own claim"
                              : "Voting is not available for this claim"
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>Discussion about this claim</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add Comment */}
                  <div className="mb-6">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-3"
                    />
                    <Button 
                      onClick={handleComment}
                      disabled={commenting || !newComment.trim()}
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {commenting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  {/* Comments List */}
                  <div className="space-y-4">
                    {claim.comments.length > 0 ? (
                      claim.comments.map((comment) => (
                        <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comment.user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {comment.user.role}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Claim Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Claim Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(claim.status)}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <div className="mt-1">{getPriorityBadge(claim.priority)}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <div className="mt-1 capitalize">{claim.category.replace('_', ' ').toLowerCase()}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requested Amount</label>
                    <div className="mt-1 text-lg font-semibold">{formatCurrency(claim.requestedAmount)}</div>
                  </div>
                  
                  {claim.riskScore !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Risk Score</label>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`font-medium ${claim.riskScore > 70 ? 'text-red-600' : claim.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {claim.riskScore}%
                        </span>
                        {claim.riskScore > 70 && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted</label>
                    <div className="mt-1">{formatDate(claim.createdAt)}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <div className="mt-1">{formatDate(claim.updatedAt)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Voting Results */}
              {claim.votes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Voting Results</CardTitle>
                    <CardDescription>{claim.votes.length} votes cast</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claim.votes.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{vote.user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {vote.user.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {vote.type === 'APPROVE' ? (
                              <ThumbsUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <ThumbsDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${vote.type === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                              {vote.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </FeatureGuard>
    </RouteGuard>
  )
}