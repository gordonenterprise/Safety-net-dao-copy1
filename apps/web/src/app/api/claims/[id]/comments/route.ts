import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import prisma from '../../../../../lib/prisma'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(2000)
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: {
          where: {
            status: {
              in: ['ACTIVE', 'PAST_DUE']
            }
          }
        }
      }
    })

    if (!user || !user.subscription || user.subscription.length === 0) {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }

    // Validate request body
    const body = await request.json()
    const { content } = commentSchema.parse(body)

    // Check if claim exists
    const claim = await prisma.claim.findUnique({
      where: { id: params.id }
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check if user can comment on this claim
    const canComment = claim.status !== 'DRAFT' || claim.userId === session.user.id
    
    if (!canComment) {
      return NextResponse.json({ error: 'Cannot comment on this claim' }, { status: 403 })
    }

    // Create the comment
    const comment = await prisma.claimComment.create({
      data: {
        claimId: params.id,
        userId: session.user.id,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ comment })

  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid comment data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: {
          where: {
            status: {
              in: ['ACTIVE', 'PAST_DUE']
            }
          }
        }
      }
    })

    if (!user || !user.subscription || user.subscription.length === 0) {
      return NextResponse.json({ error: 'Active membership required' }, { status: 403 })
    }

    // Check if claim exists
    const claim = await prisma.claim.findUnique({
      where: { id: params.id }
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check if user can view comments on this claim
    const canView = claim.status !== 'DRAFT' || claim.userId === session.user.id
    
    if (!canView) {
      return NextResponse.json({ error: 'Cannot view comments on this claim' }, { status: 403 })
    }

    // Get comments
    const comments = await prisma.claimComment.findMany({
      where: { claimId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}