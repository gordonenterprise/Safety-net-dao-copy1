import { PrismaClient } from '@safetynet/db'
import { AuditLogger, AuditAction, AuditLevel } from './audit-logger'

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FraudIndicator {
  // Behavioral indicators
  RAPID_CLAIMS = 'RAPID_CLAIMS',
  SUSPICIOUS_VOTING = 'SUSPICIOUS_VOTING',
  UNUSUAL_TRANSACTION_PATTERN = 'UNUSUAL_TRANSACTION_PATTERN',
  MULTIPLE_ACCOUNTS = 'MULTIPLE_ACCOUNTS',
  
  // Technical indicators
  VPN_USAGE = 'VPN_USAGE',
  BOT_LIKE_BEHAVIOR = 'BOT_LIKE_BEHAVIOR',
  PROXY_USAGE = 'PROXY_USAGE',
  DEVICE_FINGERPRINT_MISMATCH = 'DEVICE_FINGERPRINT_MISMATCH',
  
  // Financial indicators
  ROUND_NUMBER_CLAIMS = 'ROUND_NUMBER_CLAIMS',
  IMMEDIATE_WITHDRAWAL = 'IMMEDIATE_WITHDRAWAL',
  SUSPICIOUS_AMOUNT = 'SUSPICIOUS_AMOUNT',
  
  // Identity indicators
  DUPLICATE_DOCUMENTS = 'DUPLICATE_DOCUMENTS',
  SYNTHETIC_IDENTITY = 'SYNTHETIC_IDENTITY',
  KNOWN_FRAUDSTER = 'KNOWN_FRAUDSTER',
  
  // Network indicators
  SYBIL_ATTACK = 'SYBIL_ATTACK',
  COORDINATED_BEHAVIOR = 'COORDINATED_BEHAVIOR',
  COLLUSION = 'COLLUSION'
}

interface FraudAnalysisResult {
  riskLevel: FraudRiskLevel
  riskScore: number // 0-100
  indicators: FraudIndicator[]
  confidence: number // 0-1
  recommendations: string[]
  requiresReview: boolean
  autoReject: boolean
}

interface UserBehaviorProfile {
  userId: string
  claimsPattern: {
    frequency: number
    averageAmount: number
    timeOfDay: number[]
    daysOfWeek: number[]
  }
  votingPattern: {
    frequency: number
    consistency: number
    timePattern: number[]
  }
  loginPattern: {
    frequency: number
    locations: string[]
    devices: string[]
    timeZones: string[]
  }
  networkConnections: {
    connectedUsers: string[]
    sharedIPs: string[]
    similarBehavior: string[]
  }
}

class FraudDetectionEngine {
  private prisma: PrismaClient
  private auditLogger: AuditLogger

  constructor(prisma: PrismaClient, auditLogger: AuditLogger) {
    this.prisma = prisma
    this.auditLogger = auditLogger
  }

  async analyzeClaim(claimId: string, userId: string): Promise<FraudAnalysisResult> {
    const [claim, userProfile, recentClaims, userConnections] = await Promise.all([
      this.prisma.claim.findUnique({
        where: { id: claimId },
        include: { user: true }
      }),
      this.buildUserProfile(userId),
      this.getRecentClaims(userId, 30), // Last 30 days
      this.analyzeUserConnections(userId)
    ])

    if (!claim) {
      throw new Error('Claim not found')
    }

    const indicators: FraudIndicator[] = []
    let riskScore = 0

    // Analyze claim frequency
    const claimFrequencyAnalysis = this.analyzeClaimFrequency(recentClaims)
    if (claimFrequencyAnalysis.suspicious) {
      indicators.push(FraudIndicator.RAPID_CLAIMS)
      riskScore += 25
    }

    // Analyze claim amounts
    const amountAnalysis = this.analyzeClaimAmount(claim.amount, recentClaims)
    if (amountAnalysis.suspicious) {
      indicators.push(FraudIndicator.SUSPICIOUS_AMOUNT)
      riskScore += 15
    }
    if (amountAnalysis.roundNumber) {
      indicators.push(FraudIndicator.ROUND_NUMBER_CLAIMS)
      riskScore += 10
    }

    // Analyze user behavior patterns
    const behaviorAnalysis = this.analyzeBehaviorPatterns(userProfile)
    indicators.push(...behaviorAnalysis.indicators)
    riskScore += behaviorAnalysis.riskScore

    // Analyze network connections
    const networkAnalysis = this.analyzeNetworkConnections(userConnections)
    indicators.push(...networkAnalysis.indicators)
    riskScore += networkAnalysis.riskScore

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(riskScore)
    const confidence = this.calculateConfidence(indicators, userProfile)

    const result: FraudAnalysisResult = {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      indicators,
      confidence,
      recommendations: this.generateRecommendations(riskLevel, indicators),
      requiresReview: riskLevel === FraudRiskLevel.MEDIUM || riskLevel === FraudRiskLevel.HIGH,
      autoReject: riskLevel === FraudRiskLevel.CRITICAL
    }

    // Log fraud analysis
    await this.auditLogger.log({
      userId,
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      level: riskLevel === FraudRiskLevel.CRITICAL ? AuditLevel.CRITICAL : 
             riskLevel === FraudRiskLevel.HIGH ? AuditLevel.ERROR : AuditLevel.WARN,
      resource: 'claim',
      resourceId: claimId,
      details: {
        riskScore: result.riskScore,
        indicators: result.indicators,
        confidence: result.confidence
      }
    })

    return result
  }

