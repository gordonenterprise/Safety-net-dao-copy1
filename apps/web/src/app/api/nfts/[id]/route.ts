import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@safetynet/db'
import { SecurityMiddleware, securityConfigs } from '@/lib/security/middleware'
import { getSecuritySystems, performSecurityChecks } from '@/lib/security'
import { z } from 'zod'

const prisma = new PrismaClient()
const { auditLogger } = getSecuritySystems()
const securityMiddleware = new SecurityMiddleware(prisma, auditLogger)

const updateNFTSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  image: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/nfts/[id] - Get specific NFT
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware
    const middleware = securityMiddleware.createMiddleware(securityConfigs.publicAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const nftId = params.id

    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
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

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(nft)

  } catch (error) {
    console.error('NFT GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/nfts/[id] - Update NFT (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const nftId = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if NFT exists
    const existingNFT = await prisma.nFT.findUnique({
      where: { id: nftId }
    })

    if (!existingNFT) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateNFTSchema.parse(body)

    // Update NFT
    const updatedNFT = await prisma.nFT.update({
      where: { id: nftId },
      data: validatedData,
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

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'NFT_UPDATE' as any,
      {
        nftId,
        changes: validatedData
      }
    )

    return NextResponse.json(updatedNFT)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('NFT PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/nfts/[id] - Delete NFT (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply security middleware for admin access
    const middleware = securityMiddleware.createMiddleware(securityConfigs.adminAPI)
    const securityResponse = await middleware(request)
    if (securityResponse.status !== 200) return securityResponse

    const nftId = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if NFT exists
    const existingNFT = await prisma.nFT.findUnique({
      where: { id: nftId }
    })

    if (!existingNFT) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    // Delete NFT
    await prisma.nFT.delete({
      where: { id: nftId }
    })

    // Log the action
    await auditLogger.logUserAction(
      userId,
      'NFT_DELETE' as any,
      { nftId }
    )

    return NextResponse.json({ message: 'NFT deleted successfully' })

  } catch (error) {
    console.error('NFT DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}