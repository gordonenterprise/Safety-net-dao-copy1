import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Type declaration for global users
declare global {
  var users: any[] | undefined
}

// In-memory storage for development (until database is properly connected)
if (!global.users) {
  global.users = []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, occupation, location, emergencyContact } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = global.users?.find((u: any) => u.email === email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      occupation: occupation || null,
      location: location || null,
      emergencyContact: emergencyContact || null,
      role: 'MEMBER',
      membershipStatus: 'PENDING',
      walletAddress: null,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }

    // Store user in global memory
    global.users?.push(newUser)

    console.log('New user created:', { email, name, id: newUser.id, totalUsers: global.users?.length })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      userId: newUser.id
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get all users (for debugging)
export async function GET() {
  return NextResponse.json({
    users: global.users?.map((u: any) => ({ id: u.id, email: u.email, name: u.name })) || [],
    count: global.users?.length || 0
  })
}