import { NextRequest, NextResponse } from 'next/server'
import { generateNonce } from 'siwe'

export async function GET(request: NextRequest) {
  try {
    const nonce = generateNonce()
    
    // Create response with nonce
    const response = NextResponse.json({ nonce })
    
    // Set nonce in httpOnly cookie for security verification
    response.cookies.set('siwe-nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5, // 5 minutes
    })
    
    // Security headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error generating nonce:', error)
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}