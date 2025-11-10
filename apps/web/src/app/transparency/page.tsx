export default function TransparencyPage() {
  const chartPlaceholder = (title: string, value: string, colorClass: string) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 ${colorClass}`}>
      <h3 className="text-xl font-semibold text-gray-600 mb-3">{title}</h3>
      <div className="text-4xl font-extrabold text-blue-800 mb-4">{value}</div>
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
        [Live Chart Visualization]
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Live Transparency Dashboard</h1>
      <p className="text-xl text-gray-600 mb-10">Verifiable, immutable metrics on the DAO's financial health and claims processing.</p>
      
      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {chartPlaceholder('Total Reserves', '$1.87M', 'border-blue-600')}
        {chartPlaceholder('Claims Paid YTD', '1,421', 'border-teal-600')}
        {chartPlaceholder('Active Members', '2,987', 'border-purple-600')}
      </div>

      {/* Treasury Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Treasury Widget */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-teal-100">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
            DAO Treasury Reserve
            <svg className="w-5 h-5 ml-2 text-teal-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
            </svg>
          </h2>
          <div className="text-4xl font-extrabold text-teal-600">$1,874,210.55</div>
          <p className="text-sm text-gray-500 mt-1">Total Assets Under Management</p>
          
          {/* Reserves Chart Placeholder */}
          <div className="h-40 bg-gray-100 rounded-lg mt-4 flex items-center justify-center text-gray-500 text-sm">
            [Live Asset Distribution Chart]
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3 text-sm h-48 overflow-y-auto">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium">Member Contribution</div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
              <div className="text-green-600 font-semibold">+$8.00</div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium">Claim Payout</div>
                <div className="text-xs text-gray-500">5 hours ago</div>
              </div>
              <div className="text-red-600 font-semibold">-$450.00</div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium">Member Contribution</div>
                <div className="text-xs text-gray-500">1 day ago</div>
              </div>
              <div className="text-green-600 font-semibold">+$8.00</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6">Treasury Wallets</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">Main Treasury</h3>
            <p className="text-gray-600 font-mono text-sm">0x742d35Cc6524EFFd55C1F20BC4E527A5e8ad2975</p>
            <p className="text-sm text-gray-500">Polygon Network • $1,656,234 USDC</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold">Emergency Fund</h3>
            <p className="text-gray-600 font-mono text-sm">0x8ba1f109551bD432803012645Hac136c82a5C4B3</p>
            <p className="text-sm text-gray-500">Polygon Network • $217,976 USDC</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-blue-800 mb-6">Risk & Claims Metrics</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Claims Chart */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Payout vs. Reserves Ratio</h3>
            <p className="text-3xl font-bold text-teal-600">4.1%</p>
            <p className="text-gray-500 mb-4">Target: &lt; 5%</p>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              [Line Chart - Ratio Over Time]
            </div>
          </div>
          
          {/* Audit Summaries */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Official Audit Summaries</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-blue-600 hover:text-blue-800 transition cursor-pointer">
                Q4 2025 Financial Audit (PDF)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </li>
              <li className="flex justify-between items-center text-blue-600 hover:text-blue-800 transition cursor-pointer">
                Smart Contract Security Review (PDF)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">All data is directly pulled from the <strong>Ethereum & Polygon</strong> ledgers.</p>
          </div>
        </div>
      </div>
    </div>
  )
}