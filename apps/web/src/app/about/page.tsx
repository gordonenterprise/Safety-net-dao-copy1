import HowItWorks from '../../components/HowItWorks'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-8 border-b pb-2">Our Story & Vision</h1>
      
      <p className="text-lg text-gray-700 mb-8">
        SafetyNet DAO was founded on the belief that collective resilience is the best defense against individual economic shocks. Traditional insurance is slow, expensive, and often denies claims. We leverage decentralized technology and community governance to provide fast, fair, and transparent financial relief when it's needed most. Our mission is to build the financial safety net of the future for the global workforce.
      </p>

      {/* How It Works (3-Step Diagram) */}
      <HowItWorks />

      {/* About-specific Core Principles (no background wrapper since it's detail page) */}
      <h2 className="text-3xl font-bold text-blue-800 mt-16 mb-6">Our Core Principles</h2>
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <svg className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.007 12.007 0 002.944 12c.045 4.347 1.487 7.65 3.96 9.074.896.505 1.954.743 3.096.743.084 0 .167 0 .25-.002.083.002.166.002.25.002 1.142 0 2.199-.238 3.096-.743 2.473-1.424 3.915-4.727 3.96-9.074.052-4.489-1.558-8.232-4.016-10.016z"></path>
          </svg>
          <p className="text-gray-700"><strong className="text-blue-900">Transparency:</strong> All funds, claims, and votes are verifiable on the public ledger.</p>
        </div>
        <div className="flex items-start space-x-4">
          <svg className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4v10m0-2a2 2 0 100 4m-8-2h14"></path>
          </svg>
          <p className="text-gray-700"><strong className="text-blue-900">Fairness:</strong> Claims are decided by decentralized consensus, eliminating single-party bias.</p>
        </div>
        <div className="flex items-start space-x-4">
          <svg className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <p className="text-gray-700"><strong className="text-blue-900">Speed:</strong> Automated smart contract execution allows for payouts in hours, not weeks.</p>
        </div>
      </div>
      
      <div className="mt-10 pt-6 border-t border-gray-200">
        <a href="#" className="text-blue-600 hover:underline font-semibold flex items-center">
          Read the Whitepaper & Constitution
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </a>
      </div>
    </div>
  )
}