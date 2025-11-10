'use client'

import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'

export function useSiweAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get nonce from server
      const nonceRes = await fetch('/api/siwe/nonce')
      const { nonce } = await nonceRes.json()

      if (!nonce) {
        throw new Error('Failed to get nonce')
      }

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to SafetyNet DAO',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      })

      const messageString = message.prepareMessage()

      // Sign the message
      const signature = await signMessageAsync({
        message: messageString,
      })

      // Verify signature with server
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          signature,
        }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Verification failed')
      }

      return verifyData.user
    } catch (err: any) {
      console.error('SIWE sign-in error:', err)
      setError(err.message || 'Sign-in failed')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId, signMessageAsync])

  const linkWalletToAccount = useCallback(async (userId: string) => {
    if (!address) {
      setError('Wallet not connected')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          walletAddress: address,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to link wallet')
      }

      return true
    } catch (err: any) {
      console.error('Wallet linking error:', err)
      setError(err.message || 'Failed to link wallet')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [address])

  return {
    signIn,
    linkWalletToAccount,
    isLoading,
    error,
  }
}