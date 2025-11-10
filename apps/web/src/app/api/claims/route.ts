import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

// Validation schemas
const createClaimSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['EMERGENCY', 'MEDICAL', 'PROPERTY', 'INCOME_PROTECTION', 'OTHER']),
  requestedAmount: z.number().min(1).max(1000000), // Max $10,000
  attachments: z.array(z.string().url()).optional(),
  evidenceNotes: z.string().max(2000).optional(),
})

const updateClaimSchema = createClaimSchema.partial()

// GET /api/claims - List claims
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.authenticatedAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (userId) where.userId = userId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get user role for access control
    const authHeader = request.headers.get('authorization')
    const userRole = request.headers.get('x-user-role')
    const currentUserId = request.headers.get('x-user-id')

    // Filter based on permissions
    if (userRole !== 'ADMIN' && userRole !== 'VALIDATOR') {
      // Regular users can only see their own claims and public claims
      if (!userId || userId !== currentUserId) {
        where.status = { in: ['COMMUNITY_VOTING', 'APPROVED', 'PAID'] }
      }
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
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
          payout: true
        }
      }),
      prisma.claim.count({ where })
    ])

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Claims GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/claims - Create claim
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createClaimSchema.parse(body)

    // Perform fraud detection
    const fraudAnalysis = await performSecurityChecks(userId, 'claim_create', {
      requestedAmount: validatedData.requestedAmount,
      category: validatedData.category
    })

    if (fraudAnalysis?.autoReject) {
      return NextResponse.json(
        { error: 'Claim creation blocked due to security concerns' },
        { status: 403 }
      )
    }

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        ...validatedData,
        userId,
        riskScore: fraudAnalysis?.riskScore,
        riskFactors: fraudAnalysis ? JSON.stringify(fraudAnalysis.indicators) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            membershipStatus: true
          }
        },
        votes: true
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'CLAIM_CREATE' as any,
      {
        claimId: claim.id,
        requestedAmount: validatedData.requestedAmount,
        category: validatedData.category
      }
    )

    return NextResponse.json(claim, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Claims POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}