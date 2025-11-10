import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit, RATE_LIMITS, multiLevelRateLimit } from './lib/rate-limit'

// Protected routes and their required roles
const PROTECTED_ROUTES = {
  '/admin': 'ADMIN',
  '/validator': 'VALIDATOR', 
  '/dashboard': 'MEMBER', // Minimum role needed
} as const

// Auth routes that need rate limiting
const AUTH_ROUTES = [
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/siwe/nonce',
  '/api/siwe/verify'
]

// API routes that need role protection  
const PROTECTED_API_ROUTES = {
  '/api/admin': 'ADMIN',
  '/api/validator': 'VALIDATOR',
  '/api/claims/submit': 'MEMBER',
  '/api/governance': 'MEMBER',
  '/api/treasury': 'ADMIN'
} as const

// Sensitive API routes that need extra rate limiting
const SENSITIVE_ROUTES = [
  '/api/claims',
  '/api/governance',
  '/api/treasury',
  '/api/admin'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  // 1. Add security headers first
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Enhanced CSP for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:; " +
      "media-src 'self' https:; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none';"
    )
  }

  // 2. Rate limiting for auth routes
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.AUTH)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }
  }

  // 3. Enhanced rate limiting for sensitive API routes
  if (SENSITIVE_ROUTES.some(route => pathname.startsWith(route))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    const userId = token?.userId as string
    const rateLimitResult = multiLevelRateLimit(
      request, 
      pathname.includes('/claims') ? RATE_LIMITS.CLAIM_SUBMIT : RATE_LIMITS.VALIDATOR_ACTIONS,
      userId
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded: ${rateLimitResult.reason}`,
          retryAfter: 60
        },
        { status: 429 }
      )
    }
  }

  // 4. Feature flags - block disabled features immediately
  const featureFlags = {
    CLAIMS_ENABLED: process.env.CLAIMS_ENABLED !== 'false',
    GOVERNANCE_ENABLED: process.env.GOVERNANCE_ENABLED !== 'false',
    MEMBERSHIP_ENABLED: process.env.MEMBERSHIP_ENABLED !== 'false',
    WALLET_ENABLED: process.env.WALLET_ENABLED !== 'false',
  }

  if (pathname.startsWith('/claims') && !featureFlags.CLAIMS_ENABLED) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Claims feature is currently disabled' },
        { status: 503 }
      )
    } else {
      return NextResponse.redirect(new URL('/dashboard?message=claims-disabled', request.url))
    }
  }

  if (pathname.startsWith('/governance') && !featureFlags.GOVERNANCE_ENABLED) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Governance feature is currently disabled' },
        { status: 503 }
      )
    } else {
      return NextResponse.redirect(new URL('/dashboard?message=governance-disabled', request.url))
    }
  }

  if (pathname.startsWith('/membership') && !featureFlags.MEMBERSHIP_ENABLED) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Membership feature is currently disabled' },
        { status: 503 }
      )
    } else {
      return NextResponse.redirect(new URL('/dashboard?message=membership-disabled', request.url))
    }
  }

  // 5. Authentication and authorization checks
  const protectedRoute = Object.entries(PROTECTED_ROUTES).find(([route]) => 
    pathname.startsWith(route)
  )
  
  const protectedApiRoute = Object.entries(PROTECTED_API_ROUTES).find(([route]) => 
    pathname.startsWith(route)
  )

  if (protectedRoute || protectedApiRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    // Check if user is authenticated
    if (!token?.userId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer realm="API"'
            }
          }
        )
      } else {
        // Redirect to sign in for page routes
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check role requirements
    const requiredRole = protectedRoute?.[1] || protectedApiRoute?.[1]
    const userRole = token.role as string

    const roleHierarchy = {
      'TOUR': 0,
      'MEMBER': 1,
      'VALIDATOR': 2,
      'ADMIN': 3
    }

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
    const hasRequiredRole = userLevel >= requiredLevel

    if (!hasRequiredRole) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            required: requiredRole,
            current: userRole
          },
          { status: 403 }
        )
      } else {
        // Redirect to dashboard with error message
        const dashboardUrl = new URL('/dashboard', request.url)
        dashboardUrl.searchParams.set('error', 'insufficient-permissions')
        if (requiredRole) {
          dashboardUrl.searchParams.set('required', requiredRole)
        }
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // Add user context to response headers for debugging (non-sensitive data only)
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-User-Role', userRole)
      if (requiredRole) {
        response.headers.set('X-Required-Role', requiredRole)
      }
    }
  }

  // 6. CSRF protection for state-changing requests
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Verify origin matches host for same-origin requests
    if (origin && host) {
      const originUrl = new URL(origin)
      if (originUrl.host !== host) {
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        )
      }
    }
  }

  // 7. Additional security for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Log admin access attempts
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (token?.userId) {
      console.log(`Admin access: ${token.userId} -> ${pathname}`)
    }
    
    // Add additional admin headers
    response.headers.set('X-Admin-Access', 'true')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (NextAuth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}