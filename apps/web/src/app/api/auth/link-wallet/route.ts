import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Type declaration for global users
declare global {
  var users: any[] | undefined
}

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    try {
      // Try to use Prisma database first
      const { prisma } = await import('@safetynet/db')
      
      // Check if wallet is already linked to another user
      const existingWallet = await prisma.user.findUnique({
        where: { walletAddress }
      })

      if (existingWallet && existingWallet.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Wallet is already linked to another account' },
          { status: 400 }
        )
      }

      // Link wallet to current user
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          walletAddress,
          lastActiveAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          walletAddress: updatedUser.walletAddress,
          name: updatedUser.name,
          email: updatedUser.email,
        }
      })

    } catch (dbError: any) {
      console.log('Database unavailable, using in-memory storage:', dbError?.message || 'Unknown error')
      
      // Fallback to in-memory storage
      if (!global.users) {
        global.users = []
      }

      // Check if wallet is already linked to another user
      const existingWallet = global.users.find((u: any) => u.walletAddress === walletAddress)
      if (existingWallet && existingWallet.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Wallet is already linked to another account' },
          { status: 400 }
        )
      }

      // Find and update user in memory
      const userIndex = global.users.findIndex((u: any) => u.id === session.user.id)
      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      global.users[userIndex] = {
        ...global.users[userIndex],
        walletAddress,
        lastActiveAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        user: {
          id: global.users[userIndex].id,
          walletAddress: global.users[userIndex].walletAddress,
          name: global.users[userIndex].name,
          email: global.users[userIndex].email,
        }
      })
    }

  } catch (error: any) {
    console.error('Link wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}