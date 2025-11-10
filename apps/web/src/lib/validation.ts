import { z } from 'zod'

// File upload validation
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png', 
  'image/jpg',
  'image/jpeg'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const fileUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'Must be a file')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 10MB')
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type as any),
      `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`
    )
})

// User validation schemas
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

export const roleChangeSchema = z.object({
  userId: z.string().cuid(),
  newRole: z.enum(['TOUR', 'MEMBER', 'VALIDATOR', 'ADMIN']),
  reason: z.string().min(10).max(500)
})

// Claim validation schemas
export const claimSubmissionSchema = z.object({
  amountCents: z.number().int().min(100).max(150000), // $1 to $1500
  description: z.string().min(50).max(2000),
  category: z.enum(['MEDICAL', 'VEHICLE', 'DEVICE', 'EMERGENCY', 'OTHER']),
  evidenceFiles: z.array(fileUploadSchema).min(1).max(5)
})

export const claimReviewSchema = z.object({
  claimId: z.string().cuid(),
  decision: z.enum(['APPROVE', 'DENY', 'ESCALATE']),
  notes: z.string().min(10).max(1000),
  riskScore: z.number().int().min(0).max(100).optional()
})

// Governance validation schemas
export const proposalSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(100).max(5000),
  type: z.enum(['PARAMETER_CHANGE', 'TREASURY_ALLOCATION', 'PROTOCOL_UPGRADE', 'OTHER']),
  parameters: z.record(z.any()).optional()
})

export const voteSchema = z.object({
  proposalId: z.string().cuid(),
  choice: z.enum(['FOR', 'AGAINST', 'ABSTAIN']),
  reason: z.string().max(500).optional()
})

// Treasury validation schemas
export const treasuryTransferSchema = z.object({
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amountWei: z.string().regex(/^\d+$/, 'Invalid amount'),
  reason: z.string().min(20).max(500),
  category: z.enum(['CLAIM_PAYOUT', 'OPERATIONAL', 'EMERGENCY', 'OTHER'])
})

// Settings validation schemas
export const settingsUpdateSchema = z.object({
  claimTimeout: z.number().int().min(1).max(30).optional(), // days
  maxClaimAmount: z.number().int().min(100).max(500000).optional(), // cents
  minMembershipDays: z.number().int().min(1).max(365).optional(),
  validatorQuorum: z.number().int().min(1).max(100).optional(), // percentage
})

// Audit log validation
export const auditLogSchema = z.object({
  action: z.string().min(1).max(50),
  entity: z.string().min(1).max(50).optional(),
  entityId: z.string().optional(),
  before: z.any().optional(),
  after: z.any().optional(),
  metadata: z.record(z.any()).optional()
})

// Helper function to validate and sanitize request body
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Validation failed: ${messages.join(', ')}`)
    }
    throw error
  }
}

// CSRF token validation
export function validateCSRFToken(token: string | null, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  
  // Simple CSRF validation - in production use proper CSRF libraries
  const expectedToken = Buffer.from(sessionToken).toString('base64').slice(0, 32)
  return token === expectedToken
}

// Input sanitization
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .slice(0, 1000) // Limit length
}