  async analyzeVotingBehavior(userId: string, proposalId: string): Promise<FraudAnalysisResult> {
    const [userVotes, recentVotes, userProfile] = await Promise.all([
      this.prisma.vote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.vote.findMany({
        where: { 
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      this.buildUserProfile(userId)
    ])

    const indicators: FraudIndicator[] = []
    let riskScore = 0

    // Check for rapid voting
    if (recentVotes.length > 50) { // More than 50 votes in a week
      indicators.push(FraudIndicator.SUSPICIOUS_VOTING)
      riskScore += 20
    }

    // Check for bot-like behavior in voting
    const votingTimes = recentVotes.map(v => v.createdAt.getTime())
    const averageInterval = this.calculateAverageInterval(votingTimes)
    if (averageInterval < 60000 && recentVotes.length > 10) { // Less than 1 minute between votes
      indicators.push(FraudIndicator.BOT_LIKE_BEHAVIOR)
      riskScore += 30
    }

    const riskLevel = this.calculateRiskLevel(riskScore)

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      indicators,
      confidence: indicators.length > 0 ? 0.8 : 0.3,
      recommendations: this.generateRecommendations(riskLevel, indicators),
      requiresReview: riskLevel !== FraudRiskLevel.LOW,
      autoReject: riskLevel === FraudRiskLevel.CRITICAL
    }
  }

  private async buildUserProfile(userId: string): Promise<UserBehaviorProfile> {
    const [claims, votes, auditLogs] = await Promise.all([
      this.prisma.claim.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.vote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.auditLog.findMany({
        where: { 
          userId,
          action: { in: [AuditAction.LOGIN, AuditAction.CLAIM_CREATE, AuditAction.PROPOSAL_VOTE] }
        },
        orderBy: { timestamp: 'desc' },
        take: 200
      })
    ])

    return {
      userId,
      claimsPattern: {
        frequency: claims.length,
        averageAmount: claims.reduce((sum, c) => sum + c.amount, 0) / claims.length || 0,
        timeOfDay: claims.map(c => c.createdAt.getHours()),
        daysOfWeek: claims.map(c => c.createdAt.getDay())
      },
      votingPattern: {
        frequency: votes.length,
        consistency: this.calculateVotingConsistency(votes),
        timePattern: votes.map(v => v.createdAt.getHours())
      },
      loginPattern: {
        frequency: auditLogs.filter(l => l.action === AuditAction.LOGIN).length,
        locations: this.extractLocations(auditLogs),
        devices: this.extractDevices(auditLogs),
        timeZones: this.extractTimeZones(auditLogs)
      },
      networkConnections: {
        connectedUsers: [],
        sharedIPs: [],
        similarBehavior: []
      }
    }
  }

  private analyzeClaimFrequency(claims: any[]): { suspicious: boolean; frequency: number } {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const dailyClaims = claims.filter(c => c.createdAt > dayAgo).length
    const weeklyClaims = claims.filter(c => c.createdAt > weekAgo).length

    return {
      suspicious: dailyClaims > 3 || weeklyClaims > 10,
      frequency: weeklyClaims
    }
  }

  private analyzeClaimAmount(amount: number, recentClaims: any[]): { suspicious: boolean; roundNumber: boolean } {
    const amounts = recentClaims.map(c => c.amount)
    const averageAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length || 0

    // Check if amount is significantly higher than average
    const suspicious = amount > averageAmount * 3 && amount > 100000 // More than 3x average and > $1000

    // Check if it's a suspiciously round number
    const roundNumber = amount % 10000 === 0 && amount >= 50000 // Round to $100 and >= $500

    return { suspicious, roundNumber }
  }

  private analyzeBehaviorPatterns(profile: UserBehaviorProfile): { indicators: FraudIndicator[]; riskScore: number } {
    const indicators: FraudIndicator[] = []
    let riskScore = 0

    // Check for unusual time patterns
    const timeVariance = this.calculateTimeVariance(profile.claimsPattern.timeOfDay)
    if (timeVariance < 2) { // Very consistent timing might indicate automation
      indicators.push(FraudIndicator.BOT_LIKE_BEHAVIOR)
      riskScore += 15
    }

    // Check for multiple locations/devices
    if (profile.loginPattern.locations.length > 5) {
      indicators.push(FraudIndicator.VPN_USAGE)
      riskScore += 10
    }

    return { indicators, riskScore }
  }

  private analyzeNetworkConnections(connections: any): { indicators: FraudIndicator[]; riskScore: number } {
    const indicators: FraudIndicator[] = []
    let riskScore = 0

    // Implementation would analyze shared IPs, similar behavior patterns, etc.
    // This is a simplified version

    return { indicators, riskScore }
  }

  private calculateRiskLevel(riskScore: number): FraudRiskLevel {
    if (riskScore >= 80) return FraudRiskLevel.CRITICAL
    if (riskScore >= 60) return FraudRiskLevel.HIGH
    if (riskScore >= 30) return FraudRiskLevel.MEDIUM
    return FraudRiskLevel.LOW
  }

  private calculateConfidence(indicators: FraudIndicator[], profile: UserBehaviorProfile): number {
    let confidence = 0.5 // Base confidence

    // More indicators increase confidence
    confidence += indicators.length * 0.1

    // More data points increase confidence
    if (profile.claimsPattern.frequency > 10) confidence += 0.2
    if (profile.votingPattern.frequency > 20) confidence += 0.1

    return Math.min(1, confidence)
  }

  private generateRecommendations(riskLevel: FraudRiskLevel, indicators: FraudIndicator[]): string[] {
    const recommendations: string[] = []

    if (riskLevel === FraudRiskLevel.CRITICAL) {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Suspend user account')
      recommendations.push('Escalate to security team for investigation')
    }

    if (riskLevel === FraudRiskLevel.HIGH) {
      recommendations.push('Require additional verification before processing')
      recommendations.push('Manual review by senior administrator required')
    }

    if (indicators.includes(FraudIndicator.RAPID_CLAIMS)) {
      recommendations.push('Implement temporary claim frequency limits')
    }

    if (indicators.includes(FraudIndicator.BOT_LIKE_BEHAVIOR)) {
      recommendations.push('Require CAPTCHA verification')
      recommendations.push('Implement behavioral biometrics')
    }

    if (indicators.includes(FraudIndicator.VPN_USAGE)) {
      recommendations.push('Verify user location and identity')
    }

    return recommendations
  }

  // Helper methods
  private async getRecentClaims(userId: string, days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await this.prisma.claim.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  private async analyzeUserConnections(userId: string) {
    // This would implement network analysis to find connected users
    // For now, return empty analysis
    return {
      connectedUsers: [],
      suspiciousConnections: [],
      sharedBehaviors: []
    }
  }

  private calculateVotingConsistency(votes: any[]): number {
    // Simplified consistency calculation
    if (votes.length < 5) return 0.5

    const yesVotes = votes.filter(v => v.choice === 'YES').length
    const ratio = yesVotes / votes.length
    
    // Very consistent voting (all yes or all no) might be suspicious
    return ratio > 0.9 || ratio < 0.1 ? 0.1 : 0.8
  }

  private calculateAverageInterval(timestamps: number[]): number {
    if (timestamps.length < 2) return 0

    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i-1] - timestamps[i])
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  }

  private calculateTimeVariance(hours: number[]): number {
    if (hours.length === 0) return 0

    const mean = hours.reduce((sum, h) => sum + h, 0) / hours.length
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length
    
    return Math.sqrt(variance)
  }

  private extractLocations(auditLogs: any[]): string[] {
    // Extract locations from IP addresses in metadata
    return []
  }

  private extractDevices(auditLogs: any[]): string[] {
    // Extract device fingerprints from user agents
    return []
  }

  private extractTimeZones(auditLogs: any[]): string[] {
    // Extract time zones from login patterns
    return []
  }
}

export { FraudDetectionEngine }
export type { FraudAnalysisResult, UserBehaviorProfile }