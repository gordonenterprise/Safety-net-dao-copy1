import { z } from 'zod'

const envSchema = z.object({
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, "STRIPE_PUBLISHABLE_KEY is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  
  // Blockchain
  SAFE_ADDRESS: z.string().min(1, "SAFE_ADDRESS is required"),
  CHAIN_ID: z.string().min(1, "CHAIN_ID is required"),
  
  // WalletConnect
  WALLETCONNECT_PROJECT_ID: z.string().min(1, "WALLETCONNECT_PROJECT_ID is required"),
  
  // Feature Flags (optional, defaults to true)
  CLAIMS_ENABLED: z.string().optional().default("true"),
  GOVERNANCE_ENABLED: z.string().optional().default("true"),
  MEMBERSHIP_ENABLED: z.string().optional().default("true"),
  WALLET_ENABLED: z.string().optional().default("true"),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      
      throw new Error(`
❌ Environment Validation Failed!

Missing or invalid environment variables:
${missingVars}

Please check your .env file and ensure all required variables are set.
See .env.example for reference.
      `)
    }
    throw error
  }
}

// Helper function to get feature flags
export function getFeatureFlags() {
  return {
    CLAIMS_ENABLED: process.env.CLAIMS_ENABLED !== 'false',
    GOVERNANCE_ENABLED: process.env.GOVERNANCE_ENABLED !== 'false', 
    MEMBERSHIP_ENABLED: process.env.MEMBERSHIP_ENABLED !== 'false',
    WALLET_ENABLED: process.env.WALLET_ENABLED !== 'false',
  }
}

// Validate environment on app start
if (typeof window === 'undefined') {
  try {
    validateEnv()
    console.log('✅ Environment validation passed')
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}