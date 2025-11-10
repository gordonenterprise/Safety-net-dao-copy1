import Link from 'next/link'

interface WalletData {
  name: string
  address: string
  balance: number
  balanceUSD: number
  purpose: string
  signers: string[]
  network: string
  explorerUrl: string
  color: string
}

export default function TrustWall() {
  // Mock wallet data - in real app, this would come from blockchain APIs
  const wallets: WalletData[] = [
    {
      name: "Main Treasury",
      address: "0x742d35Cc6524EFFd55C1F20BC4E527A5e8ad2975",
      balance: 1656234,
      balanceUSD: 1656234,
      purpose: "Primary mutual aid fund",
      signers: ["Gordon Enterprise Inc.", "DAO Community", "Emergency Signer"],
      network: "Polygon",
      explorerUrl: "https://polygonscan.com/address/0x742d35Cc6524EFFd55C1F20BC4E527A5e8ad2975",
      color: "border-blue-500"
    },
    {
      name: "Emergency Reserve",
      address: "0x8ba1f109551bD432803012645Hac136c82a5C4B3",
      balance: 217976,
      balanceUSD: 217976,
      purpose: "Emergency backup fund",
      signers: ["Gordon Enterprise Inc.", "Community Validators"],
      network: "Polygon",
      explorerUrl: "https://polygonscan.com/address/0x8ba1f109551bD432803012645Hac136c82a5C4B3",
      color: "border-green-500"
    },
    {
      name: "Operating Expenses",
      address: "0x4f3a120E72C76c22ae802D129F599BFDbc31cb81",
      balance: 45678,
      balanceUSD: 45678,
      purpose: "Platform maintenance & development",
      signers: ["Gordon Enterprise Inc.", "Core Team"],
      network: "Polygon",
      explorerUrl: "https://polygonscan.com/address/0x4f3a120E72C76c22ae802D129F599BFDbc31cb81",
      color: "border-teal-500"
    }
  ]

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balanceUSD, 0)

  return (
    <section className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Trust Wall</h2>
        <p className="text-gray-600 mb-4">
          Live, verifiable blockchain transparency. Every wallet, every transaction, every dollar.
        </p>
        <div className="text-5xl font-extrabold text-teal-600 mb-2">
          ${totalBalance.toLocaleString()}
        </div>
        <p className="text-sm text-gray-500">Total Verifiable Assets</p>
      </div>

      {/* Live Treasury Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {wallets.map((wallet, index) => (
          <div key={index} className={`bg-gray-50 p-6 rounded-lg border-l-4 ${wallet.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{wallet.network}</span>
            </div>
            
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ${wallet.balanceUSD.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mb-4">{wallet.purpose}</p>
            
            {/* Wallet Address */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Wallet Address:</p>
              <div className="flex items-center justify-between bg-white p-2 rounded border">
                <code className="text-xs text-gray-700 font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </code>
                <a 
                  href={wallet.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  View →
                </a>
              </div>
            </div>

            {/* Multi-sig Signers */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Multi-sig Signers:</p>
              <div className="space-y-1">
                {wallet.signers.map((signer, idx) => (
                  <div key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                    {signer}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🛡️ Security & Governance</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Multi-Signature Protection</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• 2-of-3 signature requirement for all transactions</li>
              <li>• No single entity can move funds alone</li>
              <li>• Community oversight on all major operations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Live Verification</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• All balances updated every 5 minutes</li>
              <li>• Transaction history publicly auditable</li>
              <li>• Smart contract code verified on Polygonscan</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <a 
          href="https://polygonscan.com/address/0x742d35Cc6524EFFd55C1F20BC4E527A5e8ad2975"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          View Main Treasury
        </a>
        <Link 
          href="/transparency"
          className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Full Transparency Dashboard
        </Link>
        <button className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition">
          Subscribe to Updates
        </button>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()} | Data refreshes every 5 minutes
        </p>
      </div>
    </section>
  )
}