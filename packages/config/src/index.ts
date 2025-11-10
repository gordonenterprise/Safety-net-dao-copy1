import { z } from 'zod'

export const env = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  POLYGON_RPC_URL: z.string().url(),
  TREASURY_WALLET_PRIVATE_KEY: z.string(),
  EMAIL_FROM: z.string().email(),
  RESEND_API_KEY: z.string(),
}).parse(process.env)

export const config = {
  app: {
    name: 'SafetyNet DAO',
    description: 'Decentralized mutual aid platform',
    url: env.NEXTAUTH_URL,
  },
  membership: {
    monthlyFee: 8, // USD
    maxClaimAmount: 500, // USD
    claimCooldownDays: 90,
  },
  treasury: {
    polygonChainId: 137,
    usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    treasuryAddress: '0x...', // TODO: Deploy treasury contract
  },
} as const

export type Config = typeof config