export default function HowItWorks() {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-blue-800 text-center mb-8">How SafetyNet Works</h2>
      <div className="grid md:grid-cols-3 gap-8 text-center">
        {/* Step 1 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <span className="text-4xl font-extrabold text-blue-600 mb-3 block">1</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Fund the Pool</h3>
          <p className="text-gray-600">Members pay monthly dues ($8/month) into the decentralized risk pool treasury.</p>
        </div>
        
        {/* Step 2 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-600">
          <span className="text-4xl font-extrabold text-teal-600 mb-3 block">2</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit & Verify</h3>
          <p className="text-gray-600">A member submits a claim. Community Validators review and vote on the claim's validity.</p>
        </div>
        
        {/* Step 3 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600">
          <span className="text-4xl font-extrabold text-purple-600 mb-3 block">3</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Payout</h3>
          <p className="text-gray-600">Once approved by consensus, payment is released automatically via smart contract.</p>
        </div>
      </div>
    </section>
  )
}