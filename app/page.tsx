"use client"

import { useState } from "react"
import JSZip from "jszip"

interface JiraTicket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  acceptanceCriteria: string[]
  assignee: string
  priority: string
  updated: string
}

interface TestCase {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  type: "API" | "Integration" | "Contract" | "Performance" | "Security"
  apiEndpoint: string
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  requestPayload?: string
  expectedStatusCode: number
  expectedResponse?: string
  preconditions: string[]
  steps: string[]
  expectedResults: string
  testData: string
}

interface TestGenerationResult {
  ticket?: JiraTicket
  testCases: TestCase[]
  metadata: {
    ticketKey?: string
    generatedAt: string
    settings: any
    totalTests: number
    source: "jira"
  }
}

const downloadTestCases = async (framework: string, testResult: TestGenerationResult) => {
  // Placeholder implementation for downloadTestCases
  console.log(`Downloading test cases for ${testResult.ticket?.key} using ${framework} framework`)
}

export default function JiraTestGenerator() {
  const [activeSection, setActiveSection] = useState("ai-config")

  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    email: "",
    apiToken: "",
    projectKey: "",
  })

  const [appConfig, setAppConfig] = useState({
    applicationUrl: "",
    environment: "staging",
  })

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Updated testTypes to include API-specific types and adjusted default
  const [testTypes, setTestTypes] = useState<string[]>(["API"])
  // Updated testCoverage to use string values for better semantic meaning
  const [testCoverage, setTestCoverage] = useState("comprehensive")
  const [selectedFramework, setSelectedFramework] = useState("api")
  const [selectedLanguage, setSelectedLanguage] = useState("java")

  const handleJiraConnect = async () => {
    console.log("[v0] JIRA Connect button clicked")
    console.log("[v0] JIRA Config:", jiraConfig)

    setIsConnecting(true)
    try {
      console.log("[v0] Making API call to /api/jira-tickets")
      const response = await fetch("/api/jira-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jiraConfig),
      })

      console.log("[v0] API Response status:", response.status)
      const data = await response.json()
      console.log("[v0] API Response data:", data)

      if (data.success && data.tickets) {
        setTickets(data.tickets)
        setIsConnected(true)
        console.log(`[v0] Successfully loaded ${data.tickets.length} tickets from JIRA`)
      } else {
        console.error("[v0] Failed to connect to JIRA:", data.error)
        alert(`Failed to connect to JIRA: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Error connecting to JIRA:", error)
      alert("Error connecting to JIRA. Please check your configuration.")
    } finally {
      setIsConnecting(false)
      console.log("[v0] Connection attempt finished")
    }
  }

  const generateTestCases = async () => {
    if (selectedTickets.length === 0) {
      alert("Please select at least one ticket to generate test cases.")
      return
    }

    setIsGenerating(true)
    try {
      const selectedTicketObjects = tickets.filter((ticket) => selectedTickets.includes(ticket.id))

      for (const ticket of selectedTicketObjects) {
        const response = await fetch("/api/generate-tests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: ticket.description, // Just pass the entire description
            language: selectedLanguage,
            ticketKey: ticket.key,
            summary: ticket.summary,
          }),
        })

        const result = await response.json()

        if (result.success) {
          downloadGeneratedCode(result.code, ticket.key, selectedLanguage)
        } else {
          alert(`Error generating tests for ${ticket.key}: ${result.error}`)
        }
      }
    } catch (error) {
      console.error("Error generating test cases:", error)
      alert("Error generating test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadGeneratedCode = async (code: string, ticketKey: string, language: string) => {
    const zip = new JSZip()

    if (language === "java") {
      zip.file("pom.xml", generatePomXml(ticketKey))
      zip.file("src/main/java/com/testing/qaagent/Application.java", generateMainClass())
      zip.file(`src/test/java/com/testing/qaagent/tests/${ticketKey.replace(/-/g, "_")}_ApiTests.java`, code)
      zip.file("src/test/resources/testng.xml", generateTestNgXml(ticketKey))
      zip.file("src/test/resources/application.properties", generateApplicationProperties())
      zip.file("README.md", generateReadme(ticketKey, language))
    } else if (language === "python") {
      zip.file("requirements.txt", generatePythonRequirements())
      zip.file(`tests/test_${ticketKey.toLowerCase().replace(/-/g, "_")}_api.py`, code)
      zip.file("pytest.ini", generatePytestConfig())
      zip.file("README.md", generateReadme(ticketKey, language))
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${ticketKey}_${language}_api_tests.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePomXml = (ticketKey: string) => `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://www.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.testing</groupId>
    <artifactId>qa-agent-api-tests</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>API Tests for ${ticketKey}</name>
    
    <properties>
        <java.version>17</java.version>
        <spring.boot.version>3.1.5</spring.boot.version>
    </properties>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
        <relativePath/>
    </parent>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured</artifactId>
            <version>5.3.2</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>7.8.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`

  const generateMainClass = () => `package com.testing.qaagent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`

  const generateTestNgXml = (ticketKey: string) => `<?xml version="1.0" encoding="UTF-8"?>
<suite name="API Tests" verbose="1">
    <test name="${ticketKey} API Tests">
        <classes>
            <class name="com.testing.qaagent.tests.${ticketKey.replace(/-/g, "_")}_ApiTests"/>
        </classes>
    </test>
</suite>`

  const generateApplicationProperties = () => `app.base.url=${appConfig.applicationUrl || "http://localhost:3000"}
server.port=0
logging.level.root=INFO`

  const generatePythonRequirements = () => `requests==2.31.0
pytest==7.4.3
pytest-html==4.1.1
jsonschema==4.19.2`

  const generatePytestConfig = () => `[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --html=reports/report.html --self-contained-html`

  const generateReadme = (ticketKey: string, language: string) => `# API Tests for ${ticketKey}

## Overview
Automated API test suite generated from JIRA ticket acceptance criteria.

## Language: ${language.toUpperCase()}

## How to Run

${
  language === "java"
    ? `### Java (Maven + TestNG)
1. Import as Maven project in your IDE
2. Update \`src/test/resources/application.properties\` with your API base URL
3. Run tests: \`mvn clean test\`
4. Or run via IDE: Right-click on test class → Run`
    : `### Python (pytest)
1. Install dependencies: \`pip install -r requirements.txt\`
2. Update base URL in test file
3. Run tests: \`pytest tests/ --html=reports/report.html\``
}

## Generated: ${new Date().toLocaleString()}
`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Updated title and description for API focus */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">JIRA API Test Generator</h1>
            <p className="text-lg text-gray-600">Generate comprehensive API test cases from JIRA tickets</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setActiveSection("ai-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "ai-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                AI Configuration
              </button>
              <button
                onClick={() => setActiveSection("jira-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "jira-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                JIRA Configuration
              </button>
              <button
                onClick={() => setActiveSection("app-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "app-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                App Configuration
              </button>
              <button
                onClick={() => setActiveSection("tickets")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "tickets" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tickets & Tests
              </button>
            </div>
          </div>

          {activeSection === "ai-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Test Generation Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="java">Java (Spring Boot + RestAssured + TestNG)</option>
                    <option value="python">Python (pytest + requests)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Framework</label>
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="api">API Testing (Direct HTTP calls)</option>
                    <option value="selenium">Selenium WebDriver</option>
                    <option value="cypress">Cypress</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "jira-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">JIRA Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">JIRA URL</label>
                  <input
                    type="url"
                    value={jiraConfig.url}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                    placeholder="https://your-company.atlassian.net"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={jiraConfig.email}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                    placeholder="your-email@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                  <input
                    type="password"
                    value={jiraConfig.apiToken}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                    placeholder="Your JIRA API token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Key</label>
                  <input
                    type="text"
                    value={jiraConfig.projectKey}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                    placeholder="PROJ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleJiraConnect}
                  disabled={isConnecting || !jiraConfig.url || !jiraConfig.email || !jiraConfig.apiToken}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Connecting..." : "Connect to JIRA"}
                </button>
                {isConnected && <span className="ml-3 text-green-600 font-medium">✓ Connected</span>}
              </div>
            </div>
          )}

          {activeSection === "app-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Application Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
                  <input
                    type="url"
                    value={appConfig.applicationUrl}
                    onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                    placeholder="https://your-api-base-url.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select
                    value={appConfig.environment}
                    onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "tickets" && (
            <div className="space-y-6">
              {isConnected && tickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">JIRA Tickets</h2>
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTickets([...selectedTickets, ticket.id])
                            } else {
                              setSelectedTickets(selectedTickets.filter((id) => id !== ticket.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-blue-600">{ticket.key}</span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                ticket.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              {ticket.status}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 mt-1">{ticket.summary}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={generateTestCases} // Updated function name
                      disabled={isGenerating || selectedTickets.length === 0}
                      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? "Generating..." : `Generate & Download API Tests (${selectedTickets.length})`}
                    </button>
                  </div>
                </div>
              )}

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Generated API Test Cases</h2>
                  <div className="space-y-6">
                    {generatedTests.map((testResult, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {testResult.ticket?.key} - {testResult.ticket?.summary}
                            </h3>
                            <p className="text-sm text-gray-600">{testResult.testCases.length} test cases generated</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadTestCases("selenium", testResult)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Download Java API Tests
                            </button>
                            <button
                              onClick={() => downloadTestCases("cypress", testResult)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Download Cypress
                            </button>
                            <button
                              onClick={() => downloadTestCases("json", testResult)}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              Download JSON
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {testResult.testCases.map((testCase, tcIndex) => (
                            <div key={tcIndex} className="bg-gray-50 p-3 rounded">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                                <div className="flex space-x-2">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      testCase.priority === "High"
                                        ? "bg-red-100 text-red-800"
                                        : testCase.priority === "Medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {testCase.priority}
                                  </span>
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {testCase.type}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{testCase.expectedResults}</p>
                              {/* Displaying API specific details */}
                              <p className="text-sm text-gray-600 mt-1">
                                Endpoint: <strong>{testCase.apiEndpoint}</strong> | Method:{" "}
                                <strong>{testCase.httpMethod}</strong> | Expected Status:{" "}
                                <strong>{testCase.expectedStatusCode}</strong>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No JIRA Connection</h3>
                  <p className="text-gray-600 mb-4">
                    Connect to JIRA to start generating API test cases from your tickets.
                  </p>
                  <button
                    onClick={() => setActiveSection("jira-config")}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Configure JIRA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
