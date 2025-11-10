import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@safetynet/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const body = await request.json()
    const { role, membershipStatus } = body

    // Validate role
    const validRoles = ['MEMBER', 'VALIDATOR', 'ADMIN', 'SUPERADMIN']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate membership status
    const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']
    if (membershipStatus && !validStatuses.includes(membershipStatus)) {
      return NextResponse.json({ error: 'Invalid membership status' }, { status: 400 })
    }

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, membershipStatus: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(membershipStatus && { membershipStatus })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        membershipStatus: true,
        createdAt: true,
        lastActiveAt: true,
        walletAddress: true,
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'user',
        entityId: userId,
        oldValues: currentUser,
        newValues: { role, membershipStatus },
        metadata: {
          adminAction: 'user_update',
          updatedFields: Object.keys(body)
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}