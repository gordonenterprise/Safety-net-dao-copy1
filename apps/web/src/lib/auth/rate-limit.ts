import { NextRequest } from 'next/server'

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export const RATE_LIMITS = {
  AUTH: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  AUTH_DAILY: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 100 }, // 100 per day
  CLAIM_SUBMIT: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 per minute
  CLAIM_DAILY: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 30 }, // 30 per day
  VALIDATOR_ACTIONS: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  ADMIN_ACTIONS: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
}

function getClientId(request: NextRequest): string {
  // Use IP address as client identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return ip
}

function getUserId(request: NextRequest): string | null {
  // Extract user ID from session/token if available
  // This would need to be implemented based on your auth setup
  return null // Placeholder
}

export function rateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  identifier?: string
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now()
  const clientId = identifier || getClientId(request)
  const key = `${clientId}:${config.windowMs}:${config.maxRequests}`
  
  // Clean up expired entries
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  entry.count++
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

// Multi-level rate limiting (per-IP AND per-user)
export function multiLevelRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { success: boolean; reason?: string } {
  // Check IP-based rate limit
  const ipLimit = rateLimit(request, config)
  if (!ipLimit.success) {
    return { success: false, reason: 'IP rate limit exceeded' }
  }
  
  // Check user-based rate limit if user ID is available
  if (userId) {
    const userLimit = rateLimit(request, config, `user:${userId}`)
    if (!userLimit.success) {
      return { success: false, reason: 'User rate limit exceeded' }
    }
  }
  
  return { success: true }
}