"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface TestCase {
  id: string
  title: string
  priority: "Critical" | "High" | "Medium" | "Low"
  type: string
  preconditions: string
  steps: string[]
  expectedResult: string
  testData?: string
}

interface GenerationResult {
  summary: {
    totalTests: number
    coverageLevel: string
    framework: string
    generatedAt: string
  }
  testCases: TestCase[]
}

export default function JIRATestGenerator() {
  const [ticketInfo, setTicketInfo] = useState({
    ticketKey: "",
    priority: "",
    summary: "",
    description: "",
    acceptanceCriteria: "",
  })

  const [testSettings, setTestSettings] = useState({
    coverageLevel: "",
    testTypes: {
      functional: false,
      ui: false,
      integration: false,
      performance: false,
      security: false,
      negative: false,
    },
    framework: "",
  })

  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleTestTypeChange = (type: keyof typeof testSettings.testTypes, checked: boolean) => {
    setTestSettings((prev) => ({
      ...prev,
      testTypes: {
        ...prev.testTypes,
        [type]: checked,
      },
    }))
  }

  const handleGenerateTests = async () => {
    if (!ticketInfo.summary) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketInfo,
          testSettings,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate test cases")
      }

      const result = await response.json()
      setGenerationResult(result)

      toast({
        title: "Success",
        description: `Generated ${result.testCases.length} test cases successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive"
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
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
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticketKey">Ticket Key</Label>
                    <Input
                      id="ticketKey"
                      placeholder="e.g., PROJ-123"
                      value={ticketInfo.ticketKey}
                      onChange={(e) => setTicketInfo((prev) => ({ ...prev, ticketKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={ticketInfo.priority}
                      onValueChange={(value) => setTicketInfo((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
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
                    placeholder="Brief description of the feature/bug"
                    value={ticketInfo.summary}
                    onChange={(e) => setTicketInfo((prev) => ({ ...prev, summary: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the ticket"
                    value={ticketInfo.description}
                    onChange={(e) => setTicketInfo((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
                  <Textarea
                    id="acceptanceCriteria"
                    placeholder="List the acceptance criteria for this ticket"
                    value={ticketInfo.acceptanceCriteria}
                    onChange={(e) => setTicketInfo((prev) => ({ ...prev, acceptanceCriteria: e.target.value }))}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Test Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Coverage Level</Label>
                  <Select
                    value={testSettings.coverageLevel}
                    onValueChange={(value) => setTestSettings((prev) => ({ ...prev, coverageLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic (3-5 test cases)</SelectItem>
                      <SelectItem value="Comprehensive">Comprehensive (6-10 test cases)</SelectItem>
                      <SelectItem value="Extensive">Extensive (11+ test cases)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Test Types</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(testSettings.testTypes).map(([type, checked]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={checked}
                          onCheckedChange={(checked) =>
                            handleTestTypeChange(type as keyof typeof testSettings.testTypes, checked as boolean)
                          }
                        />
                        <Label htmlFor={type} className="capitalize">
                          {type === "ui" ? "UI" : type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Framework</Label>
                  <Select
                    value={testSettings.framework}
                    onValueChange={(value) => setTestSettings((prev) => ({ ...prev, framework: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select testing framework" />
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

                <Button onClick={handleGenerateTests} className="w-full" size="lg" disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Test Cases"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {!generationResult ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🧪</div>
                    <p className="text-lg mb-2">No test cases generated yet</p>
                    <p className="text-sm text-muted-foreground">
                      Fill in the ticket information and click "Generate Test Cases"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Generation Summary */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Generation Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          Total Tests: <span className="font-medium">{generationResult.summary.totalTests}</span>
                        </div>
                        <div>
                          Coverage: <span className="font-medium">{generationResult.summary.coverageLevel}</span>
                        </div>
                        <div>
                          Framework: <span className="font-medium">{generationResult.summary.framework}</span>
                        </div>
                        <div>
                          Generated:{" "}
                          <span className="font-medium">
                            {new Date(generationResult.summary.generatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Cases */}
                    <div className="space-y-4">
                      {generationResult.testCases.map((testCase, index) => (
                        <Card key={testCase.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-base">{testCase.title}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getPriorityColor(testCase.priority)}>{testCase.priority}</Badge>
                                  <Badge variant="outline">{testCase.type}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">#{index + 1}</div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {testCase.preconditions && (
                              <div>
                                <h4 className="font-medium text-sm mb-1">Preconditions:</h4>
                                <p className="text-sm text-muted-foreground">{testCase.preconditions}</p>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium text-sm mb-1">Test Steps:</h4>
                              <ol className="text-sm text-muted-foreground space-y-1">
                                {testCase.steps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex">
                                    <span className="mr-2 font-medium">{stepIndex + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm mb-1">Expected Result:</h4>
                              <p className="text-sm text-muted-foreground">{testCase.expectedResult}</p>
                            </div>

                            {testCase.testData && (
                              <div>
                                <h4 className="font-medium text-sm mb-1">Test Data:</h4>
                                <p className="text-sm text-muted-foreground">{testCase.testData}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
