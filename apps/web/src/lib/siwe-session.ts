import { getIronSession } from 'iron-session'
import { NextRequest, NextResponse } from 'next/server'

export interface SiweSession {
  nonce?: string
  address?: string
  chainId?: number
  isLoggedIn?: boolean
}

const sessionOptions = {
  password: process.env.SIWE_SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'siwe-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
}

export function getSession(req: NextRequest, res: NextResponse) {
  return getIronSession<SiweSession>(req, res, sessionOptions)
}

export async function withSession(
  handler: (req: NextRequest, res: NextResponse, session: SiweSession) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const res = new NextResponse()
    const session = await getSession(req, res)
    return handler(req, res, session)
  }
}