export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Community Hub</h1>
      <p className="text-xl text-gray-600 mb-10">Where members connect, discuss governance, and stay informed.</p>
      
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Governance & Voting */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
            Governance Portal
            <span className="text-sm ml-3 text-teal-600 font-medium">via Tally / Snapshot</span>
          </h2>
          <div className="h-96 bg-gray-100 rounded-lg p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                <h4 className="font-semibold text-blue-900">Proposal #12: Adjust Payout Ceiling</h4>
                <p className="text-sm text-gray-600 mb-2">Increase maximum claim amount from $1,500 to $2,000</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">67% Yes (Active)</span>
                  <span className="text-xs text-gray-500">Ends 12/30/25</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm">
                <h4 className="font-semibold text-blue-900">Proposal #11: Treasury Diversification</h4>
                <p className="text-sm text-gray-600 mb-2">Add ETH and BTC to treasury holdings (5% allocation)</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600 font-medium">34% Yes (Active)</span>
                  <span className="text-xs text-gray-500">Ends 01/15/26</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center bg-white p-2 rounded-lg">
              **Must connect wallet to vote** - Integration with Tally/Snapshot coming soon
            </p>
          </div>
          <button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg w-full transition">
            Connect Wallet to Vote
          </button>
        </div>
        
        {/* Discord Widget */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Live Discussion</h2>
          <div className="h-96 bg-gray-100 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-blue-800">@validator_mike</div>
                <p className="text-gray-600">Just reviewed 3 claims today. Community verification process is working great! 👍</p>
                <span className="text-xs text-gray-500">2 minutes ago</span>
              </div>
              
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-green-600">@member_sarah</div>
                <p className="text-gray-600">Thanks to everyone who voted on my claim. Payout received in 36 hours! 🙏</p>
                <span className="text-xs text-gray-500">15 minutes ago</span>
              </div>
              
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-purple-600">@dao_admin</div>
                <p className="text-gray-600">Monthly treasury report is now live. Check transparency page for details.</p>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
            </div>
            
            <div className="mt-4 text-center bg-white p-2 rounded-lg">
              <p className="text-sm font-medium text-blue-800">2,145 Members Online</p>
              <p className="text-xs text-gray-500">Join the conversation on Claims Review and Pool Strategy</p>
            </div>
          </div>
          <a href="#" target="_blank" className="mt-4 block text-center text-blue-600 hover:underline font-semibold">
            Get Discord Invite Link →
          </a>
        </div>
      </div>
      
      {/* Announcements & Docs */}
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-600">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Official Documentation</h3>
          <div className="space-y-3">
            <a href="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m-3-10l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Whitepaper & Constitution
            </a>
            <a href="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Claims Process Guide
            </a>
            <a href="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Technical Documentation
            </a>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-teal-600">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Latest News</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <a href="/news" className="text-blue-600 hover:underline">New Integration: Stripe Checkout (10/24)</a>
              <p className="text-xs text-gray-500">Seamless fiat payments now available</p>
            </li>
            <li>
              <a href="/news" className="text-blue-600 hover:underline">Q4 Treasury Report: Reserves up 12% (10/01)</a>
              <p className="text-xs text-gray-500">Strong financial health continues</p>
            </li>
            <li>
              <a href="/news" className="text-blue-600 hover:underline">Validator Election Results Announced (09/15)</a>
              <p className="text-xs text-gray-500">New community validators selected</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center bg-gradient-to-r from-blue-50 to-teal-50 p-8 rounded-xl">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Join Our Community</h2>
        <p className="text-lg text-gray-600 mb-6">
          Connect with thousands of members building the future of mutual aid together.
        </p>
        <div className="space-x-4">
          <a 
            href="/join"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
          >
            Become a Member
          </a>
          <a 
            href="#"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  )
}