"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface JiraTicket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  priority: string
  acceptanceCriteria: string[]
}

interface JiraConfig {
  url: string
  email: string
  apiToken: string
  projectKey: string
}

interface AIConfig {
  testType: "selenium-api" | "selenium-ui"
  coverage: number
  downloadFormat: "single-file" | "spring-project"
  testCaseTypes: string[]
}

interface HistoryItem {
  id: string
  date: string
  tickets: string[]
  testType: string
  coverage: number
  status: "completed" | "failed"
}

export default function JiraTestGenerator() {
  // State management
  const [activeTab, setActiveTab] = useState<"configuration" | "tickets" | "results" | "history">("configuration")
  const [jiraConfigs, setJiraConfigs] = useState<JiraConfig[]>([])
  const [selectedJiraConfig, setSelectedJiraConfig] = useState<JiraConfig>({
    url: "",
    email: "",
    apiToken: "",
    projectKey: "",
  })
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    testType: "selenium-api",
    coverage: 80,
    downloadFormat: "spring-project",
    testCaseTypes: ["positive", "negative", "edge-case"],
  })

  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedTests, setGeneratedTests] = useState<any>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Load saved configurations on mount
  useEffect(() => {
    const savedConfigs = localStorage.getItem("jiraConfigs")
    if (savedConfigs) {
      setJiraConfigs(JSON.parse(savedConfigs))
    }

    const savedHistory = localStorage.getItem("testHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save JIRA configuration
  const saveJiraConfig = () => {
    const configName = `${selectedJiraConfig.projectKey} - ${selectedJiraConfig.url}`
    const existingIndex = jiraConfigs.findIndex(
      (c) => c.projectKey === selectedJiraConfig.projectKey && c.url === selectedJiraConfig.url,
    )

    let updatedConfigs
    if (existingIndex >= 0) {
      updatedConfigs = [...jiraConfigs]
      updatedConfigs[existingIndex] = selectedJiraConfig
    } else {
      updatedConfigs = [...jiraConfigs, selectedJiraConfig]
    }

    setJiraConfigs(updatedConfigs)
    localStorage.setItem("jiraConfigs", JSON.stringify(updatedConfigs))
  }

  // Load saved JIRA configuration
  const loadJiraConfig = (config: JiraConfig) => {
    setSelectedJiraConfig(config)
  }

  // Fetch JIRA tickets
  const fetchTickets = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/jira-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedJiraConfig),
      })

      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
        setActiveTab("tickets")
      } else {
        setError(data.error || "Failed to fetch tickets")
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Generate tests for selected tickets
  const generateTests = async () => {
    if (selectedTickets.length === 0) {
      setError("Please select at least one ticket")
      return
    }

    setLoading(true)
    setError("")

    try {
      const selectedTicketData = tickets.filter((t) => selectedTickets.includes(t.id))

      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickets: selectedTicketData,
          aiConfig,
          language: "java",
        }),
      })

      const data = await response.json()

      if (data.files) {
        setGeneratedTests(data)

        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          tickets: selectedTicketData.map((t) => t.key),
          testType: aiConfig.testType,
          coverage: aiConfig.coverage,
          status: "completed",
        }

        const updatedHistory = [historyItem, ...history]
        setHistory(updatedHistory)
        localStorage.setItem("testHistory", JSON.stringify(updatedHistory))

        setActiveTab("results")
      } else {
        setError(data.error || "Failed to generate tests")
      }
    } catch (err) {
      setError("Test generation failed: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Download tests
  const downloadTests = async () => {
    if (!generatedTests) return

    if (aiConfig.downloadFormat === "single-file") {
      const allContent = generatedTests.files
        .map((file: any) => `// ===== ${file.path} =====\n${file.content}\n\n`)
        .join("")

      const blob = new Blob([allContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `test-cases-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      generatedTests.files.forEach((file: any) => {
        zip.file(file.path, file.content)
      })

      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = `spring-boot-tests-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Filter tickets by status
  const filteredTickets = tickets.filter(
    (ticket) => statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase(),
  )

  // Get unique statuses for filter
  const uniqueStatuses = [...new Set(tickets.map((t) => t.status))]

  const renderTabContent = () => {
    switch (activeTab) {
      case "configuration":
        return (
          <div className="space-y-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <span className="text-blue-600">⚙️</span>
                  JIRA Configuration
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Configure your JIRA connection or select from saved configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {jiraConfigs.length > 0 && (
                  <div>
                    <Label className="text-slate-700 font-medium">Saved Configurations</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {jiraConfigs.map((config, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => loadJiraConfig(config)}
                          className="border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                        >
                          {config.projectKey} - {new URL(config.url).hostname}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jira-url" className="text-slate-700 font-medium">
                      JIRA URL
                    </Label>
                    <Input
                      id="jira-url"
                      placeholder="https://yourcompany.atlassian.net"
                      value={selectedJiraConfig.url}
                      onChange={(e) => setSelectedJiraConfig({ ...selectedJiraConfig, url: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-key" className="text-slate-700 font-medium">
                      Project Key
                    </Label>
                    <Input
                      id="project-key"
                      placeholder="PROJ"
                      value={selectedJiraConfig.projectKey}
                      onChange={(e) => setSelectedJiraConfig({ ...selectedJiraConfig, projectKey: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={selectedJiraConfig.email}
                      onChange={(e) => setSelectedJiraConfig({ ...selectedJiraConfig, email: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-token" className="text-slate-700 font-medium">
                      API Token
                    </Label>
                    <Input
                      id="api-token"
                      type="password"
                      placeholder="Your JIRA API token"
                      value={selectedJiraConfig.apiToken}
                      onChange={(e) => setSelectedJiraConfig({ ...selectedJiraConfig, apiToken: e.target.value })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={fetchTickets}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "Connecting..." : "Connect & Fetch Tickets"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={saveJiraConfig}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <span className="text-blue-600">🤖</span>
                  AI Test Configuration
                </CardTitle>
                <CardDescription className="text-slate-600">Configure how tests should be generated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium text-sm">Test Type</Label>
                    <Select
                      value={aiConfig.testType}
                      onValueChange={(value: "selenium-api" | "selenium-ui") =>
                        setAiConfig({ ...aiConfig, testType: value })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="selenium-api">Selenium API Tests</SelectItem>
                        <SelectItem value="selenium-ui">Selenium UI Tests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium text-sm">Test Coverage (%)</Label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={aiConfig.coverage}
                      onChange={(e) => setAiConfig({ ...aiConfig, coverage: Number.parseInt(e.target.value) || 80 })}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium text-sm">Download Format</Label>
                  <Select
                    value={aiConfig.downloadFormat}
                    onValueChange={(value: "single-file" | "spring-project") =>
                      setAiConfig({ ...aiConfig, downloadFormat: value })
                    }
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-file">Single File (for adding to existing project)</SelectItem>
                      <SelectItem value="spring-project">Complete Spring Boot Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 font-medium text-sm">Test Case Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {["functional", "edge", "performance", "UI", "integration"].map((type) => (
                      <div
                        key={type}
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Checkbox
                          id={type}
                          checked={aiConfig.testCaseTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAiConfig({ ...aiConfig, testCaseTypes: [...aiConfig.testCaseTypes, type] })
                            } else {
                              setAiConfig({
                                ...aiConfig,
                                testCaseTypes: aiConfig.testCaseTypes.filter((t) => t !== type),
                              })
                            }
                          }}
                          className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor={type} className="capitalize text-slate-700 font-medium cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "tickets":
        return (
          <div className="space-y-6">
            {tickets.length === 0 ? (
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <div className="text-blue-600 text-4xl mb-4">📋</div>
                  <p className="text-slate-600 mb-4">No tickets loaded. Please configure JIRA connection first.</p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab("configuration")}
                  >
                    Go to Configuration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <span className="text-blue-600">🎫</span>
                    Select JIRA Tickets ({tickets.length} found)
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Choose tickets to generate tests from their acceptance criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-4">
                    <Label className="text-slate-700 font-medium">Filter by Status:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48 border-slate-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedTickets.includes(ticket.id)
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                        onClick={() => {
                          if (selectedTickets.includes(ticket.id)) {
                            setSelectedTickets(selectedTickets.filter((id) => id !== ticket.id))
                          } else {
                            setSelectedTickets([...selectedTickets, ticket.id])
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                {ticket.key}
                              </Badge>
                              <Badge variant={ticket.priority === "High" ? "destructive" : "secondary"}>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="outline" className="border-slate-200">
                                {ticket.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">{ticket.summary}</h3>
                            <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                            {ticket.acceptanceCriteria.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-slate-700 mb-1">Acceptance Criteria:</p>
                                <ul className="text-sm text-slate-600 list-disc list-inside">
                                  {ticket.acceptanceCriteria.slice(0, 3).map((criteria, index) => (
                                    <li key={index}>{criteria}</li>
                                  ))}
                                  {ticket.acceptanceCriteria.length > 3 && (
                                    <li className="text-slate-500">
                                      ... and {ticket.acceptanceCriteria.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                          {selectedTickets.includes(ticket.id) && (
                            <span className="text-blue-500 text-2xl font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                    <span className="text-sm text-slate-600 font-medium">
                      {selectedTickets.length} ticket(s) selected
                    </span>
                    <Button
                      onClick={generateTests}
                      disabled={loading || selectedTickets.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? "Generating Tests..." : "Generate AI Tests"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "results":
        return (
          <div className="space-y-6">
            {!generatedTests ? (
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <div className="text-blue-600 text-4xl mb-4">📊</div>
                  <p className="text-slate-600 mb-4">No test results available. Generate tests first.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setActiveTab("tickets")}>
                    Go to Tickets
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <span className="text-blue-600">📦</span>
                    Generated Test Results
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your Spring Boot test project is ready for download
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h3 className="font-semibold text-slate-900">Test Suite Generated</h3>
                      <p className="text-sm text-slate-600">
                        {generatedTests.files.length} files created for {selectedTickets.length} ticket(s)
                      </p>
                    </div>
                    <Button onClick={downloadTests} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Download {aiConfig.downloadFormat === "single-file" ? "Text File" : "Spring Project"}
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {generatedTests.files.slice(0, 3).map((file: any, index: number) => (
                      <div key={index} className="border border-blue-200 rounded-lg shadow-sm">
                        <div className="p-3 bg-blue-50 border-b border-blue-200">
                          <h4 className="font-medium text-sm text-slate-800">{file.path}</h4>
                        </div>
                        <div className="p-3">
                          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                            {file.content.substring(0, 300)}
                            {file.content.length > 300 && "..."}
                          </pre>
                        </div>
                      </div>
                    ))}
                    {generatedTests.files.length > 3 && (
                      <p className="text-sm text-slate-500 text-center">
                        ... and {generatedTests.files.length - 3} more files
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "history":
        return (
          <div className="space-y-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <span className="text-blue-600">📈</span>
                  Test Generation History
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Analytics and history of previous test generations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-blue-600 text-4xl mb-4">📊</div>
                    <p className="text-slate-500">No test generation history available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="border border-blue-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.status === "completed" ? "default" : "destructive"}
                              className={item.status === "completed" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                            >
                              {item.status}
                            </Badge>
                            <span className="text-sm text-slate-600 font-medium">
                              {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                            {item.testType}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-700">
                          <p className="mb-1">
                            <strong>Tickets:</strong> {item.tickets.join(", ")}
                          </p>
                          <p>
                            <strong>Coverage:</strong> {item.coverage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-72 bg-slate-800 text-white flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Goldman Sachs</h1>
              <p className="text-xs text-slate-300">QA Agent Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("configuration")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeTab === "configuration"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeTab === "tickets"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">🎫</span>
              <span className="font-medium">Tickets</span>
              {tickets.length > 0 && <Badge className="ml-auto bg-red-500 text-white text-xs">{tickets.length}</Badge>}
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeTab === "results"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">📦</span>
              <span className="font-medium">Results</span>
              {generatedTests && <Badge className="ml-auto bg-green-500 text-white text-xs">Ready</Badge>}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">📈</span>
              <span className="font-medium">History</span>
              {history.length > 0 && <Badge className="ml-auto bg-blue-500 text-white text-xs">{history.length}</Badge>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-400">© 2024 Goldman Sachs Group, Inc.</p>
            <p className="text-xs text-slate-500 mt-1">Global Banking Markets Division</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">GBM-CSG QA Agent</h1>
              <p className="text-slate-600">Automated Test Case Generation Platform</p>
            </div>
          </div>
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 capitalize flex items-center gap-2">
                  {activeTab === "configuration" && <span className="text-blue-600">⚙️</span>}
                  {activeTab === "tickets" && <span className="text-blue-600">🎫</span>}
                  {activeTab === "results" && <span className="text-blue-600">📦</span>}
                  {activeTab === "history" && <span className="text-blue-600">📈</span>}
                  {activeTab}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {activeTab === "configuration" && "Configure JIRA and AI settings"}
                  {activeTab === "tickets" && "Select tickets for test generation"}
                  {activeTab === "results" && "Download generated test projects"}
                  {activeTab === "history" && "View test generation analytics"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto bg-slate-50">
          {renderTabContent()}

          {error && (
            <Card className="border-l-4 border-l-red-500 bg-red-50 mt-6 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <span className="font-semibold">Error:</span>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
