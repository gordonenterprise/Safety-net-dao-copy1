import { prisma } from '@safetynet/db'
import { getCurrentUser } from '@/lib/auth/requireRole'

export interface AuditLogEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VOTE' | 'APPROVE' | 'REJECT' | 'PAYOUT' | 'REFUND'
  entityType: string
  entityId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const currentUser = await getCurrentUser()
    
    await prisma.auditLog.create({
      data: {
        userId: currentUser?.userId || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues || undefined,
        newValues: entry.newValues || undefined,
        metadata: entry.metadata || undefined,
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking main functionality
  }
}

// Helper functions for common audit actions
export async function auditRoleChange(
  userId: string, 
  oldRole: string, 
  newRole: string, 
  reason: string
) {
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'user',
    entityId: userId,
    oldValues: { role: oldRole },
    newValues: { role: newRole },
    metadata: { reason }
  })
}

export async function auditClaimDecision(
  claimId: string, 
  decision: string, 
  notes: string,
  oldStatus: string,
  newStatus: string
) {
  await createAuditLog({
    action: decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
    entityType: 'claim', 
    entityId: claimId,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus, decision, notes },
  })
}

export async function auditSettingsChange(
  settingKey: string,
  oldValue: any,
  newValue: any
) {
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'settings',
    entityId: settingKey,
    oldValues: { [settingKey]: oldValue },
    newValues: { [settingKey]: newValue },
  })
}

export async function auditTreasuryAction(
  action: string,
  amount: string,
  recipient?: string,
  reason?: string
) {
  await createAuditLog({
    action: 'PAYOUT',
    entityType: 'treasury',
    entityId: 'treasury',
    newValues: { action, amount, recipient },
    metadata: { reason }
  })
}

export async function auditWalletLink(
  userId: string,
  walletAddress: string
) {
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'user',
    entityId: userId,
    newValues: { walletAddress }
  })
}

export async function auditLogin(
  userId: string,
  provider: string,
  ip?: string
) {
  await createAuditLog({
    action: 'LOGIN',
    entityType: 'user',
    entityId: userId,
    metadata: { provider, ip }
  })
}

export async function auditLogout(userId: string) {
  await createAuditLog({
    action: 'LOGOUT',
    entityType: 'user',
    entityId: userId,
  })
}