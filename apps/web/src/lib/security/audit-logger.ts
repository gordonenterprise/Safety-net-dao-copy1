import { PrismaClient } from '@safetynet/db'

// Audit log types
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // User management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_SUSPEND = 'USER_SUSPEND',
  USER_REACTIVATE = 'USER_REACTIVATE',
  
  // Claims
  CLAIM_CREATE = 'CLAIM_CREATE',
  CLAIM_UPDATE = 'CLAIM_UPDATE',
  CLAIM_APPROVE = 'CLAIM_APPROVE',
  CLAIM_REJECT = 'CLAIM_REJECT',
  CLAIM_VOTE = 'CLAIM_VOTE',
  
  // Governance
  PROPOSAL_CREATE = 'PROPOSAL_CREATE',
  PROPOSAL_UPDATE = 'PROPOSAL_UPDATE',
  PROPOSAL_VOTE = 'PROPOSAL_VOTE',
  PROPOSAL_EXECUTE = 'PROPOSAL_EXECUTE',
  
  // Treasury
  TRANSACTION_CREATE = 'TRANSACTION_CREATE',
  TRANSACTION_APPROVE = 'TRANSACTION_APPROVE',
  TRANSACTION_REJECT = 'TRANSACTION_REJECT',
  
  // NFT
  NFT_MINT = 'NFT_MINT',
  NFT_TRANSFER = 'NFT_TRANSFER',
  NFT_BURN = 'NFT_BURN',
  
  // Admin
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  BULK_ACTION = 'BULK_ACTION',
  
  // Security
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

export enum AuditLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

interface AuditLogEntry {
  userId?: string
  walletAddress?: string
  action: AuditAction
  level: AuditLevel
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  metadata?: {
    userAgent?: string
    ipAddress?: string
    sessionId?: string
    requestId?: string
    timestamp?: Date
  }
}

interface AuditQuery {
  userId?: string
  walletAddress?: string
  action?: AuditAction
  level?: AuditLevel
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

class AuditLogger {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Store in database
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          walletAddress: entry.walletAddress,
          action: entry.action,
          level: entry.level,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details ? JSON.stringify(entry.details) : null,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          timestamp: entry.metadata?.timestamp || new Date(),
        }
      })

      // For critical events, also log to external monitoring
      if (entry.level === AuditLevel.CRITICAL) {
        await this.alertCriticalEvent(entry)
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${entry.level}: ${entry.action}`, {
          userId: entry.userId,
          resource: entry.resource,
          details: entry.details
        })
      }

    } catch (error) {
      console.error('Failed to write audit log:', error)
      // Don't throw - audit logging should not break the application
    }
  }

  async query(params: AuditQuery) {
    const where: any = {}
    
    if (params.userId) where.userId = params.userId
    if (params.walletAddress) where.walletAddress = params.walletAddress
    if (params.action) where.action = params.action
    if (params.level) where.level = params.level
    if (params.resource) where.resource = params.resource
    if (params.startDate || params.endDate) {
      where.timestamp = {}
      if (params.startDate) where.timestamp.gte = params.startDate
      if (params.endDate) where.timestamp.lte = params.endDate
    }

    return await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    })
  }

  async getStatistics(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const [total, byLevel, byAction, byUser] = await Promise.all([
      // Total logs
      this.prisma.auditLog.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // By level
      this.prisma.auditLog.groupBy({
        by: ['level'],
        where: { timestamp: { gte: startDate } },
        _count: { level: true }
      }),
      
      // By action
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // By user
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          timestamp: { gte: startDate },
          userId: { not: null }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ])

    return {
      total,
      byLevel: byLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level
        return acc
      }, {} as Record<string, number>),
      topActions: byAction.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      topUsers: byUser.map(item => ({
        userId: item.userId,
        count: item._count.userId
      }))
    }
  }

  private async alertCriticalEvent(entry: AuditLogEntry): Promise<void> {
    // Implement alerting logic (Slack, Discord, email, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Security Event: ${entry.action}`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Action', value: entry.action, short: true },
                { title: 'User', value: entry.userId || entry.walletAddress || 'Unknown', short: true },
                { title: 'Resource', value: entry.resource || 'N/A', short: true },
                { title: 'Time', value: new Date().toISOString(), short: true }
              ]
            }]
          })
        })
      } catch (error) {
        console.error('Failed to send critical alert:', error)
      }
    }
  }

  // Helper methods for common audit scenarios
  async logUserAction(userId: string, action: AuditAction, details?: Record<string, any>, metadata?: AuditLogEntry['metadata']) {
    await this.log({
      userId,
      action,
      level: AuditLevel.INFO,
      details,
      metadata
    })
  }

  async logSecurityEvent(action: AuditAction, level: AuditLevel, details?: Record<string, any>, metadata?: AuditLogEntry['metadata']) {
    await this.log({
      action,
      level,
      resource: 'security',
      details,
      metadata
    })
  }

  async logAdminAction(userId: string, action: AuditAction, resource?: string, resourceId?: string, details?: Record<string, any>, metadata?: AuditLogEntry['metadata']) {
    await this.log({
      userId,
      action,
      level: AuditLevel.WARN, // Admin actions are important
      resource,
      resourceId,
      details,
      metadata
    })
  }

  async logTransactionEvent(userId: string, action: AuditAction, transactionId: string, details?: Record<string, any>, metadata?: AuditLogEntry['metadata']) {
    await this.log({
      userId,
      action,
      level: AuditLevel.INFO,
      resource: 'transaction',
      resourceId: transactionId,
      details,
      metadata
    })
  }
}

// Middleware helper to extract request metadata
export function extractRequestMetadata(request: Request): AuditLogEntry['metadata'] {
  return {
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
    requestId: request.headers.get('x-request-id') || undefined,
    timestamp: new Date()
  }
}

export { AuditLogger }
export type { AuditLogEntry, AuditQuery }