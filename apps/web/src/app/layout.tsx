import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import MobileNavigation from '../components/MobileNavigation'
import CookieConsent from '../components/CookieConsent'
import WalletConnect from '../components/WalletConnect'
import { Providers } from '../components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafetyNet DAO - Decentralized Mutual Aid',
  description: 'A decentralized mutual aid platform where members support each other through fast micro-payouts from a transparent on-chain treasury.',
  keywords: ['mutual aid', 'DAO', 'decentralized', 'blockchain', 'financial assistance', 'community support', 'emergency fund'],
  authors: [{ name: 'SafetyNet DAO' }],
  creator: 'SafetyNet DAO',
  publisher: 'SafetyNet DAO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://safetynetdao.org'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'SafetyNet DAO - Decentralized Mutual Aid',
    description: 'Join thousands of members in a transparent, community-governed mutual aid platform. $8/month membership provides access to fast financial relief when you need it most.',
    url: 'https://safetynetdao.org',
    siteName: 'SafetyNet DAO',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SafetyNet DAO - Transparent mutual aid for everyone',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafetyNet DAO - Decentralized Mutual Aid',
    description: 'Join thousands of members in a transparent, community-governed mutual aid platform. $8/month membership provides access to fast financial relief.',
    images: ['/twitter-image.png'],
    creator: '@SafetyNetDAO',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

function Header() {
  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/pools', label: 'Pools' },
    { href: '/transparency', label: 'Transparency' },
    { href: '/community', label: 'Community' },
    { href: '/help', label: 'FAQ' },
  ]

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-xl font-extrabold text-blue-800">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v16l-7-3-7 3V4a2 2 0 012-2z"></path>
            </svg>
            <span>SafetyNet DAO</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-gray-700 hover:bg-gray-100 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition"
              >
                {link.label}
              </Link>
            ))}
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-lg transition hidden sm:block"
            >
              Dashboard
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <WalletConnect />
            <Link 
              href="/join"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition shadow-md"
            >
              Member Portal
            </Link>
          </div>
          
          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-teal-400">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-teal-200 transition">About Us</Link></li>
              <li><Link href="/pools" className="hover:text-teal-200 transition">Our Pools</Link></li>
              <li><Link href="/transparency" className="hover:text-teal-200 transition">Transparency</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3 text-teal-400">Community</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/community" className="hover:text-teal-200 transition">Hub</Link></li>
              <li><Link href="/news" className="hover:text-teal-200 transition">News & Blog</Link></li>
              <li><a href="#" className="hover:text-teal-200 transition" target="_blank">Discord</a></li>
              <li><Link href="/governance" className="hover:text-teal-200 transition">Governance</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3 text-teal-400">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-teal-200 transition">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-teal-200 transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-200 transition">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-teal-200 transition">Refund Policy</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-lg font-semibold mb-3 text-teal-400">Contact</h4>
            <p className="text-sm">Email: <a href="mailto:support@safetynet.dao" className="hover:text-teal-200">support@safetynet.dao</a></p>
            <p className="text-sm mt-4">&copy; {new Date().getFullYear()} SafetyNet DAO LLC.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SafetyNet DAO',
    description: 'A decentralized mutual aid platform providing fast financial relief through community governance.',
    url: 'https://safetynetdao.org',
    logo: 'https://safetynetdao.org/logo.png',
    sameAs: [
      'https://twitter.com/SafetyNetDAO',
      'https://discord.gg/safetynetdao',
      'https://github.com/safetynetdao'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@safetynetdao.org',
      contactType: 'customer support'
    },
    foundingDate: '2025',
    numberOfEmployees: '10-50',
    industry: 'Financial Technology',
    keywords: 'mutual aid, DAO, decentralized, blockchain, financial assistance',
    offers: {
      '@type': 'Offer',
      name: 'SafetyNet DAO Membership',
      description: 'Monthly membership providing access to community mutual aid',
      price: '8',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Providers>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}