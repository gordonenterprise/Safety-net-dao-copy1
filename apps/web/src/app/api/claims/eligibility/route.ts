import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user data with membership information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check membership status
    const hasActiveSubscription = user.subscriptions.length > 0
    const membershipStatus = user.membershipStatus

    if (!hasActiveSubscription || membershipStatus !== 'ACTIVE') {
      return NextResponse.json({
        isEligible: false,
        membershipDays: 0,
        requiredDays: 60,
        membershipStatus: membershipStatus,
        message: 'Active membership required to submit claims. Please ensure your subscription is current.'
      })
    }

    // Calculate membership duration
    const joinedAt = user.joinedAt
    const now = new Date()
    const membershipDays = Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24))
    const requiredDays = 60

    // Check 60-day eligibility requirement
    const isEligible = membershipDays >= requiredDays

    let message: string
    if (isEligible) {
      message = `You are eligible to submit claims. You have been a member for ${membershipDays} days.`
    } else {
      const remainingDays = requiredDays - membershipDays
      message = `You need to wait ${remainingDays} more days before becoming eligible to submit claims.`
    }

    return NextResponse.json({
      isEligible,
      membershipDays,
      requiredDays,
      membershipStatus,
      message
    })

  } catch (error) {
    console.error('Error checking claims eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    )
  }
}