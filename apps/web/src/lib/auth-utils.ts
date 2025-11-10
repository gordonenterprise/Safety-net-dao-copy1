import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Server-side utility to require admin access
 * Throws error if user is not authenticated or not an admin
 */
export async function requireAdmin() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  
  // Check if user has admin role
  // This would be determined by your user role system
  const userRole = (session.user as any)?.role || 'USER'
  
  if (userRole !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  
  return session
}

/**
 * Server-side utility to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Server-side utility to check if user has specific role
 */
export async function requireRole(role: 'USER' | 'ADMIN' | 'VALIDATOR') {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  
  const userRole = (session.user as any)?.role || 'USER'
  
  if (userRole !== role) {
    throw new Error(`${role} access required`)
  }
  
  return session
}

/**
 * Client-side utility to get current user session
 */
export function useRequireAuth() {
  // This would be used on client side with session provider
  // Implementation depends on your auth setup
  return null
}