import { ethers } from 'ethers'
import { prisma } from '../../../../packages/db'

// Define types
type MembershipTier = 'BASIC' | 'PREMIUM' | 'FOUNDER' | 'EARLY_ADOPTER' | 'VALIDATOR' | 'CONTRIBUTOR'
import { db } from '@/lib/db'

// ERC-1155 ABI for membership NFTs
const MEMBERSHIP_NFT_ABI = [
  // Read functions
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function uri(uint256 id) view returns (string)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  
  // Write functions
  "function mint(address to, uint256 id, uint256 amount, bytes data)",
  "function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data)",
  "function burn(address from, uint256 id, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)",
  
  // Events
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event URI(string value, uint256 indexed id)"
]

// Contract configuration
export const NFT_CONFIG = {
  contractAddress: process.env.NEXT_PUBLIC_MEMBERSHIP_NFT_CONTRACT || "0x...", // Replace with actual contract
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "137"), // Polygon mainnet
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com",
}

// Membership tier token IDs
export const TIER_TOKEN_IDS = {
  BASIC: 1,
  PREMIUM: 2,
  FOUNDER: 3,
  EARLY_ADOPTER: 4,
  VALIDATOR: 5,
  CONTRIBUTOR: 6,
} as const

// Tier benefits configuration
export const TIER_BENEFITS = {
  BASIC: {
    votingPowerMultiplier: 1.0,
    claimLimitUsd: 50000, // $500
    governanceAccess: true,
    premiumFeatures: false,
    name: "Basic Member",
    description: "Standard SafetyNet DAO membership",
    color: "#6B7280",
    emoji: "🏷️"
  },
  PREMIUM: {
    votingPowerMultiplier: 1.5,
    claimLimitUsd: 100000, // $1000
    governanceAccess: true,
    premiumFeatures: true,
    name: "Premium Member",
    description: "Enhanced benefits and higher claim limits",
    color: "#3B82F6",
    emoji: "💎"
  },
  FOUNDER: {
    votingPowerMultiplier: 3.0,
    claimLimitUsd: 250000, // $2500
    governanceAccess: true,
    premiumFeatures: true,
    name: "Founder",
    description: "Founding member with maximum benefits",
    color: "#7C3AED",
    emoji: "👑"
  },
  EARLY_ADOPTER: {
    votingPowerMultiplier: 2.0,
    claimLimitUsd: 150000, // $1500
    governanceAccess: true,
    premiumFeatures: true,
    name: "Early Adopter",
    description: "Early supporter with enhanced benefits",
    color: "#10B981",
    emoji: "🚀"
  },
  VALIDATOR: {
    votingPowerMultiplier: 2.5,
    claimLimitUsd: 200000, // $2000
    governanceAccess: true,
    premiumFeatures: true,
    name: "Validator",
    description: "Active governance participant",
    color: "#F59E0B",
    emoji: "⚖️"
  },
  CONTRIBUTOR: {
    votingPowerMultiplier: 2.0,
    claimLimitUsd: 150000, // $1500
    governanceAccess: true,
    premiumFeatures: true,
    name: "Contributor",
    description: "Active community contributor",
    color: "#EF4444",
    emoji: "🛠️"
  }
} as const

/**
 * Get contract instance
 */
export function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || new ethers.JsonRpcProvider(NFT_CONFIG.rpcUrl)
  return new ethers.Contract(NFT_CONFIG.contractAddress, MEMBERSHIP_NFT_ABI, provider)
}

/**
 * Check if user owns a membership NFT
 */
export async function checkMembershipNFT(userAddress: string): Promise<{
  hasNFT: boolean
  tier: keyof typeof TIER_TOKEN_IDS | null
  tokenId: number | null
  balance: number
}> {
  try {
    const contract = getContract()
    
    // Check each tier
    for (const [tierName, tokenId] of Object.entries(TIER_TOKEN_IDS)) {
      const balance = await contract.balanceOf(userAddress, tokenId)
      if (balance > 0) {
        return {
          hasNFT: true,
          tier: tierName as keyof typeof TIER_TOKEN_IDS,
          tokenId,
          balance: Number(balance)
        }
      }
    }
    
    return {
      hasNFT: false,
      tier: null,
      tokenId: null,
      balance: 0
    }
  } catch (error) {
    console.error('Error checking membership NFT:', error)
    return {
      hasNFT: false,
      tier: null,
      tokenId: null,
      balance: 0
    }
  }
}

/**
 * Mint membership NFT (admin only)
 */
