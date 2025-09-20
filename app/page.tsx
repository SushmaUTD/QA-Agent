"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Download, Play, Settings } from "lucide-react"

interface JiraTicket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  assignee: string
  priority: string
  updated: string
  acceptanceCriteria: string[]
}

export default function JiraTestGenerator() {
  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    email: "",
    apiToken: "",
    projectKey: "",
  })
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
  const [testLanguage, setTestLanguage] = useState("java")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedTests, setGeneratedTests] = useState<any>(null)

  const fetchTickets = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/jira-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jiraConfig),
      })

      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
      } else {
        setError(data.error || "Failed to fetch tickets")
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const generateTests = async () => {
    if (!selectedTicket) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketKey: selectedTicket.key,
          summary: selectedTicket.summary,
          description: selectedTicket.acceptanceCriteria.join("\n"),
          language: testLanguage,
        }),
      })

      const data = await response.json()

      if (data.files) {
        setGeneratedTests(data)
      } else {
        setError(data.error || "Failed to generate tests")
      }
    } catch (err) {
      setError("Test generation failed: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTests = async () => {
    if (!generatedTests) return

    // Dynamically import JSZip
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    // Add each file to the ZIP with proper directory structure
    generatedTests.files.forEach((file: any) => {
      zip.file(file.path, file.content)
    })

    // Generate the ZIP file
    const content = await zip.generateAsync({ type: "blob" })

    // Create download link
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedTicket?.key || "tests"}-${testLanguage}-project.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">JIRA Test Generator</h1>
          <p className="text-lg text-gray-600">AI-powered test case generation from JIRA acceptance criteria</p>
        </div>

        <Tabs defaultValue="configure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="tickets">Select Ticket</TabsTrigger>
            <TabsTrigger value="generate">Generate Tests</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="configure">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  JIRA Configuration
                </CardTitle>
                <CardDescription>
                  Configure your JIRA connection to fetch tickets and acceptance criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jira-url">JIRA URL</Label>
                    <Input
                      id="jira-url"
                      placeholder="https://yourcompany.atlassian.net"
                      value={jiraConfig.url}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-key">Project Key</Label>
                    <Input
                      id="project-key"
                      placeholder="KAN"
                      value={jiraConfig.projectKey}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={jiraConfig.email}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-token">API Token</Label>
                    <Input
                      id="api-token"
                      type="password"
                      placeholder="Your JIRA API token"
                      value={jiraConfig.apiToken}
                      onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={fetchTickets} disabled={loading} className="w-full">
                  {loading ? "Connecting..." : "Connect to JIRA"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Select JIRA Ticket</CardTitle>
                <CardDescription>Choose a ticket with acceptance criteria to generate tests from</CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No tickets loaded. Please configure JIRA connection first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{ticket.key}</Badge>
                              <Badge variant={ticket.priority === "High" ? "destructive" : "secondary"}>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="outline">{ticket.status}</Badge>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{ticket.summary}</h3>
                            <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                            {ticket.acceptanceCriteria.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Acceptance Criteria:</p>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {ticket.acceptanceCriteria.map((criteria, index) => (
                                    <li key={index}>{criteria}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {selectedTicket?.id === ticket.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Generate Test Cases
                </CardTitle>
                <CardDescription>Configure test generation settings and create automated tests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTicket ? (
                  <>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Selected Ticket</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{selectedTicket.key}</Badge>
                        <span className="text-sm text-gray-600">{selectedTicket.summary}</span>
                      </div>
                      {selectedTicket.acceptanceCriteria.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Acceptance Criteria:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {selectedTicket.acceptanceCriteria.map((criteria, index) => (
                              <li key={index}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="language">Test Language</Label>
                      <Select value={testLanguage} onValueChange={setTestLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="java">Java (Spring Boot + RestAssured)</SelectItem>
                          <SelectItem value="python">Python (pytest + requests)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={generateTests} disabled={loading} className="w-full">
                      {loading ? "Generating Tests..." : "Generate AI-Powered Tests"}
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">Please select a JIRA ticket first.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generated Test Results
                </CardTitle>
                <CardDescription>Review and download your AI-generated test suite</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTests ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Test Suite Generated</h3>
                        <p className="text-sm text-gray-600">
                          {generatedTests.files.length} files created for {selectedTicket?.key}
                        </p>
                      </div>
                      <Button onClick={downloadTests}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Tests
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {generatedTests.files.map((file: any, index: number) => (
                        <div key={index} className="border rounded-lg">
                          <div className="p-3 bg-gray-50 border-b">
                            <h4 className="font-medium text-sm">{file.path}</h4>
                          </div>
                          <div className="p-3">
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                              {file.content.substring(0, 500)}
                              {file.content.length > 500 && "..."}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tests generated yet. Please generate tests first.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
