import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger, fraudDetector } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const createProposalSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(5000),
  type: z.enum(['POLICY_CHANGE', 'PARAMETER_UPDATE', 'TREASURY_ALLOCATION', 'MEMBERSHIP_DECISION', 'OTHER']),
  category: z.string().min(1).max(100),
  proposedChanges: z.record(z.any()).optional(),
  requiredQuorum: z.number().min(0.1).max(1).optional(),
  votingPeriodDays: z.number().min(1).max(30).optional(),
})

// GET /api/governance - Get all proposals
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (category) where.category = category

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
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
            }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proposal.count({ where })
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Proposals GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/governance - Create new proposal
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check user eligibility
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active members can create proposals' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProposalSchema.parse(body)

    // Fraud detection check
    const userIP = request.ip || request.headers.get('x-forwarded-for') || ''
    const fraudCheck = await fraudDetector.checkForFraud(userId, 'PROPOSAL_CREATION', {
      title: validatedData.title,
      type: validatedData.type,
      userIP
    })

    if (fraudCheck.isFraudulent) {
      await auditLogger.logSecurityEvent('FRAUD_DETECTED', {
        userId,
        action: 'PROPOSAL_CREATION',
        reason: fraudCheck.reason,
        riskScore: fraudCheck.riskScore
      })

      return NextResponse.json(
        { error: 'Security check failed. Please contact support.' },
        { status: 400 }
      )
    }

    // Create proposal
    const proposal = await prisma.proposal.create({
      data: {
        ...validatedData,
        proposerId: userId,
        status: 'DRAFT',
        requiredQuorum: validatedData.requiredQuorum || 0.6,
        votingPeriodDays: validatedData.votingPeriodDays || 7,
      },
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
      'PROPOSAL_CREATE' as any,
      {
        proposalId: proposal.id,
        title: proposal.title,
        type: proposal.type
      }
    )

    return NextResponse.json(proposal, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Proposal POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}