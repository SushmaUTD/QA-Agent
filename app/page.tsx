"use client"

import { useState } from "react"

interface TestCase {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  type: string
  preconditions: string[]
  steps: string[]
  expectedResults: string
  testData: string
}

export default function JIRATestGenerator() {
  const [ticket, setTicket] = useState({
    key: "",
    summary: "",
    description: "",
    acceptanceCriteria: "",
    priority: "Medium",
    type: "Story",
  })

  const [generatedTests, setGeneratedTests] = useState<TestCase[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [seleniumCode, setSeleniumCode] = useState("")
  const [isGeneratingSelenium, setIsGeneratingSelenium] = useState(false)

  const generateTestCases = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket,
          settings: {
            coverageLevel: "Comprehensive",
            testTypes: ["Functional", "UI", "Integration"],
            framework: "Selenium",
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedTests(data.testCases)
      }
    } catch (error) {
      console.error("Error generating tests:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSeleniumCode = async () => {
    if (generatedTests.length === 0) return

    setIsGeneratingSelenium(true)
    try {
      const response = await fetch("/api/generate-selenium-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationUrl: "https://v0-product-crud-app.vercel.app/",
          testCase: generatedTests[0],
        }),
      })

      const data = await response.json()
      setSeleniumCode(data.seleniumCode)
    } catch (error) {
      console.error("Error generating Selenium code:", error)
    } finally {
      setIsGeneratingSelenium(false)
    }
  }

  const downloadSeleniumCode = () => {
    const blob = new Blob([seleniumCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "selenium_test.py"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">JIRA Test AI</h1>
          <p className="text-xl text-gray-600">Automated Test Generation Platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">JIRA Ticket Information</h2>
              <p className="text-gray-600 mb-6">Enter your JIRA ticket details to generate comprehensive test cases</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="ticketKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Key
                  </label>
                  <input
                    id="ticketKey"
                    type="text"
                    placeholder="e.g., PROJ-123"
                    value={ticket.key}
                    onChange={(e) => setTicket({ ...ticket, key: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <input
                    id="summary"
                    type="text"
                    placeholder="Brief description of the feature"
                    value={ticket.summary}
                    onChange={(e) => setTicket({ ...ticket, summary: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="Detailed description of the feature or bug"
                    value={ticket.description}
                    onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="acceptanceCriteria" className="block text-sm font-medium text-gray-700 mb-1">
                    Acceptance Criteria
                  </label>
                  <textarea
                    id="acceptanceCriteria"
                    placeholder="List the acceptance criteria"
                    value={ticket.acceptanceCriteria}
                    onChange={(e) => setTicket({ ...ticket, acceptanceCriteria: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={generateTestCases}
              disabled={isGenerating || !ticket.summary}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating Tests..." : "Generate Test Cases"}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {generatedTests.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Generated Test Cases ({generatedTests.length} tests)</h2>

                <div className="space-y-4">
                  {/* Test Cases */}
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {generatedTests.map((test, index) => (
                      <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{test.title}</h4>
                          <div className="flex gap-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                test.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : test.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {test.priority}
                            </span>
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{test.type}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <strong>Steps:</strong> {test.steps.length} steps
                          </p>
                          <p>
                            <strong>Expected:</strong> {test.expectedResults.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selenium Code Section */}
                  <div className="border-t pt-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={generateSeleniumCode}
                        disabled={isGeneratingSelenium || generatedTests.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {isGeneratingSelenium ? "Generating..." : "Generate Selenium Code"}
                      </button>

                      {seleniumCode && (
                        <button
                          onClick={downloadSeleniumCode}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                          Download Code
                        </button>
                      )}
                    </div>

                    {seleniumCode && (
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
                        <pre>{seleniumCode.substring(0, 1000)}...</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
