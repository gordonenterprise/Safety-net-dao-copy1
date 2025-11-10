'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { 
  TIER_BENEFITS, 
  TIER_TOKEN_IDS, 
  generateNFTMetadata,
  syncUserNFTs,
  getUserMembershipBenefits
} from '@/lib/nft'
import { uploadToIPFS } from '@/lib/ipfs'

// Validation schemas
const mintRequestSchema = z.object({
  requestedTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']),
  justification: z.string().min(50).max(2000),
  documents: z.array(z.string()).max(5).optional() // File URLs
})

const reviewMintRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  approvedTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']).optional(),
  reviewNotes: z.string().max(1000).optional()
})

const upgradeNFTSchema = z.object({
  nftId: z.string(),
  newTier: z.enum(['BASIC', 'PREMIUM', 'FOUNDER', 'EARLY_ADOPTER', 'VALIDATOR', 'CONTRIBUTOR']),
  reason: z.string().min(10).max(500)
})

type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit a request to mint membership NFT
 */
export async function submitMintRequest(
  userId: string,
  data: z.infer<typeof mintRequestSchema>
): Promise<ActionResponse<{ requestId: string }>> {
  try {
    const validatedData = mintRequestSchema.parse(data)

    // Check if user already has an active NFT
    const existingNFT = await db.membershipNFT.findFirst({
      where: { ownerId: userId, isActive: true }
    })

    if (existingNFT) {
      return { success: false, error: 'You already have an active membership NFT' }
    }

    // Check if user has a pending request
    const pendingRequest = await db.nFTMintRequest.findFirst({
      where: { 
        userId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      }
    })

    if (pendingRequest) {
      return { success: false, error: 'You already have a pending mint request' }
    }

    // Create mint request
    const request = await db.nFTMintRequest.create({
      data: {
        userId,
        requestedTier: validatedData.requestedTier,
        justification: validatedData.justification,
        documentsUploaded: validatedData.documents ? validatedData.documents.length > 0 : false,
        // TODO: Upload documents to IPFS and store CID
      }
    })

    console.log(`NFT mint request created: ${request.id} for user ${userId}`)

    revalidatePath('/membership')
    revalidatePath('/admin/nft-requests')

    return {
      success: true,
      data: { requestId: request.id }
    }

  } catch (error) {
    console.error('Submit mint request failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to submit mint request' }
  }
}

/**
 * Review and approve/reject mint request (Admin only)
 */
