import { Redis } from '@upstash/redis'

// Rate limiter configuration
interface RateLimitConfig {
  identifier: string
  limit: number
  window: number // in seconds
  sliding?: boolean
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

class RateLimiter {
  private redis: Redis | null = null

  constructor() {
    // Initialize Redis if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    }
  }

  async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    // If no Redis, use in-memory fallback (not recommended for production)
    if (!this.redis) {
      return this.inMemoryRateLimit(config)
    }

    const key = `rate_limit:${config.identifier}`
    const now = Math.floor(Date.now() / 1000)
    const window = config.window

    if (config.sliding) {
      return this.slidingWindowRateLimit(key, config, now)
    } else {
      return this.fixedWindowRateLimit(key, config, now)
    }
  }

  private async fixedWindowRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitResult> {
    const windowStart = Math.floor(now / config.window) * config.window
    const windowKey = `${key}:${windowStart}`

    const pipeline = this.redis!.pipeline()
    pipeline.incr(windowKey)
    pipeline.expire(windowKey, config.window)
    
    const results = await pipeline.exec()
    const count = results[0] as number

    const remaining = Math.max(0, config.limit - count)
    const reset = windowStart + config.window

    return {
      success: count <= config.limit,
      remaining,
      reset,
      limit: config.limit
    }
  }

  private async slidingWindowRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitResult> {
    const windowStart = now - config.window
    
    // Remove old entries
    await this.redis!.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests
    const currentCount = await this.redis!.zcard(key)
    
    if (currentCount >= config.limit) {
      const reset = await this.redis!.zrange(key, 0, 0, { withScores: true })
      const oldestScore = reset.length > 0 ? reset[1] as number : now
      
      return {
        success: false,
        remaining: 0,
        reset: Math.ceil(oldestScore + config.window),
        limit: config.limit
      }
    }

    // Add current request
    const requestId = `${now}-${Math.random()}`
    await this.redis!.zadd(key, { score: now, member: requestId })
    await this.redis!.expire(key, config.window)

    return {
      success: true,
      remaining: config.limit - currentCount - 1,
      reset: now + config.window,
      limit: config.limit
    }
  }

  // Fallback in-memory rate limiter (not recommended for production)
  private inMemoryStore = new Map<string, { count: number; reset: number }>()

  private inMemoryRateLimit(config: RateLimitConfig): RateLimitResult {
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / config.window) * config.window
    const key = `${config.identifier}:${windowStart}`

    const current = this.inMemoryStore.get(key) || { count: 0, reset: windowStart + config.window }
    
    // Clean up old entries
    for (const [k, v] of this.inMemoryStore.entries()) {
      if (v.reset < now) {
        this.inMemoryStore.delete(k)
      }
    }

    current.count++
    this.inMemoryStore.set(key, current)

    return {
      success: current.count <= config.limit,
      remaining: Math.max(0, config.limit - current.count),
      reset: current.reset,
      limit: config.limit
    }
  }

  // Predefined rate limit configurations
  static configs = {
    // API rate limits
    api: {
      default: { limit: 100, window: 60 }, // 100 requests per minute
      authenticated: { limit: 1000, window: 60 }, // 1000 requests per minute for authenticated users
      admin: { limit: 5000, window: 60 }, // 5000 requests per minute for admins
    },
    
    // Authentication rate limits
    auth: {
      login: { limit: 5, window: 300 }, // 5 login attempts per 5 minutes
      signup: { limit: 3, window: 3600 }, // 3 signups per hour
      passwordReset: { limit: 3, window: 3600 }, // 3 password resets per hour
    },
    
    // Feature-specific rate limits
    claims: {
      submit: { limit: 5, window: 86400 }, // 5 claims per day
      vote: { limit: 100, window: 86400 }, // 100 votes per day
    },
    
    governance: {
      propose: { limit: 1, window: 86400 }, // 1 proposal per day
      vote: { limit: 50, window: 3600 }, // 50 votes per hour
    },
    
    nft: {
      mint: { limit: 10, window: 3600 }, // 10 mints per hour
      transfer: { limit: 20, window: 3600 }, // 20 transfers per hour
    }
  }
}

export const rateLimiter = new RateLimiter()
export type { RateLimitConfig, RateLimitResult }