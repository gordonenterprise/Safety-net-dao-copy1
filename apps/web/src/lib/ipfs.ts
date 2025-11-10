import { PinataSDK } from "pinata-web3"

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "",
  pinataGateway: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
})

export interface UploadResult {
  cid: string
  size: number
  name: string
  url: string
}

export interface EvidenceMetadata {
  claimId?: string
  userId: string
  filename: string
  filesize: number
  contentType: string
  uploadedAt: string
  description?: string
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadToIPFS(
  file: File | Buffer,
  metadata: EvidenceMetadata
): Promise<UploadResult> {
  try {
    const upload = await pinata.upload.file(file).addMetadata({
      name: metadata.filename,
      keyValues: {
        userId: metadata.userId,
        claimId: metadata.claimId || 'pending',
        contentType: metadata.contentType,
        uploadedAt: metadata.uploadedAt,
        description: metadata.description || '',
      }
    })

    return {
      cid: upload.cid,
      size: metadata.filesize,
      name: metadata.filename,
      url: `${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`
    }
  } catch (error) {
    console.error('IPFS upload failed:', error)
    throw new Error('Failed to upload evidence to IPFS')
  }
}

/**
 * Upload multiple files as a bundle
 */
export async function uploadEvidenceBundle(
  files: Array<{ file: File | Buffer; metadata: EvidenceMetadata }>
): Promise<UploadResult[]> {
  try {
    const uploads = await Promise.all(
      files.map(({ file, metadata }) => uploadToIPFS(file, metadata))
    )
    return uploads
  } catch (error) {
    console.error('Bundle upload failed:', error)
    throw new Error('Failed to upload evidence bundle')
  }
}

/**
 * Create a claim manifest with all evidence
 */
export async function createClaimManifest(
  claimData: {
    title: string
    description: string
    category: string
    requestedAmount: number
    userId: string
    evidenceNotes?: string
  },
  evidenceUploads: UploadResult[]
): Promise<UploadResult> {
  const manifest = {
    version: '1.0',
    type: 'safety_net_claim',
    createdAt: new Date().toISOString(),
    claim: claimData,
    evidence: evidenceUploads.map(upload => ({
      cid: upload.cid,
      filename: upload.name,
      size: upload.size,
      url: upload.url
    })),
    checksum: generateManifestChecksum(claimData, evidenceUploads)
  }

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2))
  
  return uploadToIPFS(manifestBuffer, {
    userId: claimData.userId,
    filename: `claim-manifest-${Date.now()}.json`,
    filesize: manifestBuffer.length,
    contentType: 'application/json',
    uploadedAt: new Date().toISOString(),
    description: 'Claim submission manifest'
  })
}

/**
 * Retrieve file from IPFS
 */
export async function retrieveFromIPFS(cid: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(`${process.env.PINATA_GATEWAY}/ipfs/${cid}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    return await response.arrayBuffer()
  } catch (error) {
    console.error('IPFS retrieval failed:', error)
    throw new Error('Failed to retrieve file from IPFS')
  }
}

/**
 * Check if CID exists (for duplicate detection)
 */
export async function checkCIDExists(cid: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.PINATA_GATEWAY}/ipfs/${cid}`, {
      method: 'HEAD'
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get file metadata from Pinata
 */
export async function getFileMetadata(cid: string) {
  try {
    const files = await pinata.files.list().cid(cid)
    return files.files[0] || null
  } catch (error) {
    console.error('Failed to get metadata:', error)
    return null
  }
}

/**
 * Generate checksum for manifest integrity
 */
function generateManifestChecksum(
  claimData: any,
  evidenceUploads: UploadResult[]
): string {
  const content = JSON.stringify({
    claim: claimData,
    evidence: evidenceUploads.map(u => u.cid).sort()
  })
  
  // Simple hash - in production, use crypto.createHash
  return Buffer.from(content).toString('base64')
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported' }
  }

  return { valid: true }
}

/**
 * Calculate duplicate content hash for basic duplicate detection
 */
export async function calculateContentHash(file: File | Buffer): Promise<string> {
  const buffer = file instanceof File ? 
    Buffer.from(await file.arrayBuffer()) : 
    file

  // Simple content hash - in production, use crypto
  return buffer.toString('base64').slice(0, 32)
}