import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RateLimitConfig } from '@/lib/security/rate-limiter'
import { AuditLogger, AuditAction, AuditLevel, extractRequestMetadata } from '@/lib/security/audit-logger'
import { PrismaClient } from '@safetynet/db'

interface SecurityMiddlewareConfig {
  rateLimiting?: {
    enabled: boolean
    config: RateLimitConfig
  }
  authentication?: {
    required: boolean
    adminOnly?: boolean
  }
  audit?: {
    enabled: boolean
    action?: AuditAction
  }
  cors?: {
    enabled: boolean
    origins?: string[]
  }
}

class SecurityMiddleware {
  private prisma: PrismaClient
  private auditLogger: AuditLogger

  constructor(prisma: PrismaClient, auditLogger: AuditLogger) {
    this.prisma = prisma
    this.auditLogger = auditLogger
  }

  // Main middleware function
  createMiddleware(config: SecurityMiddlewareConfig) {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        // Extract request information
        const ip = this.getClientIP(request)
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const path = request.nextUrl.pathname
        const method = request.method
        
        // CORS handling
        if (config.cors?.enabled) {
          const corsResponse = this.handleCORS(request, config.cors)
          if (corsResponse) return corsResponse
        }

        // Rate limiting
        if (config.rateLimiting?.enabled) {
          const rateLimitResult = await this.handleRateLimit(
            request,
            config.rateLimiting.config,
            ip
          )
          if (rateLimitResult) return rateLimitResult
        }

        // Authentication
        if (config.authentication?.required) {
          const authResult = await this.handleAuthentication(
            request,
            config.authentication.adminOnly || false
          )
          if (authResult.error) return authResult.response
        }

        // Audit logging
        if (config.audit?.enabled) {
          await this.logRequest(request, config.audit.action)
        }

        // Continue to next middleware/handler
        return NextResponse.next()

      } catch (error) {
        console.error('Security middleware error:', error)
        
        // Log security error
        await this.auditLogger.logSecurityEvent(
          AuditAction.UNAUTHORIZED_ACCESS,
          AuditLevel.ERROR,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          extractRequestMetadata(request)
        )

        return new NextResponse('Internal Security Error', { status: 500 })
      }
    }
  }

  // Rate limiting handler
  private async handleRateLimit(
    request: NextRequest,
    config: RateLimitConfig,
    ip: string
  ): Promise<NextResponse | null> {
    const identifier = config.identifier || ip
    const result = await rateLimiter.checkLimit({
      ...config,
      identifier
    })

    if (!result.success) {
      // Log rate limit violation
      await this.auditLogger.logSecurityEvent(
        AuditAction.RATE_LIMIT_EXCEEDED,
        AuditLevel.WARN,
        {
          identifier,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          path: request.nextUrl.pathname
        },
        extractRequestMetadata(request)
      )

      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now() / 1000)).toString()
          }
        }
      )
    }

    return null
  }

  // Authentication handler
  private async handleAuthentication(
    request: NextRequest,
    adminOnly: boolean = false
  ): Promise<{ error: boolean; response?: NextResponse; userId?: string }> {
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('session')?.value

    // Check for authentication token
    let token = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (sessionCookie) {
      token = sessionCookie
    }

    if (!token) {
      return {
        error: true,
        response: new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    try {
      // Verify token and get user
      const user = await this.verifyToken(token)
      if (!user) {
        await this.auditLogger.logSecurityEvent(
          AuditAction.LOGIN_FAILED,
          AuditLevel.WARN,
          { reason: 'Invalid token' },
          extractRequestMetadata(request)
        )

        return {
          error: true,
          response: new NextResponse(
            JSON.stringify({ error: 'Invalid authentication token' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Check admin permission if required
      if (adminOnly && user.role !== 'ADMIN') {
        await this.auditLogger.logSecurityEvent(
          AuditAction.UNAUTHORIZED_ACCESS,
          AuditLevel.WARN,
          { 
            userId: user.id,
            requiredRole: 'ADMIN',
            userRole: user.role,
            path: request.nextUrl.pathname
          },
          extractRequestMetadata(request)
        )

        return {
          error: true,
          response: new NextResponse(
            JSON.stringify({ error: 'Admin access required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Add user info to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-role', user.role)
      
      return { error: false, userId: user.id }

    } catch (error) {
      console.error('Authentication error:', error)
      
      await this.auditLogger.logSecurityEvent(
        AuditAction.LOGIN_FAILED,
        AuditLevel.ERROR,
        { 
          reason: 'Token verification failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        extractRequestMetadata(request)
      )

      return {
        error: true,
        response: new NextResponse(
          JSON.stringify({ error: 'Authentication failed' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }

  // CORS handler
  private handleCORS(
    request: NextRequest,
    corsConfig: { origins?: string[] }
  ): NextResponse | null {
    const origin = request.headers.get('origin')
    const allowedOrigins = corsConfig.origins || ['*']

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const headers = new Headers()
      
      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        headers.set('Access-Control-Allow-Origin', origin || '*')
      }
      
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      headers.set('Access-Control-Max-Age', '86400')

      return new NextResponse(null, { status: 200, headers })
    }

    return null
  }

  // Request logging
  private async logRequest(request: NextRequest, action?: AuditAction): Promise<void> {
    const metadata = extractRequestMetadata(request)
    
    await this.auditLogger.log({
      action: action || AuditAction.ADMIN_ACCESS,
      level: AuditLevel.INFO,
      resource: 'api',
      details: {
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams.entries())
      },
      metadata
    })
  }

  // Helper methods
  private getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    
    return realIP || cfConnectingIP || 'unknown'
  }

  private async verifyToken(token: string): Promise<{ id: string; role: string } | null> {
    try {
      // This would integrate with your authentication system
      // For now, we'll check against the database
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true }
      })

      if (!session || session.expiresAt < new Date()) {
        return null
      }

      return {
        id: session.user.id,
        role: session.user.role
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }
}

// Predefined middleware configurations
export const securityConfigs = {
  // Public API endpoints
  publicAPI: {
    rateLimiting: {
      enabled: true,
      config: rateLimiter.configs.api.default
    },
    cors: {
      enabled: true,
      origins: ['*']
    },
    audit: {
      enabled: true,
      action: AuditAction.ADMIN_ACCESS
    }
  },

  // Authenticated API endpoints
  authenticatedAPI: {
    rateLimiting: {
      enabled: true,
      config: rateLimiter.configs.api.authenticated
    },
    authentication: {
      required: true
    },
    cors: {
      enabled: true
    },
    audit: {
      enabled: true
    }
  },

  // Admin API endpoints
  adminAPI: {
    rateLimiting: {
      enabled: true,
      config: rateLimiter.configs.api.admin
    },
    authentication: {
      required: true,
      adminOnly: true
    },
    cors: {
      enabled: true
    },
    audit: {
      enabled: true,
      action: AuditAction.ADMIN_ACCESS
    }
  },

  // Authentication endpoints
  authEndpoints: {
    rateLimiting: {
      enabled: true,
      config: rateLimiter.configs.auth.login
    },
    cors: {
      enabled: true
    },
    audit: {
      enabled: true,
      action: AuditAction.LOGIN
    }
  },

  // Claims endpoints
  claimsEndpoints: {
    rateLimiting: {
      enabled: true,
      config: rateLimiter.configs.claims.submit
    },
    authentication: {
      required: true
    },
    audit: {
      enabled: true,
      action: AuditAction.CLAIM_CREATE
    }
  }
}

export { SecurityMiddleware }
export type { SecurityMiddlewareConfig }