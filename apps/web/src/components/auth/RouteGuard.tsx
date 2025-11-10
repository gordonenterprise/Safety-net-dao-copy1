'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { hasRole } from '@/lib/auth/requireRole'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: string
  fallbackPath?: string
  showLoading?: boolean
}

export default function RouteGuard({ 
  children, 
  requiredRole = 'MEMBER',
  fallbackPath = '/auth/signin',
  showLoading = true
}: RouteGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      // Not authenticated, redirect to sign in
      router.push(`${fallbackPath}?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (requiredRole && !hasRole(session.user.role, requiredRole)) {
      // Insufficient permissions, redirect to dashboard
      router.push('/dashboard')
      return
    }
  }, [session, status, requiredRole, router, fallbackPath])

  // Show loading state
  if (status === 'loading' && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Insufficient role
  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-600 mb-4">
              You need <span className="font-medium">{requiredRole}</span> role or higher to access this page.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // All checks passed, render children
  return <>{children}</>
}