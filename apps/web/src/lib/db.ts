import { PrismaClient } from '@safetynet/db'

// Global for Prisma Client to avoid multiple instances in development
declare global {
  var __prisma: PrismaClient | undefined
}

// Singleton pattern for Prisma client
export const db = globalThis.__prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = db
}

export default db