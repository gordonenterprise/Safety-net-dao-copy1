import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const updateProposalSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(50).max(5000).optional(),
  proposedChanges: z.record(z.any()).optional(),
})

const voteProposalSchema = z.object({
  vote: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  reason: z.string().max(1000).optional(),
  votingPower: z.number().min(0).optional(),
})

// GET /api/governance/[id] - Get specific proposal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const proposalId = params.id

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            membershipStatus: true
          }
        },
        votes: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Calculate vote statistics
    const voteStats = {
      totalVotes: proposal.votes.length,
      forVotes: proposal.votes.filter(v => v.vote === 'FOR').length,
      againstVotes: proposal.votes.filter(v => v.vote === 'AGAINST').length,
      abstainVotes: proposal.votes.filter(v => v.vote === 'ABSTAIN').length,
      totalVotingPower: proposal.votes.reduce((sum, v) => sum + (v.votingPower || 1), 0),
      forVotingPower: proposal.votes.filter(v => v.vote === 'FOR').reduce((sum, v) => sum + (v.votingPower || 1), 0),
      againstVotingPower: proposal.votes.filter(v => v.vote === 'AGAINST').reduce((sum, v) => sum + (v.votingPower || 1), 0)
    }

    // Check if voting period has ended
    const isVotingActive = proposal.status === 'ACTIVE' && 
      proposal.votingEndDate && 
      new Date() < proposal.votingEndDate

    return NextResponse.json({
      ...proposal,
      voteStats,
      isVotingActive
    })

  } catch (error) {
    console.error('Proposal GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/governance/[id] - Update proposal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const proposalId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if proposal exists and user owns it
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    if (existingProposal.proposerId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (existingProposal.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only update draft proposals' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProposalSchema.parse(body)

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: validatedData,
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            membershipStatus: true
          }
        }
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'PROPOSAL_UPDATE' as any,
      {
        proposalId,
        changes: validatedData
      }
    )

    return NextResponse.json(updatedProposal)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Proposal PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/governance/[id] - Delete proposal (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const proposalId = params.id
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if proposal exists and user owns it
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    if (existingProposal.proposerId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (existingProposal.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft proposals' },
        { status: 400 }
      )
    }

    // Delete proposal
    await prisma.proposal.delete({
      where: { id: proposalId }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'PROPOSAL_DELETE' as any,
      { proposalId }
    )

    return NextResponse.json({ message: 'Proposal deleted successfully' })

  } catch (error) {
    console.error('Proposal DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}