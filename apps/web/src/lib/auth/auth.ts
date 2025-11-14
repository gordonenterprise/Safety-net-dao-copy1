import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@safetynet/db'
import bcrypt from 'bcryptjs'
import { SiweMessage } from 'siwe'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          // Database lookup with case-insensitive email
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email.toLowerCase() 
            },
            select: {
              id: true,
              email: true,
              role: true,
              walletAddress: true,
              password: true,
            },
          })

          if (user?.password) {
            const isValidPassword = await bcrypt.compare(credentials.password, user.password)
            
            if (isValidPassword) {
              return {
                id: user.id,
                email: user.email,
                role: user.role as string,
                walletAddress: user.walletAddress || undefined,
              }
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }

        throw new Error('Invalid credentials')
      },
    }),
    CredentialsProvider({
      id: 'siwe',
      name: 'Sign-In with Ethereum', 
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature) {
          throw new Error('Message and signature required')
        }

        try {
          const siwe = new SiweMessage(JSON.parse(credentials.message))
          const result = await siwe.verify({
            signature: credentials.signature,
          })

          if (!result.success) {
            throw new Error('Invalid signature')
          }

          // Find user by wallet address
          const user = await prisma.user.findUnique({
            where: { walletAddress: siwe.address.toLowerCase() },
            select: {
              id: true,
              email: true,
              role: true,
              walletAddress: true,
            },
          })

          if (!user) {
            throw new Error('Wallet not linked to any account')
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role as string,
            walletAddress: user.walletAddress || undefined,
          }
        } catch (error) {
          console.error('SIWE Auth Error:', error)
          throw new Error('Invalid Web3 authentication')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Set session data on login
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.role = user.role
        token.walletAddress = user.walletAddress
      }
      return token
    },
    async session({ session, token }) {
      // Single source of truth: session contains exactly { userId, email, role, walletAddress? }
      if (token) {
        session.user = {
          userId: token.userId as string,
          email: token.email as string,
          role: token.role as string,
          walletAddress: token.walletAddress as string | undefined,
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

// TypeScript declarations for NextAuth
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: string
    walletAddress?: string
  }

  interface Session {
    user: {
      userId: string
      email: string
      role: string
      walletAddress?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    email: string
    role: string
    walletAddress?: string
  }
}