export default function PoolsPage() {
  const poolCard = (title: string, status: string, description: string, icon: string, colorClass: string) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg ${status === 'Active' ? 'border-t-4 border-blue-600' : 'border-t-4 border-gray-300'} hover:shadow-xl transition duration-300`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className={`p-3 ${status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'} rounded-full`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: icon }}></svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${status === 'Active' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {status}
          </span>
        </div>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <a href="#" className={`text-sm font-semibold ${status === 'Active' ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500 cursor-default'} transition`}>
        {status === 'Active' ? 'View Pool Details →' : 'Notify Me When Available'}
      </a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Risk Pools</h1>
      <p className="text-xl text-gray-600 mb-10">Select the type of protection that covers your most critical assets.</p>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600 hover:shadow-xl transition duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2l-1 1h4m-4-8v5a1 1 0 001 1h2m-5-4v5a1 1 0 01-1 1h-2m8-4H8"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Income Shield</h3>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-teal-500 text-white">
                Active
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Provides quick financial relief for unexpected work interruptions due to illness, injury, or critical vehicle/device failure.</p>
          <a href="/join" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
            View Pool Details →
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-300 hover:shadow-xl transition duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Home Resilience</h3>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">A community pool designed to help cover immediate, unexpected home repair costs following minor incidents.</p>
          <a href="#" className="text-sm font-semibold text-gray-500 cursor-default transition">
            Notify Me When Available
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-300 hover:shadow-xl transition duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Device & Mobility</h3>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Focused protection for essential tools: work laptops, smartphones, and vehicles critical for earning income.</p>
          <a href="#" className="text-sm font-semibold text-gray-500 cursor-default transition">
            Notify Me When Available
          </a>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Ready to Get Protected?</h2>
        <p className="text-lg text-gray-600 mb-6">
          Join the Income Shield pool today and get access to fast financial relief when you need it most.
        </p>
        <a 
          href="/join"
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
        >
          Join Income Shield Pool →
        </a>
      </div>
    </div>
  )
}