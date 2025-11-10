import { PrismaClient } from '@safetynet/db'
import { AuditLogger } from './audit-logger'
import { FraudDetectionEngine } from './fraud-detection'
import { MonitoringSystem } from './monitoring'
import { rateLimiter } from './rate-limiter'

// Initialize security systems
let securitySystems: {
  prisma: PrismaClient
  auditLogger: AuditLogger
  fraudDetection: FraudDetectionEngine
  monitoring: MonitoringSystem
} | null = null

export function initializeSecurity() {
  if (securitySystems) {
    return securitySystems
  }

  const prisma = new PrismaClient()
  const auditLogger = new AuditLogger(prisma)
  const fraudDetection = new FraudDetectionEngine(prisma, auditLogger)
  const monitoring = new MonitoringSystem(prisma, auditLogger)

  securitySystems = {
    prisma,
    auditLogger,
    fraudDetection,
    monitoring
  }

  return securitySystems
}

export function getSecuritySystems() {
  if (!securitySystems) {
    return initializeSecurity()
  }
  return securitySystems
}

// Common security checks
export async function performSecurityChecks(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  const { auditLogger, fraudDetection, monitoring } = getSecuritySystems()

  // Log the action
  await auditLogger.logUserAction(userId, action as any, metadata)

  // Fraud detection for sensitive actions
  if (['claim_create', 'vote_cast', 'proposal_create'].includes(action)) {
    const analysis = await fraudDetection.analyzeClaim(
      metadata?.resourceId || '',
      userId
    )

    if (analysis.autoReject) {
      throw new Error('Action blocked due to security concerns')
    }

    if (analysis.requiresReview) {
      await monitoring.createAlert(
        'FRAUD',
        analysis.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        `Security Review Required: ${action}`,
        `User ${userId} action requires manual review. Risk: ${analysis.riskLevel}`,
        { userId, action, analysis }
      )
    }

    return analysis
  }

  return null
}

// Rate limiting helpers
export const securityRateLimits = {
  // API endpoints
  checkAPILimit: (identifier: string, userRole: 'USER' | 'ADMIN' = 'USER') => {
    const config = userRole === 'ADMIN' 
      ? rateLimiter.configs.api.admin
      : rateLimiter.configs.api.authenticated
    
    return rateLimiter.checkLimit({
      identifier,
      ...config
    })
  },

  // Feature limits
  checkClaimLimit: (userId: string) => {
    return rateLimiter.checkLimit({
      identifier: `claim:${userId}`,
      ...rateLimiter.configs.claims.submit
    })
  },

  checkVoteLimit: (userId: string) => {
    return rateLimiter.checkLimit({
      identifier: `vote:${userId}`,
      ...rateLimiter.configs.governance.vote
    })
  },

  checkLoginLimit: (identifier: string) => {
    return rateLimiter.checkLimit({
      identifier: `login:${identifier}`,
      ...rateLimiter.configs.auth.login
    })
  }
}

// Security middleware factory
export function withSecurity(
  config: {
    requireAuth?: boolean
    requireAdmin?: boolean
    rateLimit?: string
    auditAction?: string
    fraudCheck?: boolean
  } = {}
) {
  return async function securityMiddleware(
    request: any,
    context: { userId?: string; userRole?: string }
  ) {
    const { auditLogger, fraudDetection } = getSecuritySystems()

    // Authentication check
    if (config.requireAuth && !context.userId) {
      throw new Error('Authentication required')
    }

    if (config.requireAdmin && context.userRole !== 'ADMIN') {
      throw new Error('Admin access required')
    }

    // Rate limiting
    if (config.rateLimit) {
      const identifier = context.userId || request.ip || 'anonymous'
      const limit = await securityRateLimits.checkAPILimit(
        identifier,
        context.userRole as any
      )
      
      if (!limit.success) {
        throw new Error('Rate limit exceeded')
      }
    }

    // Audit logging
    if (config.auditAction) {
      await auditLogger.logUserAction(
        context.userId || 'anonymous',
        config.auditAction as any,
        {
          path: request.url,
          method: request.method,
          ip: request.ip
        }
      )
    }

    // Fraud detection
    if (config.fraudCheck && context.userId) {
      await performSecurityChecks(
        context.userId,
        config.auditAction || 'unknown',
        { path: request.url }
      )
    }
  }
}

// Health check
export async function getSecurityHealth() {
  const { monitoring } = getSecuritySystems()
  return await monitoring.getSystemHealth()
}

// Emergency procedures
export async function emergencyLockdown(reason: string, adminId: string) {
  const { auditLogger, monitoring } = getSecuritySystems()

  await monitoring.createAlert(
    'SECURITY',
    'CRITICAL',
    'Emergency Lockdown Initiated',
    `System lockdown initiated by admin ${adminId}. Reason: ${reason}`,
    { adminId, reason, timestamp: new Date().toISOString() }
  )

  await auditLogger.logSecurityEvent(
    'SUSPICIOUS_ACTIVITY' as any,
    'CRITICAL' as any,
    { action: 'emergency_lockdown', reason, adminId }
  )

  // In a real implementation, this would:
  // - Disable new user registrations
  // - Increase rate limits
  // - Require additional verification
  // - Alert all administrators
  
  return {
    success: true,
    message: 'Emergency lockdown initiated',
    lockdownId: `lockdown_${Date.now()}`
  }
}

export { rateLimiter }
export type { SecuritySystems } from './types'

// Export individual components for direct use
export { AuditLogger, AuditAction, AuditLevel } from './audit-logger'
export { FraudDetectionEngine, FraudRiskLevel, FraudIndicator } from './fraud-detection'
export { MonitoringSystem, AlertSeverity, AlertCategory } from './monitoring'
export { SecurityMiddleware, securityConfigs } from './middleware'