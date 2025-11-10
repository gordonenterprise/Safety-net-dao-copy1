import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '@safetynet/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { claimId } = params
    const body = await request.json()
    const { status, priority } = body

    // Validate status
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'VOTING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate priority
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    // Get current claim data for audit log
    const currentClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { status: true, priority: true }
    })

    if (!currentClaim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Update claim
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        ...(status && { status }),
        ...(priority && { priority })
      },
      select: {
        id: true,
        title: true,
        description: true,
        requestedAmount: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        claimId: claimId,
        action: 'UPDATE',
        entityType: 'claim',
        entityId: claimId,
        oldValues: currentClaim,
        newValues: { status, priority },
        metadata: {
          adminAction: 'claim_update',
          updatedFields: Object.keys(body)
        }
      }
    })

    // Transform the data to match frontend expectations
    const transformedClaim = {
      id: updatedClaim.id,
      amount: updatedClaim.requestedAmount / 100, // Convert from cents to dollars
      reason: updatedClaim.title,
      status: updatedClaim.status,
      createdAt: updatedClaim.createdAt.toISOString(),
      user: updatedClaim.user
    }

    return NextResponse.json(transformedClaim)
  } catch (error) {
    console.error('Update claim error:', error)
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    )
  }
}