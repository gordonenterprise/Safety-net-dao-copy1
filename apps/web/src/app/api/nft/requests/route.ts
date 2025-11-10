import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@safetynet/db'
import { canManageNFTs, checkMembershipNFT, mintMembershipNFT } from '@/lib/nft'

// Schema for NFT mint request submission
const MintRequestSchema = z.object({
  requestedTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']),
  justification: z.string().min(50).max(2000),
  additionalInfo: z.string().optional()
})

// Schema for admin review
const ReviewRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  approvedTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']).optional(),
  reviewNotes: z.string().max(1000).optional()
})

// GET: Get all mint requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser || !canManageNFTs(dbUser)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    // Build filter conditions
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (userId) {
      where.userId = userId
    }

    const mintRequests = await prisma.nFTMintRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
            createdAt: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Pending first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ mintRequests })
  } catch (error) {
    console.error('Failed to fetch mint requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Submit new mint request or review existing request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'review') {
      // Admin reviewing a mint request
      if (!canManageNFTs(dbUser)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const { requestId, action: reviewAction, approvedTier, reviewNotes } = ReviewRequestSchema.parse(body)

      const mintRequest = await prisma.nFTMintRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      })

      if (!mintRequest) {
        return NextResponse.json({ error: 'Mint request not found' }, { status: 404 })
      }

      if (mintRequest.status !== 'PENDING' && mintRequest.status !== 'UNDER_REVIEW') {
        return NextResponse.json({ error: 'Request has already been reviewed' }, { status: 400 })
      }

      let updatedRequest

      if (reviewAction === 'APPROVE') {
        const tierToMint = approvedTier || mintRequest.requestedTier

        // Check if user already has an active membership NFT
        const existingNFT = await prisma.membershipNFT.findFirst({
          where: {
            ownerId: mintRequest.userId,
            isActive: true
          }
        })

        if (existingNFT) {
          return NextResponse.json({ 
            error: 'User already has an active membership NFT' 
          }, { status: 400 })
        }

        // Update request status to approved
        updatedRequest = await prisma.nFTMintRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            approvedTier: tierToMint,
            reviewedAt: new Date(),
            reviewerId: dbUser.id,
            reviewNotes: reviewNotes || null
          }
        })

        // Mint the NFT (this would interact with the blockchain)
        try {
          const mintResult = await mintMembershipNFT(
            mintRequest.user.walletAddress!,
            tierToMint,
            {
              requestId: mintRequest.id,
              userId: mintRequest.userId,
              issuedBy: dbUser.id
            }
          )

          // Update request status to minted
          await prisma.nFTMintRequest.update({
            where: { id: requestId },
            data: { status: 'MINTED' }
          })

          return NextResponse.json({ 
            success: true, 
            mintRequest: updatedRequest,
            nft: mintResult 
          })
        } catch (mintError) {
          console.error('Failed to mint NFT:', mintError)
          
          // Revert approval status
          await prisma.nFTMintRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' } // Keep as approved but not minted
          })

          return NextResponse.json({ 
            error: 'NFT minting failed', 
            details: mintError 
          }, { status: 500 })
        }
      } else {
        // Reject the request
        updatedRequest = await prisma.nFTMintRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewerId: dbUser.id,
            reviewNotes: reviewNotes || null
          }
        })

        return NextResponse.json({ success: true, mintRequest: updatedRequest })
      }
    } else {
      // User submitting a new mint request
      const { requestedTier, justification, additionalInfo } = MintRequestSchema.parse(body)

      // Check if user already has an active membership NFT
      const existingNFT = await prisma.membershipNFT.findFirst({
        where: {
          ownerId: dbUser.id,
          isActive: true
        }
      })

      if (existingNFT) {
        return NextResponse.json({ 
          error: 'You already have an active membership NFT' 
        }, { status: 400 })
      }

      // Check if user has a pending request
      const existingRequest = await prisma.nFTMintRequest.findFirst({
        where: {
          userId: dbUser.id,
          status: {
            in: ['PENDING', 'UNDER_REVIEW', 'APPROVED']
          }
        }
      })

      if (existingRequest) {
        return NextResponse.json({ 
          error: 'You already have a pending mint request' 
        }, { status: 400 })
      }

      // Create new mint request
      const mintRequest = await prisma.nFTMintRequest.create({
        data: {
          userId: dbUser.id,
          requestedTier,
          justification,
          additionalInfo: additionalInfo || null,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              walletAddress: true
            }
          }
        }
      })

      return NextResponse.json({ success: true, mintRequest })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Failed to process mint request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Cancel a mint request (user) or delete old requests (admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const mintRequest = await prisma.nFTMintRequest.findUnique({
      where: { id: requestId }
    })

    if (!mintRequest) {
      return NextResponse.json({ error: 'Mint request not found' }, { status: 404 })
    }

    // Users can only cancel their own pending requests
    // Admins can delete any non-pending requests
    const isOwner = mintRequest.userId === dbUser.id
    const isAdmin = canManageNFTs(dbUser)
    const isPending = mintRequest.status === 'PENDING'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (isOwner && !isPending) {
      return NextResponse.json({ 
        error: 'Can only cancel pending requests' 
      }, { status: 400 })
    }

    await prisma.nFTMintRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete mint request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}