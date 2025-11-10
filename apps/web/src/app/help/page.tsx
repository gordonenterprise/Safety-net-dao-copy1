export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Help Center</h1>
          
          <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">How does SafetyNet DAO work?</h3>
                <p className="text-gray-600">
                  SafetyNet DAO is a mutual aid platform where members pay $8/month to join a shared treasury. 
                  When members face income loss or emergencies, they can submit claims for fast financial support 
                  up to $500, validated by the community.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What can I claim for?</h3>
                <p className="text-gray-600">
                  You can submit claims for documented income loss, unexpected expenses, medical emergencies, 
                  job loss, or other financial hardships. All claims require documentation and community validation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">How fast are payouts?</h3>
                <p className="text-gray-600">
                  Our average payout time is 2.3 days from claim approval. Payouts are made via USDC (instant) 
                  or ACH bank transfer (1-3 business days).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Is my money safe?</h3>
                <p className="text-gray-600">
                  Yes! All funds are held in transparent on-chain wallets that you can verify anytime. 
                  The treasury is managed by smart contracts and community governance, not by any single person.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">
                  Absolutely. There are no long-term commitments. You can cancel your membership at any time, 
                  though you'll need to maintain active membership to submit claims.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">How do I get started?</h3>
                <p className="text-gray-600">
                  Simply click "Join for $8/month" on our homepage, set up your account, and your membership 
                  will be active immediately. You'll receive a membership NFT as proof of participation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Need More Help?</h3>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Our community support team is here to help.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md">
                Contact Support
              </button>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Community Resources</h3>
              <div className="space-y-2">
                <a href="/transparency" className="block text-blue-600 hover:text-blue-800">
                  → Treasury Transparency
                </a>
                <a href="/governance" className="block text-blue-600 hover:text-blue-800">
                  → Community Governance
                </a>
                <a href="/terms" className="block text-blue-600 hover:text-blue-800">
                  → Terms of Service
                </a>
                <a href="/privacy" className="block text-blue-600 hover:text-blue-800">
                  → Privacy Policy
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  )
}