import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export * from '@prisma/client'

// Helper functions for common operations
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

export async function getUserByWallet(walletAddress: string) {
  return prisma.user.findUnique({
    where: { walletAddress },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

export async function getActiveClaims() {
  return prisma.claim.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'UNDER_REVIEW', 'VOTING'],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTreasuryMetrics() {
  const latest = await prisma.treasurySnapshot.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  const totalMembers = await prisma.user.count({
    where: { membershipStatus: 'ACTIVE' },
  })

  const totalClaims = await prisma.claim.count()
  const approvedClaims = await prisma.claim.count({
    where: { status: 'APPROVED' },
  })

  const totalPayouts = await prisma.payout.aggregate({
    _sum: { amount: true },
    where: { status: 'COMPLETED' },
  })

  return {
    snapshot: latest,
    totalMembers,
    totalClaims,
    approvedClaims,
    totalPayouts: totalPayouts._sum.amount || 0,
  }
}