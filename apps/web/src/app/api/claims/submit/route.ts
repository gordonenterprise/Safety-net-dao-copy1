import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'
import { rateLimit } from '../../../lib/rate-limit'
import { auditLog } from '../../../lib/audit'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema
const claimSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(50).max(2000),
  category: z.enum(['MEDICAL', 'VEHICLE', 'DEVICE', 'INCOME_LOSS', 'EMERGENCY']),
  requestedAmount: z.number().min(100).max(50000), // $1 to $500 in cents
  evidenceNotes: z.string().min(10).max(1000)
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 claims per day per user
    const rateLimitResult = await rateLimit({
      identifier: request.ip || 'unknown',
      action: 'claim_submit',
      limit: 3,
      window: 24 * 60 * 60 * 1000 // 24 hours
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many claims submitted today. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is eligible for claims
    const eligibilityResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/claims/eligibility`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!eligibilityResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify eligibility' },
        { status: 500 }
      )
    }

    const eligibility = await eligibilityResponse.json()
    if (!eligibility.isEligible) {
      return NextResponse.json(
        { error: eligibility.message },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    
    const claimData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      requestedAmount: parseInt(formData.get('requestedAmount') as string),
      evidenceNotes: formData.get('evidenceNotes') as string
    }

    // Validate data
    const validatedData = claimSchema.parse(claimData)

    // Process file attachments
    const attachments: string[] = []
    const attachmentFiles: File[] = []

    // Extract files from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && value instanceof File) {
        attachmentFiles.push(value)
      }
    }

    if (attachmentFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one supporting document is required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would upload files to cloud storage
    // For now, we'll simulate file processing
    for (const file of attachmentFiles) {
      // Simulate file upload to cloud storage (S3, etc.)
      const fileName = `claim_${Date.now()}_${file.name}`
      attachments.push(`https://storage.safetynet.dao/claims/${fileName}`)
    }

    // Calculate risk score based on various factors
    const riskScore = calculateRiskScore({
      amount: validatedData.requestedAmount,
      category: validatedData.category,
      descriptionLength: validatedData.description.length,
      hasEvidence: attachments.length > 0
    })

    // Create claim in database
    const claim = await prisma.claim.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category as any,
        requestedAmount: validatedData.requestedAmount,
        evidenceNotes: validatedData.evidenceNotes,
        attachments: attachments,
        status: riskScore > 0.7 ? 'FLAGGED' : 'SUBMITTED',
        priority: determinePriority(validatedData.category, validatedData.requestedAmount),
        riskScore: riskScore,
        riskFactors: {
          amount: validatedData.requestedAmount,
          category: validatedData.category,
          evidenceCount: attachments.length,
          descriptionQuality: validatedData.description.length / 2000
        },
        duplicateCheckCid: generateDuplicateCheckHash(validatedData),
        evidenceCid: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    // Auto-flag high-risk claims
    if (riskScore > 0.7) {
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          flaggedAt: new Date(),
          flaggedReason: 'Automatically flagged for high risk score'
        }
      })
    }

    // Audit log
    await auditLog({
      userId: session.user.id,
      claimId: claim.id,
      action: 'CREATE',
      entityType: 'claim',
      entityId: claim.id,
      metadata: {
        category: validatedData.category,
        amount: validatedData.requestedAmount,
        riskScore: riskScore,
        status: claim.status
      }
    })

    // TODO: Trigger notifications to validators for review

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      message: claim.status === 'FLAGGED' 
        ? 'Your claim has been submitted and flagged for additional review.'
        : 'Your claim has been submitted successfully and is under review.'
    })

  } catch (error) {
    console.error('Error submitting claim:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid claim data', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit claim' },
      { status: 500 }
    )
  }
}

function calculateRiskScore(factors: {
  amount: number
  category: string
  descriptionLength: number
  hasEvidence: boolean
}): number {
  let score = 0

  // Amount factor (higher amounts = higher risk)
  score += Math.min(factors.amount / 50000, 1) * 0.3

  // Category factor
  const categoryRisk = {
    'MEDICAL': 0.2,
    'VEHICLE': 0.3,
    'DEVICE': 0.4,
    'INCOME_LOSS': 0.5,
    'EMERGENCY': 0.6
  }
  score += categoryRisk[factors.category as keyof typeof categoryRisk] || 0.5

  // Description quality (shorter descriptions = higher risk)
  if (factors.descriptionLength < 100) {
    score += 0.3
  } else if (factors.descriptionLength < 200) {
    score += 0.1
  }

  // Evidence factor
  if (!factors.hasEvidence) {
    score += 0.4
  }

  return Math.min(score, 1)
}

function determinePriority(category: string, amount: number): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  if (category === 'MEDICAL' && amount > 30000) return 'URGENT'
  if (amount > 40000) return 'HIGH'
  if (category === 'EMERGENCY') return 'HIGH'
  if (amount > 20000) return 'NORMAL'
  return 'LOW'
}

function generateDuplicateCheckHash(data: any): string {
  // Simple hash generation for duplicate detection
  const str = `${data.title}-${data.description}-${data.requestedAmount}`
  return `duplicate_${Date.now()}_${btoa(str).substr(0, 10)}`
}