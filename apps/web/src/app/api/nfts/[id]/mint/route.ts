import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger, fraudDetector } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const mintNFTSchema = z.object({
  recipientId: z.string(),
  tokenURI: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/nfts/[id]/mint - Mint NFT to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const nftTemplateId = params.id
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
    const validatedData = mintNFTSchema.parse(body)

    // Check if NFT template exists
    const nftTemplate = await prisma.nFT.findUnique({
      where: { id: nftTemplateId }
    })

    if (!nftTemplate) {
      return NextResponse.json(
        { error: 'NFT template not found' },
        { status: 404 }
      )
    }

    // Check if recipient exists and is an active member
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    if (recipient.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only mint NFTs to active members' },
        { status: 400 }
      )
    }

    // Fraud detection check
    const userIP = request.ip || request.headers.get('x-forwarded-for') || ''
    const fraudCheck = await fraudDetector.checkForFraud(validatedData.recipientId, 'NFT_MINT', {
      nftType: nftTemplate.type,
      nftTier: nftTemplate.tier,
      userIP
    })

    if (fraudCheck.isFraudulent) {
      await auditLogger.logSecurityEvent('FRAUD_DETECTED', {
        userId: validatedData.recipientId,
        action: 'NFT_MINT',
        reason: fraudCheck.reason,
        riskScore: fraudCheck.riskScore
      })

      return NextResponse.json(
        { error: 'Security check failed. Please contact support.' },
        { status: 400 }
      )
    }

    // Check if user already has this type of NFT (for membership/governance tokens)
    if (['MEMBERSHIP', 'GOVERNANCE_TOKEN'].includes(nftTemplate.type)) {
      const existingNFT = await prisma.nFT.findFirst({
        where: {
          ownerId: validatedData.recipientId,
          type: nftTemplate.type,
          tier: nftTemplate.tier
        }
      })

      if (existingNFT) {
        return NextResponse.json(
          { error: `User already has a ${nftTemplate.type} NFT of tier ${nftTemplate.tier}` },
          { status: 400 }
        )
      }
    }

    // Create new NFT instance
    const mintedNFT = await prisma.nFT.create({
      data: {
        name: nftTemplate.name,
        description: nftTemplate.description,
        image: nftTemplate.image,
        type: nftTemplate.type,
        tier: nftTemplate.tier,
        tokenId: `${nftTemplate.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractAddress: nftTemplate.contractAddress,
        tokenURI: validatedData.tokenURI || nftTemplate.image,
        ownerId: validatedData.recipientId,
        transferable: nftTemplate.transferable,
        metadata: {
          ...nftTemplate.metadata,
          ...validatedData.metadata,
          mintedAt: new Date().toISOString(),
          mintedBy: userId,
          templateId: nftTemplateId
        },
        expiresAt: nftTemplate.expiresAt
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            membershipStatus: true
          }
        }
      }
    })

    // Update user's membership status if it's a membership NFT
    if (nftTemplate.type === 'MEMBERSHIP') {
      await prisma.user.update({
        where: { id: validatedData.recipientId },
        data: { 
          membershipTier: nftTemplate.tier || 'BRONZE',
          membershipStatus: 'ACTIVE'
        }
      })
    }

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'NFT_MINT' as any,
      {
        nftId: mintedNFT.id,
        recipientId: validatedData.recipientId,
        nftType: nftTemplate.type,
        nftTier: nftTemplate.tier
      }
    )

    return NextResponse.json(mintedNFT, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('NFT mint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}