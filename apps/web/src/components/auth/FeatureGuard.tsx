'use client'

import { getFeatureFlags } from '@/lib/env'
import { useEffect, useState } from 'react'

interface FeatureGuardProps {
  children: React.ReactNode
  feature: 'CLAIMS_ENABLED' | 'GOVERNANCE_ENABLED' | 'MEMBERSHIP_ENABLED' | 'WALLET_ENABLED'
  fallback?: React.ReactNode
}

export default function FeatureGuard({ children, feature, fallback }: FeatureGuardProps) {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check feature flags on client side
    const checkFeature = async () => {
      try {
        const flags = getFeatureFlags()
        setIsEnabled(flags[feature])
      } catch (error) {
        console.error('Failed to check feature flags:', error)
        setIsEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkFeature()
  }, [feature])

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!isEnabled) {
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Feature Temporarily Disabled
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {feature.replace('_ENABLED', '').toLowerCase()} functionality is currently unavailable.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}