export async function mintMembershipNFT(
  toAddress: string,
  tier: keyof typeof TIER_TOKEN_IDS,
  signer: ethers.Signer
): Promise<{
  success: boolean
  txHash?: string
  error?: string
}> {
  try {
    const contract = getContract(signer)
    const tokenId = TIER_TOKEN_IDS[tier]
    
    // Mint 1 NFT of the specified tier
    const tx = await contract.mint(toAddress, tokenId, 1, "0x")
    await tx.wait()
    
    return {
      success: true,
      txHash: tx.hash
    }
  } catch (error) {
    console.error('Error minting NFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate NFT metadata
 */
export function generateNFTMetadata(
  tier: keyof typeof TIER_TOKEN_IDS,
  serialNumber?: number
): any {
  const benefits = TIER_BENEFITS[tier]
  
  return {
    name: `${benefits.name}${serialNumber ? ` #${serialNumber}` : ''}`,
    description: benefits.description,
    image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/image/${tier}${serialNumber ? `?serial=${serialNumber}` : ''}`,
    external_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership/${tier}`,
    attributes: [
      {
        trait_type: "Tier",
        value: tier
      },
      {
        trait_type: "Voting Power Multiplier",
        value: benefits.votingPowerMultiplier,
        display_type: "number"
      },
      {
        trait_type: "Claim Limit (USD)",
        value: benefits.claimLimitUsd / 100,
        display_type: "number"
      },
      {
        trait_type: "Governance Access",
        value: benefits.governanceAccess ? "Yes" : "No"
      },
      {
        trait_type: "Premium Features",
        value: benefits.premiumFeatures ? "Yes" : "No"
      },
      ...(serialNumber ? [{
        trait_type: "Serial Number",
        value: serialNumber,
        display_type: "number"
      }] : [])
    ],
    properties: {
      tier: tier,
      voting_power_multiplier: benefits.votingPowerMultiplier,
      claim_limit_usd: benefits.claimLimitUsd,
      governance_access: benefits.governanceAccess,
      premium_features: benefits.premiumFeatures,
      ...(serialNumber && { serial_number: serialNumber })
    }
  }
}

/**
 * Get user's membership benefits
 */
export async function getUserMembershipBenefits(userId: string): Promise<{
  tier: keyof typeof TIER_TOKEN_IDS | null
  benefits: typeof TIER_BENEFITS[keyof typeof TIER_BENEFITS] | null
  hasActiveNFT: boolean
}> {
  try {
    const nft = await db.membershipNFT.findFirst({
      where: {
        ownerId: userId,
        isActive: true
      },
      orderBy: {
        votingPowerMultiplier: 'desc' // Get highest tier if multiple
      }
    })
    
    if (nft) {
      return {
        tier: nft.tier as keyof typeof TIER_TOKEN_IDS,
        benefits: TIER_BENEFITS[nft.tier as keyof typeof TIER_TOKEN_IDS],
        hasActiveNFT: true
      }
    }
    
    return {
      tier: null,
      benefits: null,
      hasActiveNFT: false
    }
  } catch (error) {
    console.error('Error getting user benefits:', error)
    return {
      tier: null,
      benefits: null,
      hasActiveNFT: false
    }
  }
}

/**
 * Check if user has access to specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: 'governance' | 'premium' | 'claims'
): Promise<boolean> {
  const { benefits } = await getUserMembershipBenefits(userId)
  
  if (!benefits) return false
  
  switch (feature) {
    case 'governance':
      return benefits.governanceAccess
    case 'premium':
      return benefits.premiumFeatures
    case 'claims':
      return true // All NFT holders can submit claims
    default:
      return false
  }
}

/**
 * Sync user NFTs from blockchain to database
 */
export async function syncUserNFTs(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('Wallet address is required')
  }

  try {
    // Get user from database
    const user = await prisma.user.findFirst({
      where: { walletAddress }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Get NFTs from blockchain (mock implementation)
    const blockchainNFTs = await getBlockchainNFTs(walletAddress)
    
    const syncResults = {
      found: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (const blockchainNFT of blockchainNFTs) {
      try {
        syncResults.found++
        
        // Check if NFT already exists in database
        const existingNFT = await prisma.membershipNFT.findFirst({
          where: {
            tokenId: blockchainNFT.tokenId,
            contractAddress: blockchainNFT.contractAddress
          }
        })

        if (existingNFT) {
          // Update existing NFT if needed
          if (existingNFT.ownerId !== user.id) {
            await prisma.membershipNFT.update({
              where: { id: existingNFT.id },
              data: { ownerId: user.id }
            })
            syncResults.updated++
          }
        } else {
          // Create new NFT record
          await prisma.membershipNFT.create({
            data: {
              tokenId: blockchainNFT.tokenId,
              contractAddress: blockchainNFT.contractAddress,
              tier: blockchainNFT.tier,
              name: `${TIER_BENEFITS[blockchainNFT.tier].name} #${blockchainNFT.tokenId}`,
              ownerId: user.id,
              isActive: true,
              issuedAt: new Date(blockchainNFT.issuedAt || Date.now()),
              votingPowerMultiplier: TIER_BENEFITS[blockchainNFT.tier].votingPowerMultiplier,
              claimLimitUsd: TIER_BENEFITS[blockchainNFT.tier].claimLimitUsd,
              serialNumber: parseInt(blockchainNFT.tokenId)
            }
          })
          syncResults.created++
        }
      } catch (error: any) {
        console.error(`Failed to sync NFT ${blockchainNFT.tokenId}:`, error)
        syncResults.errors.push(`Token ${blockchainNFT.tokenId}: ${error.message || error}`)
      }
    }

    return syncResults
  } catch (error) {
    console.error('Failed to sync user NFTs:', error)
    throw error
  }
}

/**
 * Check if user can manage NFTs (admin permissions)
 */
export function canManageNFTs(user: any): boolean {
  return user?.isAdmin === true || user?.role === 'ADMIN'
}

/**
 * Upgrade a membership NFT to a higher tier
 */
export async function upgradeMembershipNFT(
  nftId: string,
  newTier: MembershipTier,
  options: {
    reason: string
    upgradedBy: string
  }
) {
  try {
    const { reason, upgradedBy } = options

    // Get current NFT
    const currentNFT = await prisma.membershipNFT.findUnique({
      where: { id: nftId },
      include: { owner: true }
    })

    if (!currentNFT) {
      throw new Error('NFT not found')
    }

    if (!currentNFT.isActive) {
      throw new Error('Cannot upgrade inactive NFT')
    }

    // Get new tier benefits
    const newBenefits = TIER_BENEFITS[newTier]
    if (!newBenefits) {
      throw new Error('Invalid tier')
    }

    // Update NFT in database
    const upgradedNFT = await prisma.membershipNFT.update({
      where: { id: nftId },
      data: {
        tier: newTier,
        votingPowerMultiplier: newBenefits.votingPowerMultiplier,
        claimLimitUsd: newBenefits.claimLimitUsd,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        }
      }
    })

    // Record the transfer/upgrade
    await prisma.nFTTransfer.create({
      data: {
        nftId: nftId,
        transferType: 'TIER_UPGRADE',
        fromUserId: currentNFT.ownerId,
        toUserId: currentNFT.ownerId,
        reason: `Tier upgraded to ${newTier}: ${reason}`,
        processedBy: upgradedBy
      }
    })

    // Update on blockchain (mock implementation)
    // In a real implementation, this would call the smart contract
    console.log(`Upgrading NFT ${currentNFT.tokenId} to tier ${newTier}`)

    return upgradedNFT
  } catch (error) {
    console.error('Failed to upgrade NFT:', error)
    throw error
  }
}

/**
 * Revoke a membership NFT
 */
export async function revokeMembershipNFT(
  nftId: string,
  options: {
    reason: string
    revokedBy: string
  }
) {
  try {
    const { reason, revokedBy } = options

    // Get current NFT
    const currentNFT = await prisma.membershipNFT.findUnique({
      where: { id: nftId },
      include: { owner: true }
    })

    if (!currentNFT) {
      throw new Error('NFT not found')
    }

    if (!currentNFT.isActive) {
      throw new Error('NFT is already revoked')
    }

    // Update NFT in database
    const revokedNFT = await prisma.membershipNFT.update({
      where: { id: nftId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
        revokedBy: revokedBy,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        },
        revokedBy: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        }
      }
    })

    // Record the revocation
    await prisma.nFTTransfer.create({
      data: {
        nftId: nftId,
        transferType: 'REVOCATION',
        fromUserId: currentNFT.ownerId,
        toUserId: null,
        reason: `NFT revoked: ${reason}`,
        processedBy: revokedBy
      }
    })

    // Revoke on blockchain (mock implementation)
    // In a real implementation, this would call the smart contract
    console.log(`Revoking NFT ${currentNFT.tokenId} - Reason: ${reason}`)

    return revokedNFT
  } catch (error) {
    console.error('Failed to revoke NFT:', error)
    throw error
  }
}