import { PrismaClient } from '@safetynet/db'
import { AuditLogger, AuditAction, AuditLevel } from './audit-logger'

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertCategory {
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  FRAUD = 'FRAUD',
  SYSTEM = 'SYSTEM',
  BUSINESS = 'BUSINESS'
}

interface Alert {
  id: string
  category: AlertCategory
  severity: AlertSeverity
  title: string
  description: string
  metadata: Record<string, any>
  threshold?: number
  currentValue?: number
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

interface MetricThreshold {
  name: string
  category: AlertCategory
  severity: AlertSeverity
  threshold: number
  comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  timeWindow: number // in minutes
  enabled: boolean
}

interface SystemMetrics {
  // Performance metrics
  responseTime: number
  errorRate: number
  requestRate: number
  databaseConnections: number
  memoryUsage: number
  cpuUsage: number
  
  // Business metrics
  activeUsers: number
  pendingClaims: number
  treasuryBalance: number
  dailyTransactions: number
  
  // Security metrics
  failedLogins: number
  suspiciousActivities: number
  rateLimitViolations: number
  blockedIPs: number
}

class MonitoringSystem {
  private prisma: PrismaClient
  private auditLogger: AuditLogger
  private alerts: Map<string, Alert> = new Map()
  private metrics: SystemMetrics = this.initializeMetrics()
  private thresholds: MetricThreshold[] = this.getDefaultThresholds()

  constructor(prisma: PrismaClient, auditLogger: AuditLogger) {
    this.prisma = prisma
    this.auditLogger = auditLogger
    
    // Start monitoring loop
    this.startMonitoring()
  }

