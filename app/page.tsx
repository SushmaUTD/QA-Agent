export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">JIRA Test AI</h1>
        <p className="text-gray-600 mb-8">Automated Test Generation Platform</p>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Case Generator</h2>
          <p className="text-gray-600">Generate comprehensive test cases from JIRA tickets automatically.</p>

          <div className="mt-6 space-y-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Connect to JIRA</button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded ml-4">Generate Test Cases</button>
          </div>
        </div>
      </div>
    </div>
  )
}
