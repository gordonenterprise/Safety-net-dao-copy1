'use client'

import { useState } from 'react'
import Link from 'next/link'
import WalletConnect from './WalletConnect'

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/pools', label: 'Pools' },
    { href: '/transparency', label: 'Transparency' },
    { href: '/community', label: 'Community' },
    { href: '/help', label: 'FAQ' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button 
          onClick={toggleMenu}
          className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
          aria-label="Toggle mobile menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={closeMenu}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
          
          {/* Mobile Menu Drawer */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v16l-7-3-7 3V4a2 2 0 012-2z"></path>
                  </svg>
                  <span className="text-lg font-bold text-blue-800">SafetyNet DAO</span>
                </div>
                <button 
                  onClick={closeMenu}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block text-gray-700 hover:bg-gray-100 hover:text-blue-600 font-medium px-4 py-3 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Bottom CTA Section */}
              <div className="p-4 border-t bg-gray-50 space-y-3">
                <div className="w-full">
                  <WalletConnect />
                </div>
                <Link
                  href="/join"
                  onClick={closeMenu}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-3 rounded-xl font-semibold transition shadow-md"
                >
                  Member Portal
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Join 2,847 members supporting each other
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}