  // Metric collection methods
  async collectMetrics(): Promise<SystemMetrics> {
    const [
      pendingClaims,
      treasuryBalance,
      failedLogins,
      suspiciousActivities,
      rateLimitViolations
    ] = await Promise.all([
      this.prisma.claim.count({ where: { status: 'PENDING' } }),
      this.getTreasuryBalance(),
      this.getFailedLoginCount(),
      this.getSuspiciousActivityCount(),
      this.getRateLimitViolationCount()
    ])

    this.metrics = {
      // Performance metrics (would come from application monitoring)
      responseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      requestRate: await this.getRequestRate(),
      databaseConnections: await this.getDatabaseConnectionCount(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: await this.getCPUUsage(),
      
      // Business metrics
      activeUsers: await this.getActiveUserCount(),
      pendingClaims,
      treasuryBalance,
      dailyTransactions: await this.getDailyTransactionCount(),
      
      // Security metrics
      failedLogins,
      suspiciousActivities,
      rateLimitViolations,
      blockedIPs: await this.getBlockedIPCount()
    }

    return this.metrics
  }

  // Alert management
  async createAlert(
    category: AlertCategory,
    severity: AlertSeverity,
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      severity,
      title,
      description,
      metadata,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.set(alert.id, alert)

    // Store in database
    await this.prisma.alert.create({
      data: {
        id: alert.id,
        category: alert.category,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: JSON.stringify(alert.metadata),
        timestamp: alert.timestamp,
        resolved: alert.resolved
      }
    })

    // Send notifications
    await this.sendAlertNotification(alert)

    // Log alert creation
    await this.auditLogger.log({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      level: this.severityToAuditLevel(severity),
      resource: 'monitoring',
      resourceId: alert.id,
      details: {
        category: alert.category,
        title: alert.title,
        description: alert.description
      }
    })

    return alert
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId)
    if (!alert) return

    alert.resolved = true
    alert.resolvedAt = new Date()
    alert.resolvedBy = resolvedBy

    // Update in database
    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: alert.resolvedAt,
        resolvedBy
      }
    })

    this.alerts.set(alertId, alert)
  }

  // Threshold monitoring
  async checkThresholds(): Promise<Alert[]> {
    const newAlerts: Alert[] = []
    
    for (const threshold of this.thresholds.filter(t => t.enabled)) {
      const currentValue = this.getMetricValue(threshold.name)
      if (currentValue === undefined) continue

      const violated = this.checkThresholdViolation(currentValue, threshold)
      
      if (violated) {
        // Check if we already have an active alert for this threshold
        const existingAlert = Array.from(this.alerts.values()).find(
          alert => !alert.resolved && 
                   alert.metadata.thresholdName === threshold.name
        )

        if (!existingAlert) {
          const alert = await this.createAlert(
            threshold.category,
            threshold.severity,
            `Threshold Violation: ${threshold.name}`,
            `${threshold.name} is ${currentValue}, which violates the threshold of ${threshold.threshold}`,
            {
              thresholdName: threshold.name,
              threshold: threshold.threshold,
              currentValue,
              comparison: threshold.comparison
            }
          )
          newAlerts.push(alert)
        }
      }
    }

    return newAlerts
  }

  // Health check endpoints
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: SystemMetrics
    activeAlerts: number
    criticalAlerts: number
  }> {
    await this.collectMetrics()
    
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved)
    const criticalAlerts = activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL)

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (criticalAlerts.length > 0) {
      status = 'unhealthy'
    } else if (activeAlerts.length > 5 || this.metrics.errorRate > 5) {
      status = 'degraded'
    }

    return {
      status,
      metrics: this.metrics,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length
    }
  }

  async getAlerts(params: {
    category?: AlertCategory
    severity?: AlertSeverity
    resolved?: boolean
    limit?: number
    offset?: number
  } = {}): Promise<Alert[]> {
    const where: any = {}
    
    if (params.category) where.category = params.category
    if (params.severity) where.severity = params.severity
    if (params.resolved !== undefined) where.resolved = params.resolved

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0
    })

    return alerts.map(alert => ({
      ...alert,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : {}
    }))
  }

  // Configuration
  updateThreshold(name: string, updates: Partial<MetricThreshold>): void {
    const index = this.thresholds.findIndex(t => t.name === name)
    if (index !== -1) {
      this.thresholds[index] = { ...this.thresholds[index], ...updates }
    }
  }

  addThreshold(threshold: MetricThreshold): void {
    this.thresholds.push(threshold)
  }

  removeThreshold(name: string): void {
    this.thresholds = this.thresholds.filter(t => t.name !== name)
  }

  // Private methods
  private startMonitoring(): void {
    // Collect metrics every minute
    setInterval(async () => {
      try {
        await this.collectMetrics()
        await this.checkThresholds()
      } catch (error) {
        console.error('Monitoring error:', error)
      }
    }, 60000)

    // Cleanup old alerts every hour
    setInterval(async () => {
      await this.cleanupOldAlerts()
    }, 3600000)
  }

  private async cleanupOldAlerts(): void {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30) // Keep alerts for 30 days

    await this.prisma.alert.deleteMany({
      where: {
        timestamp: { lt: cutoff },
        resolved: true
      }
    })
  }

  private getMetricValue(metricName: string): number | undefined {
    return (this.metrics as any)[metricName]
  }

  private checkThresholdViolation(value: number, threshold: MetricThreshold): boolean {
    switch (threshold.comparison) {
      case 'gt': return value > threshold.threshold
      case 'lt': return value < threshold.threshold
      case 'eq': return value === threshold.threshold
      case 'gte': return value >= threshold.threshold
      case 'lte': return value <= threshold.threshold
      default: return false
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    // Send to various notification channels based on severity
    if (alert.severity === AlertSeverity.CRITICAL) {
      await this.sendSlackAlert(alert)
      await this.sendEmailAlert(alert)
    } else if (alert.severity === AlertSeverity.HIGH) {
      await this.sendSlackAlert(alert)
    }
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return

    const color = {
      [AlertSeverity.LOW]: 'good',
      [AlertSeverity.MEDIUM]: 'warning',
      [AlertSeverity.HIGH]: 'danger',
      [AlertSeverity.CRITICAL]: 'danger'
    }[alert.severity]

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${alert.severity} Alert: ${alert.title}`,
          attachments: [{
            color,
            fields: [
              { title: 'Category', value: alert.category, short: true },
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Description', value: alert.description, short: false },
              { title: 'Time', value: alert.timestamp.toISOString(), short: true }
            ]
          }]
        })
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Implementation would depend on email service
    console.log('Email alert would be sent:', alert)
  }

  private severityToAuditLevel(severity: AlertSeverity): AuditLevel {
    switch (severity) {
      case AlertSeverity.CRITICAL: return AuditLevel.CRITICAL
      case AlertSeverity.HIGH: return AuditLevel.ERROR
      case AlertSeverity.MEDIUM: return AuditLevel.WARN
      case AlertSeverity.LOW: return AuditLevel.INFO
    }
  }

  private initializeMetrics(): SystemMetrics {
    return {
      responseTime: 0,
      errorRate: 0,
      requestRate: 0,
      databaseConnections: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeUsers: 0,
      pendingClaims: 0,
      treasuryBalance: 0,
      dailyTransactions: 0,
      failedLogins: 0,
      suspiciousActivities: 0,
      rateLimitViolations: 0,
      blockedIPs: 0
    }
  }

  private getDefaultThresholds(): MetricThreshold[] {
    return [
      {
        name: 'responseTime',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.HIGH,
        threshold: 5000, // 5 seconds
        comparison: 'gt',
        timeWindow: 5,
        enabled: true
      },
      {
        name: 'errorRate',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.MEDIUM,
        threshold: 5, // 5%
        comparison: 'gt',
        timeWindow: 10,
        enabled: true
      },
      {
        name: 'failedLogins',
        category: AlertCategory.SECURITY,
        severity: AlertSeverity.HIGH,
        threshold: 50, // 50 failed logins per hour
        comparison: 'gt',
        timeWindow: 60,
        enabled: true
      },
      {
        name: 'suspiciousActivities',
        category: AlertCategory.FRAUD,
        severity: AlertSeverity.CRITICAL,
        threshold: 10, // 10 suspicious activities per hour
        comparison: 'gt',
        timeWindow: 60,
        enabled: true
      },
      {
        name: 'treasuryBalance',
        category: AlertCategory.BUSINESS,
        severity: AlertSeverity.CRITICAL,
        threshold: 1000000, // $10,000 minimum
        comparison: 'lt',
        timeWindow: 60,
        enabled: true
      }
    ]
  }

  // Metric collection helpers (these would integrate with actual monitoring tools)
  private async getAverageResponseTime(): Promise<number> {
    // Would integrate with APM tools like New Relic, DataDog, etc.
    return Math.random() * 1000 + 200 // Mock data
  }

  private async getErrorRate(): Promise<number> {
    return Math.random() * 2 // Mock data
  }

  private async getRequestRate(): Promise<number> {
    return Math.random() * 100 + 50 // Mock data
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    // Would check actual DB pool
    return Math.floor(Math.random() * 20) + 5
  }

  private async getCPUUsage(): Promise<number> {
    return Math.random() * 100 // Mock data
  }

  private async getActiveUserCount(): Promise<number> {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    return await this.prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN,
        timestamp: { gte: oneDayAgo }
      },
      distinct: ['userId']
    })
  }

  private async getTreasuryBalance(): Promise<number> {
    // Would integrate with blockchain/wallet APIs
    return 12500000 // Mock data: $125,000
  }

  private async getDailyTransactionCount(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return await this.prisma.auditLog.count({
      where: {
        action: { in: [AuditAction.TRANSACTION_CREATE, AuditAction.CLAIM_CREATE] },
        timestamp: { gte: today }
      }
    })
  }

  private async getFailedLoginCount(): Promise<number> {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    return await this.prisma.auditLog.count({
      where: {
        action: AuditAction.LOGIN_FAILED,
        timestamp: { gte: oneHourAgo }
      }
    })
  }

  private async getSuspiciousActivityCount(): Promise<number> {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    return await this.prisma.auditLog.count({
      where: {
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        timestamp: { gte: oneHourAgo }
      }
    })
  }

  private async getRateLimitViolationCount(): Promise<number> {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    return await this.prisma.auditLog.count({
      where: {
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        timestamp: { gte: oneHourAgo }
      }
    })
  }

  private async getBlockedIPCount(): Promise<number> {
    // Would check firewall/security service
    return Math.floor(Math.random() * 10) // Mock data
  }
}

export { MonitoringSystem }
export type { Alert, MetricThreshold, SystemMetrics }