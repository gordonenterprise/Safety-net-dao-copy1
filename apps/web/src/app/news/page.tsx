export default function NewsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-8 border-b pb-2">News & Updates</h1>
      
      <div className="space-y-8">
        {/* Blog Post 1 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Impact Story: Keeping a Freelancer's Car on the Road</h2>
          <p className="text-sm text-gray-500 mb-4">November 1, 2025 | Impact Stories</p>
          <p className="text-gray-700 leading-relaxed">
            Meet Maria, a gig-worker whose car transmission failed unexpectedly. Within 72 hours of submitting her claim through the Member Portal, the community-approved payout was sent to her mechanic. Read about how the SafetyNet DAO kept her mobile and income flowing.
          </p>
          <a href="#" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-semibold">Read More →</a>
        </div>
        
        {/* Blog Post 2 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Q1 2026 Roadmap Preview: Device Shield & Governance V2</h2>
          <p className="text-sm text-gray-500 mb-4">October 15, 2025 | Product Updates</p>
          <p className="text-gray-700 leading-relaxed">
            The DAO is preparing to launch the Device & Mobility pool in Q1 2026. We are also upgrading our governance structure to V2, introducing better delegation and gas-optimized voting. Review the details in our public roadmap and community discussions.
          </p>
          <a href="#" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-semibold">Read More →</a>
        </div>
        
        {/* Blog Post 3 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">New Integration: Seamless Stripe Payments Now Live</h2>
          <p className="text-sm text-gray-500 mb-4">October 24, 2025 | Platform Updates</p>
          <p className="text-gray-700 leading-relaxed">
            We're excited to announce that Stripe payments are now fully integrated into the SafetyNet DAO platform. Members can now pay their monthly dues with any major credit card or bank account, making membership more accessible than ever. This integration maintains our commitment to both traditional and crypto payment methods.
          </p>
          <a href="#" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-semibold">Read More →</a>
        </div>

        {/* Blog Post 4 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Treasury Report Q4 2025: Record Growth and Stability</h2>
          <p className="text-sm text-gray-500 mb-4">October 1, 2025 | Financial Reports</p>
          <p className="text-gray-700 leading-relaxed">
            Our Q4 treasury report shows remarkable growth with reserves increasing by 12% while maintaining our target payout ratio of under 5%. With 2,847 active members and $1.87M in total reserves, SafetyNet DAO continues to demonstrate the power of community-driven mutual aid.
          </p>
          <a href="#" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-semibold">Read More →</a>
        </div>
        
        {/* Blog Post 5 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-600">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Community Spotlight: Validator Election Results</h2>
          <p className="text-sm text-gray-500 mb-4">September 15, 2025 | Community</p>
          <p className="text-gray-700 leading-relaxed">
            The community has spoken! Our latest validator elections have concluded with record participation. Meet the newly elected validators who will help review claims and guide our community governance. Their commitment to fair and transparent claim processing ensures SafetyNet DAO continues to serve members effectively.
          </p>
          <a href="#" className="mt-4 inline-block text-teal-600 hover:text-teal-800 font-semibold">Read More →</a>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-teal-50 p-8 rounded-xl text-center">
        <h3 className="text-2xl font-bold text-blue-900 mb-4">Stay Updated</h3>
        <p className="text-gray-600 mb-6">Get the latest SafetyNet DAO news and updates delivered to your inbox.</p>
        <div className="max-w-md mx-auto flex gap-4">
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  )
}