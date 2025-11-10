'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@safetynet/db'
import { requireRole } from '@/lib/auth/requireRole'
import { validateRequest, claimSubmissionSchema, claimReviewSchema } from '@/lib/validation'
import { auditClaimDecision, createAuditLog } from '@/lib/audit'
import { ClaimStatus } from '@prisma/client'

// Action response types
type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit a new claim - requires MEMBER role
 */
export async function submitClaim(
  formData: FormData
): Promise<ActionResponse<{ claimId: string; riskScore: number }>> {
  try {
    // GUARD: Require MEMBER role
    const user = await requireRole('MEMBER')

    // Validate input data
    const rawData = {
      amountCents: Number(formData.get('amountCents')),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      evidenceFiles: [] // Handle file validation separately
    }

    const validatedData = validateRequest(claimSubmissionSchema, rawData)

    // Check member eligibility (60-day rule)
    const membershipCheck = await prisma.membership.findUnique({
      where: { userId: user.userId },
      select: { joinedAt: true, status: true }
    })

    if (!membershipCheck || membershipCheck.status !== 'ACTIVE') {
      return { success: false, error: 'Active membership required' }
    }

    const daysSinceMembership = Math.floor(
      (Date.now() - membershipCheck.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceMembership < 60) {
      return { 
        success: false, 
        error: `Eligibility requires 60 days of membership. You have ${daysSinceMembership} days.`
      }
    }

    // Calculate basic risk score (simplified)
    const riskScore = Math.min(validatedData.amountCents / 1000, 100)

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        userId: user.userId,
        amountCents: validatedData.amountCents,
        description: validatedData.description,
        riskScore: Math.floor(riskScore),
        status: 'SUBMITTED',
      }
    })

    // AUDIT LOG
    await createAuditLog({
      action: 'CLAIM_SUBMITTED',
      entity: 'claim',
      entityId: claim.id,
      after: { 
        amountCents: validatedData.amountCents,
        description: validatedData.description.substring(0, 100)
      }
    })

    revalidatePath('/claims')
    
    return {
      success: true,
      data: {
        claimId: claim.id,
        riskScore: Math.floor(riskScore)
      }
    }

  } catch (error) {
    console.error('Claim submission failed:', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to submit claim' }
  }
}

/**
 * Approve a claim - requires VALIDATOR role
 */
export async function approveClaim(
  claimId: string,
  notes: string,
  approvedAmount?: number
): Promise<ActionResponse> {
  try {
    // GUARD: Require VALIDATOR role  
    const user = await requireRole('VALIDATOR')

    const validation = validateRequest(claimReviewSchema, {
      claimId,
      decision: 'APPROVE',
      notes
    })

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true, amountCents: true, userId: true }
    })

    if (!claim) {
      return { success: false, error: 'Claim not found' }
    }

    if (claim.status !== 'SUBMITTED' && claim.status !== 'FLAGGED') {
      return { success: false, error: 'Claim cannot be approved in current status' }
    }

    const oldStatus = claim.status
    const finalAmount = approvedAmount || claim.amountCents

    // Update claim
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'APPROVED',
        validatorId: user.userId,
        decisionNote: validation.notes,
        updatedAt: new Date(),
      }
    })

    // AUDIT LOG
    await auditClaimDecision(
      claimId,
      'APPROVE', 
      validation.notes,
      oldStatus,
      'APPROVED'
    )

    revalidatePath('/admin/claims')
    return { success: true }

  } catch (error) {
    console.error('Claim approval failed:', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to approve claim' }
  }
}

/**
 * Deny a claim - requires VALIDATOR role
 */
export async function denyClaim(
  claimId: string,
  notes: string
): Promise<ActionResponse> {
  try {
    // GUARD: Require VALIDATOR role
    const user = await requireRole('VALIDATOR')

    const validation = validateRequest(claimReviewSchema, {
      claimId,
      decision: 'DENY', 
      notes
    })

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true }
    })

    if (!claim) {
      return { success: false, error: 'Claim not found' }
    }

    if (!['SUBMITTED', 'FLAGGED'].includes(claim.status)) {
      return { success: false, error: 'Claim cannot be denied in current status' }
    }

    const oldStatus = claim.status

    // Update claim
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'DENIED',
        validatorId: user.userId,
        decisionNote: validation.notes,
        updatedAt: new Date(),
      }
    })

    // AUDIT LOG
    await auditClaimDecision(
      claimId,
      'DENY',
      validation.notes, 
      oldStatus,
      'DENIED'
    )

    revalidatePath('/admin/claims')
    return { success: true }

  } catch (error) {
    console.error('Claim denial failed:', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to deny claim' }
  }
}

/**
 * Escalate a claim - requires VALIDATOR role
 */
export async function escalateClaim(
  claimId: string,
  notes: string
): Promise<ActionResponse> {
  try {
    // GUARD: Require VALIDATOR role
    const user = await requireRole('VALIDATOR')

    const validation = validateRequest(claimReviewSchema, {
      claimId,
      decision: 'ESCALATE',
      notes
    })

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true }
    })

    if (!claim) {
      return { success: false, error: 'Claim not found' }
    }

    const oldStatus = claim.status

    // Update claim to flagged status
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'FLAGGED',
        validatorId: user.userId,
        decisionNote: validation.notes,
        updatedAt: new Date(),
      }
    })

    // AUDIT LOG
    await auditClaimDecision(
      claimId,
      'ESCALATE',
      validation.notes,
      oldStatus, 
      'FLAGGED'
    )

    revalidatePath('/admin/claims')
    return { success: true }

  } catch (error) {
    console.error('Claim escalation failed:', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to escalate claim' }
  }
}

/**
 * Mark claim as paid - requires ADMIN role  
 */
export async function markClaimPaid(
  claimId: string,
  transactionHash: string
): Promise<ActionResponse> {
  try {
    // GUARD: Require ADMIN role
    const user = await requireRole('ADMIN')

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true, amountCents: true }
    })

    if (!claim) {
      return { success: false, error: 'Claim not found' }
    }

    if (claim.status !== 'APPROVED') {
      return { success: false, error: 'Only approved claims can be marked as paid' }
    }

    // Update claim
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'PAID',
        txHash: transactionHash,
        updatedAt: new Date(),
      }
    })

    // AUDIT LOG
    await createAuditLog({
      action: 'CLAIM_PAID',
      entity: 'claim',
      entityId: claimId,
      after: { 
        txHash: transactionHash,
        amount: claim.amountCents 
      }
    })

    revalidatePath('/admin/claims')
    return { success: true }

  } catch (error) {
    console.error('Mark claim paid failed:', error)
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to mark claim as paid' }
  }
}