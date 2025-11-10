import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@safetynet/db'
import { canManageNFTs, upgradeMembershipNFT, revokeMembershipNFT } from '@/lib/nft'

// Schema for NFT upgrade
const UpgradeNFTSchema = z.object({
  nftId: z.string(),
  newTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']),
  reason: z.string().min(10).max(500)
})

// Schema for NFT revocation
const RevokeNFTSchema = z.object({
  nftId: z.string(),
  reason: z.string().min(10).max(500)
})

// GET: Get all issued NFTs (admin only) or user's NFTs
export async function GET(request: NextRequest) {
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
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const userOnly = searchParams.get('userOnly') === 'true'

    let where: any = {}

    if (userOnly || !canManageNFTs(dbUser)) {
      // Regular users can only see their own NFTs
      where.ownerId = dbUser.id
    }

    if (!includeInactive && !canManageNFTs(dbUser)) {
      // Regular users see only active NFTs by default
      where.isActive = true
    }

    const nfts = await prisma.membershipNFT.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        },
        revokedBy: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        },
        transfers: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
                walletAddress: true
              }
            },
            toUser: {
              select: {
                id: true,
                name: true,
                walletAddress: true
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' }, // Active NFTs first
        { issuedAt: 'desc' }
      ]
    })

    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Failed to fetch NFTs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Upgrade or manage NFT (admin only)
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'upgrade') {
      const { nftId, newTier, reason } = UpgradeNFTSchema.parse(body)

      const nft = await prisma.membershipNFT.findUnique({
        where: { id: nftId },
        include: { owner: true }
      })

      if (!nft) {
        return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
      }

      if (!nft.isActive) {
        return NextResponse.json({ error: 'Cannot upgrade inactive NFT' }, { status: 400 })
      }

      if (nft.tier === newTier) {
        return NextResponse.json({ error: 'NFT is already at this tier' }, { status: 400 })
      }

      try {
        const upgradedNFT = await upgradeMembershipNFT(nftId, newTier, {
          reason,
          upgradedBy: dbUser.id
        })

        return NextResponse.json({ success: true, nft: upgradedNFT })
      } catch (upgradeError) {
        console.error('Failed to upgrade NFT:', upgradeError)
        return NextResponse.json({ 
          error: 'NFT upgrade failed', 
          details: upgradeError 
        }, { status: 500 })
      }
    } else if (action === 'revoke') {
      const { nftId, reason } = RevokeNFTSchema.parse(body)

      const nft = await prisma.membershipNFT.findUnique({
        where: { id: nftId },
        include: { owner: true }
      })

      if (!nft) {
        return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
      }

      if (!nft.isActive) {
        return NextResponse.json({ error: 'NFT is already revoked' }, { status: 400 })
      }

      try {
        const revokedNFT = await revokeMembershipNFT(nftId, {
          reason,
          revokedBy: dbUser.id
        })

        return NextResponse.json({ success: true, nft: revokedNFT })
      } catch (revokeError) {
        console.error('Failed to revoke NFT:', revokeError)
        return NextResponse.json({ 
          error: 'NFT revocation failed', 
          details: revokeError 
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Failed to manage NFT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Sync NFTs from blockchain (admin or user)
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
    const { walletAddress } = body

    // Users can sync their own wallet, admins can sync any wallet
    const targetAddress = walletAddress || dbUser.walletAddress
    
    if (!targetAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    if (walletAddress && walletAddress !== dbUser.walletAddress && !canManageNFTs(dbUser)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    try {
      // Import and use the sync function
      const { syncUserNFTs } = await import('@/lib/nft')
      const syncResult = await syncUserNFTs(targetAddress)

      return NextResponse.json({ 
        success: true, 
        syncResult 
      })
    } catch (syncError) {
      console.error('Failed to sync NFTs:', syncError)
      return NextResponse.json({ 
        error: 'NFT sync failed', 
        details: syncError 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to sync NFTs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}