export async function reviewMintRequest(
  reviewerId: string,
  data: z.infer<typeof reviewMintRequestSchema>
): Promise<ActionResponse<{ nftId?: string }>> {
  try {
    const validatedData = reviewMintRequestSchema.parse(data)

    // Verify reviewer has permission
    const reviewer = await db.user.findUnique({
      where: { id: reviewerId }
    })

    if (!reviewer || reviewer.role !== 'ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get the mint request
    const request = await db.nFTMintRequest.findUnique({
      where: { id: validatedData.requestId },
      include: { user: true }
    })

    if (!request) {
      return { success: false, error: 'Mint request not found' }
    }

    if (request.status !== 'PENDING' && request.status !== 'UNDER_REVIEW') {
      return { success: false, error: 'Request has already been processed' }
    }

    if (validatedData.action === 'APPROVE') {
      const approvedTier = validatedData.approvedTier || request.requestedTier
      
      // Create NFT record
      const benefits = TIER_BENEFITS[approvedTier]
      const metadata = generateNFTMetadata(approvedTier)
      
      // Get next serial number for the tier
      const existingCount = await db.membershipNFT.count({
        where: { tier: approvedTier }
      })
      const serialNumber = existingCount + 1

      const nft = await db.membershipNFT.create({
        data: {
          tokenId: `${TIER_TOKEN_IDS[approvedTier]}-${serialNumber}`, // Unique token ID
          contractAddress: process.env.NEXT_PUBLIC_MEMBERSHIP_NFT_CONTRACT || "0x...",
          chainId: 137,
          ownerId: request.userId,
          tier: approvedTier,
          name: `${benefits.name} #${serialNumber}`,
          description: benefits.description,
          imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/image/${approvedTier}?serial=${serialNumber}`,
          metadataUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/metadata/${TIER_TOKEN_IDS[approvedTier]}-${serialNumber}`,
          votingPowerMultiplier: benefits.votingPowerMultiplier,
          claimLimitUsd: benefits.claimLimitUsd,
          governanceAccess: benefits.governanceAccess,
          premiumFeatures: benefits.premiumFeatures,
          verificationLevel: 'BASIC',
          verifiedAt: new Date(),
          verifierId: reviewerId,
          serialNumber
        }
      })

      // Update request
      await db.nFTMintRequest.update({
        where: { id: validatedData.requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerId,
          reviewNotes: validatedData.reviewNotes,
          approvedTier,
          nftId: nft.id
        }
      })

      // Update user's membership status
      await db.user.update({
        where: { id: request.userId },
        data: {
          membershipStatus: 'ACTIVE',
          membershipNftTokenId: nft.tokenId
        }
      })

      console.log(`NFT approved and created: ${nft.id} for user ${request.userId}`)

      revalidatePath('/admin/nft-requests')
      revalidatePath(`/profile/${request.user.walletAddress}`)

      return {
        success: true,
        data: { nftId: nft.id }
      }

    } else {
      // Reject request
      await db.nFTMintRequest.update({
        where: { id: validatedData.requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewerId,
          reviewNotes: validatedData.reviewNotes
        }
      })

      console.log(`NFT request rejected: ${validatedData.requestId} by ${reviewerId}`)

      revalidatePath('/admin/nft-requests')

      return { success: true }
    }

  } catch (error) {
    console.error('Review mint request failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to review mint request' }
  }
}

/**
 * Upgrade NFT tier (Admin only)
 */
export async function upgradeNFTTier(
  adminId: string,
  data: z.infer<typeof upgradeNFTSchema>
): Promise<ActionResponse> {
  try {
    const validatedData = upgradeNFTSchema.parse(data)

    // Verify admin has permission
    const admin = await db.user.findUnique({
      where: { id: adminId }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get the NFT
    const nft = await db.membershipNFT.findUnique({
      where: { id: validatedData.nftId },
      include: { owner: true }
    })

    if (!nft) {
      return { success: false, error: 'NFT not found' }
    }

    if (!nft.isActive) {
      return { success: false, error: 'NFT is not active' }
    }

    // Check if it's actually an upgrade
    const currentTierPower = TIER_BENEFITS[nft.tier as keyof typeof TIER_BENEFITS].votingPowerMultiplier
    const newTierPower = TIER_BENEFITS[validatedData.newTier].votingPowerMultiplier

    // Deactivate old NFT
    await db.membershipNFT.update({
      where: { id: validatedData.nftId },
      data: { 
        isActive: false,
        revokedAt: new Date(),
        revokedReason: `Upgraded to ${validatedData.newTier}: ${validatedData.reason}`
      }
    })

    // Create new NFT with upgraded tier
    const benefits = TIER_BENEFITS[validatedData.newTier]
    const existingCount = await db.membershipNFT.count({
      where: { tier: validatedData.newTier }
    })
    const serialNumber = existingCount + 1

    const newNFT = await db.membershipNFT.create({
      data: {
        tokenId: `${TIER_TOKEN_IDS[validatedData.newTier]}-${serialNumber}`,
        contractAddress: nft.contractAddress,
        chainId: nft.chainId,
        ownerId: nft.ownerId,
        tier: validatedData.newTier,
        name: `${benefits.name} #${serialNumber}`,
        description: benefits.description,
        imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/image/${validatedData.newTier}?serial=${serialNumber}`,
        metadataUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/metadata/${TIER_TOKEN_IDS[validatedData.newTier]}-${serialNumber}`,
        votingPowerMultiplier: benefits.votingPowerMultiplier,
        claimLimitUsd: benefits.claimLimitUsd,
        governanceAccess: benefits.governanceAccess,
        premiumFeatures: benefits.premiumFeatures,
        verificationLevel: nft.verificationLevel,
        verifiedAt: new Date(),
        verifierId: adminId,
        serialNumber
      }
    })

    // Update user's membership NFT reference
    await db.user.update({
      where: { id: nft.ownerId },
      data: { membershipNftTokenId: newNFT.tokenId }
    })

    console.log(`NFT upgraded: ${nft.id} -> ${newNFT.id} (${nft.tier} -> ${validatedData.newTier})`)

    revalidatePath('/admin/members')
    revalidatePath(`/profile/${nft.owner.walletAddress}`)

    return { success: true }

  } catch (error) {
    console.error('Upgrade NFT tier failed:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors[0]?.message}` }
    }
    return { success: false, error: 'Failed to upgrade NFT tier' }
  }
}

/**
 * Revoke NFT (Admin only)
 */
export async function revokeNFT(
  adminId: string,
  nftId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    // Verify admin has permission
    const admin = await db.user.findUnique({
      where: { id: adminId }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get the NFT
    const nft = await db.membershipNFT.findUnique({
      where: { id: nftId },
      include: { owner: true }
    })

    if (!nft) {
      return { success: false, error: 'NFT not found' }
    }

    // Revoke NFT
    await db.membershipNFT.update({
      where: { id: nftId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason
      }
    })

    // Update user's membership status
    await db.user.update({
      where: { id: nft.ownerId },
      data: {
        membershipStatus: 'SUSPENDED',
        membershipNftTokenId: null
      }
    })

    console.log(`NFT revoked: ${nftId} for user ${nft.ownerId}`)

    revalidatePath('/admin/members')
    revalidatePath(`/profile/${nft.owner.walletAddress}`)

    return { success: true }

  } catch (error) {
    console.error('Revoke NFT failed:', error)
    return { success: false, error: 'Failed to revoke NFT' }
  }
}

/**
 * Get user's NFT and membership status
 */
export async function getUserNFTStatus(userId: string): Promise<ActionResponse<{
  nft: any | null
  benefits: any | null
  hasActiveNFT: boolean
  pendingRequest: any | null
}>> {
  try {
    const [nft, benefits, pendingRequest] = await Promise.all([
      db.membershipNFT.findFirst({
        where: { ownerId: userId, isActive: true },
        include: {
          verifier: { select: { name: true, walletAddress: true } }
        }
      }),
      getUserMembershipBenefits(userId),
      db.nFTMintRequest.findFirst({
        where: { 
          userId,
          status: { in: ['PENDING', 'UNDER_REVIEW'] }
        }
      })
    ])

    return {
      success: true,
      data: {
        nft,
        benefits: benefits.benefits,
        hasActiveNFT: benefits.hasActiveNFT,
        pendingRequest
      }
    }

  } catch (error) {
    console.error('Get user NFT status failed:', error)
    return { success: false, error: 'Failed to get NFT status' }
  }
}

/**
 * Get mint requests for admin review
 */
export async function getMintRequests(
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<ActionResponse<{ requests: any[]; total: number }>> {
  try {
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    const offset = (page - 1) * limit

    const [requests, total] = await Promise.all([
      db.nFTMintRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              walletAddress: true,
              joinedAt: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          }
        }
      }),
      db.nFTMintRequest.count({ where })
    ])

    return {
      success: true,
      data: { requests, total }
    }

  } catch (error) {
    console.error('Get mint requests failed:', error)
    return { success: false, error: 'Failed to fetch mint requests' }
  }
}

/**
 * Sync user's on-chain NFT status
 */
export async function syncUserNFTStatus(
  userId: string,
  userAddress: string
): Promise<ActionResponse> {
  try {
    await syncUserNFTs(userId, userAddress)
    
    revalidatePath('/membership')
    revalidatePath(`/profile/${userAddress}`)
    
    return { success: true }

  } catch (error) {
    console.error('Sync user NFT status failed:', error)
    return { success: false, error: 'Failed to sync NFT status' }
  }
}