import TrustWall from '../components/TrustWall'
import HowItWorks from '../components/HowItWorks'
import CorePrinciples from '../components/CorePrinciples'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center py-20 bg-white rounded-3xl shadow-xl border border-blue-100 mb-16">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block text-sm font-bold uppercase text-teal-500 mb-4 bg-teal-50 px-3 py-1 rounded-full">
              Decentralized Mutual Aid
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-blue-900 leading-tight mb-6">
              🚀 LIVE DEPLOYMENT - When life hits pause, <span className="text-teal-600">SafetyNet</span> pays to keep you moving.
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join our community-governed mutual aid network. $8/month gets you access to emergency claims, governance voting, and member benefits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/membership/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                Join for $8/Month →
              </a>
              <a 
                href="/governance"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-xl font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
              >
                View Governance
              </a>
            </div>
          </div>
        </section>

        {/* Live Treasury and Payouts Ticker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Treasury Widget */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-teal-100">
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
              DAO Treasury Reserve
              <svg className="w-5 h-5 ml-2 text-teal-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
            </h2>
            <div className="text-4xl font-extrabold text-teal-600">$1,245,678</div>
            <p className="text-sm text-gray-500 mt-1">Total Assets Under Management</p>
            
            {/* Reserves Chart Placeholder */}
            <div className="h-40 bg-gray-100 rounded-lg mt-4 flex items-center justify-center text-gray-500 text-sm">
              [Live Treasury Chart - Asset Distribution]
            </div>
          </div>

          {/* Payout Ticker */}
          <div className="bg-blue-700 p-6 md:p-8 rounded-xl shadow-lg text-white flex flex-col justify-between">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              Recent Relief Payouts
            </h2>
            <div className="space-y-2 text-lg h-48 overflow-y-auto pr-2">
              <p>✅ $1,250 paid to **M.S.** in Chicago (Injury)</p>
              <p>✅ $800 paid to **J.L.** in Austin (Device Failure)</p>
              <p>✅ $1,500 paid to **S.A.** in Miami (Car Repair)</p>
              <p>✅ $900 paid to **K.B.** in Seattle (Illness)</p>
              <p>✅ $1,250 paid to **T.R.** in London (Injury)</p>
              <p>✅ $800 paid to **L.F.** in Berlin (Device Failure)</p>
              <p>✅ $1,500 paid to **P.Q.** in Dubai (Car Repair)</p>
            </div>
            <p className="text-sm font-semibold mt-4">
              <span className="text-teal-300">142 members</span> helped this week.
            </p>
          </div>
        </section>

        {/* How It Works (3-Step Diagram) */}
        <HowItWorks />

        {/* Trust Indicators */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-lg p-6 text-center shadow-lg border-t-4 border-blue-600">
            <h3 className="text-lg font-semibold mb-2">Total Treasury</h3>
            <p className="text-3xl font-bold text-blue-600">$1.2M</p>
            <p className="text-sm text-gray-500">USDC + MATIC</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg border-t-4 border-green-600">
            <h3 className="text-lg font-semibold mb-2">Active Members</h3>
            <p className="text-3xl font-bold text-green-600">2,847</p>
            <p className="text-sm text-gray-500">Verified & Contributing</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg border-t-4 border-purple-600">
            <h3 className="text-lg font-semibold mb-2">Claims Paid</h3>
            <p className="text-3xl font-bold text-purple-600">1,593</p>
            <p className="text-sm text-gray-500">Fast Relief Provided</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg border-t-4 border-orange-600">
            <h3 className="text-lg font-semibold mb-2">Avg Payout Time</h3>
            <p className="text-3xl font-bold text-orange-600">2.3</p>
            <p className="text-sm text-gray-500">Days</p>
          </div>
        </section>

        {/* Membership Benefits */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Membership Benefits</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              For just $8/month, unlock access to our comprehensive mutual aid network and governance platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Claims</h3>
              <p className="text-gray-600 mb-4">Submit claims up to $500 for vehicle repairs, medical bills, and work equipment replacement.</p>
              <div className="text-sm text-blue-600 font-medium">Available after 60 days</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-100 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Governance Voting</h3>
              <p className="text-gray-600 mb-4">Vote on claims, treasury decisions, and DAO governance proposals. Your voice matters.</p>
              <div className="text-sm text-teal-600 font-medium">Immediate access</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Governance Tokens</h3>
              <p className="text-gray-600 mb-4">Earn monthly governance tokens for participation, voting, and community contributions.</p>
              <div className="text-sm text-purple-600 font-medium">Monthly distribution</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-50 to-teal-50 px-8 py-4 rounded-full border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">$8/month</div>
              <div className="text-gray-600">•</div>
              <div className="text-gray-700">Cancel anytime</div>
              <div className="text-gray-600">•</div>
              <div className="text-gray-700">60-day claim eligibility</div>
            </div>
          </div>
        </section>

        {/* Explainer Video */}
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">See How Mutual Aid Works</h2>
          <div className="w-full bg-gray-200 rounded-xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center border-4 border-teal-500">
            <span className="text-xl text-gray-500 p-10">
              [Placeholder for Explainer Video / Animation Embed]
            </span>
          </div>
        </section>

        {/* Core Principles */}
        <CorePrinciples />

        {/* Trust Wall - Live Blockchain Transparency */}
        <TrustWall />

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Join Our Mutual Aid Community?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your membership today for just $8/month and gain access to 
            financial support when you need it most.
          </p>
          <a 
            href="/membership/pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Start Your Membership
          </a>
        </section>
      </div>
    </div>
  )
}