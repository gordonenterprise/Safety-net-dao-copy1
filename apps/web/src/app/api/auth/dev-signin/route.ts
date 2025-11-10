import { NextRequest, NextResponse } from 'next/server'

// Development authentication - creates a simple session without database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Simple development credentials
    if (email === 'admin@safetynet.dao' && password === 'admin123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin_1',
          email: 'admin@safetynet.dao',
          name: 'Admin User',
          role: 'ADMIN',
          membershipStatus: 'ACTIVE'
        }
      })
    }

    if (email === 'demo@example.com' && password === 'demo123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'demo_1',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'MEMBER',
          membershipStatus: 'ACTIVE'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Dev signin error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}