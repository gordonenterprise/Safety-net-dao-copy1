'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (avoid logging sensitive data)
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              500 - Something went wrong
            </h1>
            
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred. Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <p className="text-xs text-red-800 font-mono break-words">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => reset()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </Link>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Error ID: {error.digest ? error.digest.slice(0, 8) : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Contact{' '}
                <a href="mailto:support@safetynet.dao" className="text-blue-600 hover:text-blue-500">
                  support@safetynet.dao
                </a>
                {' '}if this persists
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}