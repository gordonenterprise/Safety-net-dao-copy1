import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger, fraudDetector } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const createNFTSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  image: z.string().url(),
  type: z.enum(['MEMBERSHIP', 'GOVERNANCE_TOKEN', 'ACHIEVEMENT', 'PARTICIPATION_REWARD']),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  metadata: z.record(z.any()).optional(),
  transferable: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
})

const mintNFTSchema = z.object({
  recipientId: z.string(),
  tokenURI: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/nfts - Get all NFTs
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const type = searchParams.get('type')
    const tier = searchParams.get('tier')
    const ownerId = searchParams.get('ownerId')

    const where: any = {}
    if (type) where.type = type
    if (tier) where.tier = tier
    if (ownerId) where.ownerId = ownerId

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
              membershipStatus: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.nFT.count({ where })
    ])

    return NextResponse.json({
      nfts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('NFTs GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/nfts - Create new NFT (admin only)
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createNFTSchema.parse(body)

    // Create NFT template
    const nft = await prisma.nFT.create({
      data: {
        ...validatedData,
        tokenId: `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
        transferable: validatedData.transferable ?? true,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'NFT_CREATE' as any,
      {
        nftId: nft.id,
        name: nft.name,
        type: nft.type
      }
    )

    return NextResponse.json(nft, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('NFT POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}