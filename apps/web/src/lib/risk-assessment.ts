import { z } from 'zod'

// Risk factors for claim assessment
export interface RiskFactors {
  userTenure: number        // Days since user joined
  claimVelocity: number     // Claims submitted in last 30 days
  amountFactor: number      // Claim amount relative to user history
  duplicateContent: boolean // Duplicate CID detected
  deviceRisk: boolean       // Suspicious device fingerprint
  ipRisk: boolean          // High-risk IP or VPN
  timingRisk: boolean      // Submitted outside normal hours
}

export interface RiskAssessment {
  score: number            // 0-1, where 1 is highest risk
  factors: RiskFactors
  recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'FLAG_HIGH_RISK'
  reasoning: string[]
}

export function calculateClaimRisk(
  claim: {
    requestedAmount: number
    category: string
    duplicateCheckCid?: string | null
  },
  user: {
    createdAt: Date
    claims: { createdAt: Date; status: string }[]
    lastIpAddress?: string | null
    deviceFingerprint?: string | null
  },
  context: {
    submissionTime: Date
    ipAddress?: string
    deviceFingerprint?: string
    existingCids: string[]
  }
): RiskAssessment {
  const factors: RiskFactors = {
    userTenure: calculateUserTenure(user.createdAt, context.submissionTime),
    claimVelocity: calculateClaimVelocity(user.claims, context.submissionTime),
    amountFactor: calculateAmountFactor(claim.requestedAmount, user.claims),
    duplicateContent: checkDuplicateContent(claim.duplicateCheckCid, context.existingCids),
    deviceRisk: checkDeviceRisk(user.deviceFingerprint, context.deviceFingerprint),
    ipRisk: checkIpRisk(user.lastIpAddress, context.ipAddress),
    timingRisk: checkTimingRisk(context.submissionTime),
  }

  const score = calculateRiskScore(factors)
  const recommendation = getRiskRecommendation(score, factors)
  const reasoning = generateReasoning(factors)

  return {
    score,
    factors,
    recommendation,
    reasoning,
  }
}

function calculateUserTenure(userCreatedAt: Date, submissionTime: Date): number {
  const diffTime = Math.abs(submissionTime.getTime() - userCreatedAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // days
}

function calculateClaimVelocity(claims: { createdAt: Date; status: string }[], submissionTime: Date): number {
  const thirtyDaysAgo = new Date(submissionTime.getTime() - (30 * 24 * 60 * 60 * 1000))
  return claims.filter(claim => 
    claim.createdAt >= thirtyDaysAgo && 
    claim.status !== 'CANCELLED'
  ).length
}

function calculateAmountFactor(requestedAmount: number, userClaims: { createdAt: Date; status: string }[]): number {
  const approvedClaims = userClaims.filter(c => c.status === 'APPROVED' || c.status === 'PAID')
  
  if (approvedClaims.length === 0) {
    // New user - check against baseline
    return requestedAmount > 50000 ? 0.8 : 0.2 // $500 threshold
  }

  // Compare to user's historical average (placeholder logic)
  const avgAmount = 25000 // $250 placeholder
  return requestedAmount > (avgAmount * 3) ? 0.9 : 0.1
}

function checkDuplicateContent(claimCid?: string | null, existingCids: string[] = []): boolean {
  if (!claimCid) return false
  return existingCids.includes(claimCid)
}

function checkDeviceRisk(userDevice?: string | null, currentDevice?: string): boolean {
  if (!userDevice || !currentDevice) return false
  return userDevice !== currentDevice
}

function checkIpRisk(userIp?: string | null, currentIp?: string): boolean {
  if (!userIp || !currentIp) return false
  
  // Basic checks - in production, use IP intelligence services
  const highRiskPatterns = [
    /^10\./, // Private networks (suspicious for web app)
    /^172\./, // Private networks
    /^192\.168\./, // Private networks
  ]
  
  return highRiskPatterns.some(pattern => pattern.test(currentIp)) ||
         userIp !== currentIp
}

function checkTimingRisk(submissionTime: Date): boolean {
  const hour = submissionTime.getHours()
  // Flag submissions between 2 AM - 6 AM local time as potentially risky
  return hour >= 2 && hour <= 6
}

function calculateRiskScore(factors: RiskFactors): number {
  let score = 0

  // User tenure risk (newer users = higher risk)
  if (factors.userTenure < 7) score += 0.3
  else if (factors.userTenure < 30) score += 0.1

  // Velocity risk (multiple claims = higher risk)
  if (factors.claimVelocity > 3) score += 0.4
  else if (factors.claimVelocity > 1) score += 0.2

  // Amount risk
  score += factors.amountFactor * 0.2

  // Critical flags
  if (factors.duplicateContent) score += 0.5
  if (factors.deviceRisk) score += 0.2
  if (factors.ipRisk) score += 0.1
  if (factors.timingRisk) score += 0.1

  return Math.min(score, 1) // Cap at 1.0
}

function getRiskRecommendation(score: number, factors: RiskFactors): RiskAssessment['recommendation'] {
  // Critical flags always require manual review
  if (factors.duplicateContent) return 'FLAG_HIGH_RISK'
  
  if (score < 0.3) return 'AUTO_APPROVE'
  if (score < 0.7) return 'MANUAL_REVIEW'
  return 'FLAG_HIGH_RISK'
}

function generateReasoning(factors: RiskFactors): string[] {
  const reasons: string[] = []

  if (factors.userTenure < 7) {
    reasons.push('New user (less than 7 days)')
  }

  if (factors.claimVelocity > 3) {
    reasons.push('High claim frequency (>3 in 30 days)')
  } else if (factors.claimVelocity > 1) {
    reasons.push('Multiple recent claims')
  }

  if (factors.duplicateContent) {
    reasons.push('Duplicate evidence detected')
  }

  if (factors.deviceRisk) {
    reasons.push('Different device from registration')
  }

  if (factors.ipRisk) {
    reasons.push('Suspicious IP address')
  }

  if (factors.timingRisk) {
    reasons.push('Submitted during unusual hours')
  }

  if (reasons.length === 0) {
    reasons.push('Low risk profile')
  }

  return reasons
}

// Zod schema for claim submission validation
export const claimSubmissionSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  category: z.enum(['MEDICAL', 'VEHICLE', 'DEVICE', 'INCOME_LOSS', 'EMERGENCY', 'OTHER']),
  requestedAmount: z.number().min(100).max(500000), // $1 - $5000
  evidenceNotes: z.string().optional(),
  attachments: z.array(z.string()).max(5), // Max 5 file URLs
})

export type ClaimSubmissionData = z.infer<typeof claimSubmissionSchema>