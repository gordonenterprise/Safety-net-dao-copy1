export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Join SafetyNet DAO</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Membership Benefits</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Emergency financial support when you need it
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Transparent on-chain treasury you can trust
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Fast payouts (average 2.3 days)
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Community support and governance participation
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Membership NFT proving your participation
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-semibold mb-4">Ready to Get Started?</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">$8/month</div>
              <p className="text-gray-600 mb-6">Cancel anytime, no long-term commitment</p>
              
              <div className="space-y-3">
                <a 
                  href="/auth/signup"
                  className="block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md text-lg transition"
                >
                  Start Membership
                </a>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Already a member?</span>
                  </div>
                </div>
                
                <a 
                  href="/auth/signin"
                  className="block border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-md text-lg transition"
                >
                  Sign In to Dashboard
                </a>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                By joining, you agree to our terms of service and community guidelines
              </p>
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