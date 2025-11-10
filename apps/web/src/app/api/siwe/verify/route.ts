import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@safetynet/db'
import { z } from 'zod'

// Validation schema
const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Get stored nonce from cookie
    const storedNonce = request.cookies.get('siwe-nonce')?.value
    
    if (!storedNonce) {
      return NextResponse.json(
        { error: 'No nonce found. Please request a new nonce.' },
        { status: 400 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = verifySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { message, signature } = validation.data

    // Verify the SIWE message
    const siweMessage = new SiweMessage(message)
    
    // Verify nonce matches
    if (siweMessage.nonce !== storedNonce) {
      return NextResponse.json(
        { error: 'Invalid nonce' },
        { status: 401 }
      )
    }

    const result = await siweMessage.verify({ signature })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const walletAddress = siweMessage.address.toLowerCase()

    // Get current session - user must be logged in to link wallet
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Must be logged in to link wallet' },
        { status: 401 }
      )
    }

    // Check if wallet is already linked to another user
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true, email: true }
    })

    if (existingWallet && existingWallet.id !== session.user.userId) {
      return NextResponse.json(
        { error: 'Wallet already linked to another account' },
        { status: 409 }
      )
    }

    // Link wallet to current user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.userId },
      data: { walletAddress },
      select: {
        id: true,
        email: true,
        role: true,
        walletAddress: true,
      }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.userId,
        action: 'UPDATE',
        entityType: 'user',
        entityId: session.user.userId,
        newValues: { walletAddress },
      }
    })

    // Clear the nonce cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        walletAddress: updatedUser.walletAddress,
      }
    })

    response.cookies.delete('siwe-nonce')
    
    return response

  } catch (error) {
    console.error('SIWE verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}