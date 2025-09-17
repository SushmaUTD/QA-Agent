"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface TestCase {
  id: string
  title: string
  priority: string
  type: string
  preconditions: string[]
  steps: string[]
  expectedResults: string
  testData: string
}

interface GenerationMetadata {
  ticketKey: string
  generatedAt: string
  settings: any
  totalTests: number
  usingFallback: boolean
  error?: string
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

  const [settings, setSettings] = useState({
    coverageLevel: "Basic",
    testTypes: ["Functional"],
    framework: "Manual",
  })

  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!ticket.summary.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide at least a ticket summary",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, settings }),
      })

      const data = await response.json()

      if (data.success) {
        setTestCases(data.testCases)
        setMetadata(data.metadata)
        toast({
          title: "Success",
          description: `Generated ${data.testCases.length} test cases`,
        })
      } else {
        throw new Error("Generation failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate test cases",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTestTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSettings((prev) => ({
        ...prev,
        testTypes: [...prev.testTypes, type],
      }))
    } else {
      setSettings((prev) => ({
        ...prev,
        testTypes: prev.testTypes.filter((t) => t !== type),
      }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">JIRA Test Case Generator</h1>
          <p className="text-xl text-muted-foreground">
            Generate comprehensive test cases from JIRA ticket information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">Ticket Key</Label>
                    <Input
                      id="key"
                      placeholder="e.g., PROJ-123"
                      value={ticket.key}
                      onChange={(e) => setTicket((prev) => ({ ...prev, key: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => setTicket((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary *</Label>
                  <Input
                    id="summary"
                    placeholder="Brief description of the ticket"
                    value={ticket.summary}
                    onChange={(e) => setTicket((prev) => ({ ...prev, summary: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the feature or bug"
                    rows={4}
                    value={ticket.description}
                    onChange={(e) => setTicket((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteria">Acceptance Criteria</Label>
                  <Textarea
                    id="criteria"
                    placeholder="List the acceptance criteria for this ticket"
                    rows={4}
                    value={ticket.acceptanceCriteria}
                    onChange={(e) => setTicket((prev) => ({ ...prev, acceptanceCriteria: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Coverage Level</Label>
                  <Select
                    value={settings.coverageLevel}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, coverageLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic (5-7 tests)</SelectItem>
                      <SelectItem value="Comprehensive">Comprehensive (10-15 tests)</SelectItem>
                      <SelectItem value="Extensive">Extensive (15-20 tests)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Functional", "UI", "Integration", "Performance", "Security", "Negative"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={settings.testTypes.includes(type)}
                          onCheckedChange={(checked) => handleTestTypeChange(type, checked as boolean)}
                        />
                        <Label htmlFor={type} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Framework</Label>
                  <Select
                    value={settings.framework}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, framework: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual Testing</SelectItem>
                      <SelectItem value="Selenium">Selenium</SelectItem>
                      <SelectItem value="Cypress">Cypress</SelectItem>
                      <SelectItem value="Playwright">Playwright</SelectItem>
                      <SelectItem value="Jest">Jest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !ticket.summary.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? "Generating..." : "Generate Test Cases"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {metadata && (
              <Card>
                <CardHeader>
                  <CardTitle>Generation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ticket:</span> {metadata.ticketKey}
                    </div>
                    <div>
                      <span className="font-medium">Total Tests:</span> {metadata.totalTests}
                    </div>
                    <div>
                      <span className="font-medium">Generated:</span> {new Date(metadata.generatedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span>
                      <Badge variant={metadata.usingFallback ? "secondary" : "default"} className="ml-2">
                        {metadata.usingFallback ? "Fallback" : "AI Generated"}
                      </Badge>
                    </div>
                  </div>
                  {metadata.error && <div className="mt-2 text-sm text-muted-foreground">Note: {metadata.error}</div>}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {testCases.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-4xl mb-4">🧪</div>
                    <p className="text-lg mb-2">No test cases generated yet</p>
                    <p className="text-sm text-muted-foreground">
                      Fill in the ticket information and click "Generate Test Cases"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                testCases.map((testCase, index) => (
                  <Card key={testCase.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{testCase.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{testCase.id}</Badge>
                            <Badge
                              variant={
                                testCase.priority === "High"
                                  ? "destructive"
                                  : testCase.priority === "Medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {testCase.priority}
                            </Badge>
                            <Badge variant="outline">{testCase.type}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {testCase.preconditions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Preconditions:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {testCase.preconditions.map((condition, i) => (
                              <li key={i}>{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Test Steps:</h4>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                          {testCase.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Expected Results:</h4>
                        <p className="text-sm">{testCase.expectedResults}</p>
                      </div>

                      {testCase.testData && testCase.testData !== "N/A" && (
                        <div>
                          <h4 className="font-medium mb-2">Test Data:</h4>
                          <p className="text-sm">{testCase.testData}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
