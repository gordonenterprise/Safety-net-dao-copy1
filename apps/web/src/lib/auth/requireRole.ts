import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function requireRole(minRole: string): Promise<{
  userId: string
  email: string
  role: string
  walletAddress?: string
}> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error("Unauthorized: No active session")
  }

  const hierarchy = {
    TOUR: 0,
    MEMBER: 1,
    VALIDATOR: 2,
    ADMIN: 3,
  }

  const userRole = session.user.role as keyof typeof hierarchy
  const requiredRole = minRole as keyof typeof hierarchy
  
  if (hierarchy[userRole] < hierarchy[requiredRole]) {
    throw new Error(`Forbidden: ${minRole} role required`)
  }

  return session.user
}

// Helper function to check if user has specific role
export function hasRole(userRole: string, requiredRole: string): boolean {
  const hierarchy = {
    TOUR: 0,
    MEMBER: 1,
    VALIDATOR: 2,
    ADMIN: 3,
  }
  
  const userLevel = hierarchy[userRole as keyof typeof hierarchy] || 0
  const requiredLevel = hierarchy[requiredRole as keyof typeof hierarchy] || 0
  
  return userLevel >= requiredLevel
}

// Helper to get current user from session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}