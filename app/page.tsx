"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, RefreshCw, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TestCase {
  id: string
  title: string
  description: string
  preconditions: string
  steps: string[]
  expectedResult: string
  priority: "Low" | "Medium" | "High" | "Critical"
  type: "Functional" | "Non-Functional" | "Integration" | "Regression" | "Smoke"
}

export default function JIRATestGenerator() {
  const [userStory, setUserStory] = useState("")
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("")
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateTestCases = async () => {
    if (!userStory.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a user story to generate test cases.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock test cases based on the user story
    const mockTestCases: TestCase[] = [
      {
        id: "TC001",
        title: "Verify successful login with valid credentials",
        description: "Test that a user can successfully log in with valid username and password",
        preconditions: "User account exists in the system",
        steps: ["Navigate to login page", "Enter valid username", "Enter valid password", "Click Login button"],
        expectedResult: "User is successfully logged in and redirected to dashboard",
        priority: "High",
        type: "Functional",
      },
      {
        id: "TC002",
        title: "Verify login failure with invalid credentials",
        description: "Test that login fails appropriately with invalid credentials",
        preconditions: "Login page is accessible",
        steps: ["Navigate to login page", "Enter invalid username", "Enter invalid password", "Click Login button"],
        expectedResult: "Error message is displayed and user remains on login page",
        priority: "High",
        type: "Functional",
      },
      {
        id: "TC003",
        title: "Verify password field masking",
        description: "Test that password field properly masks input characters",
        preconditions: "Login page is loaded",
        steps: ["Navigate to login page", "Click on password field", "Type any characters"],
        expectedResult: "Password characters are masked with dots or asterisks",
        priority: "Medium",
        type: "Functional",
      },
    ]

    setTestCases(mockTestCases)
    setIsGenerating(false)

    toast({
      title: "Test Cases Generated",
      description: `Successfully generated ${mockTestCases.length} test cases.`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "Test case has been copied to your clipboard.",
    })
  }

  const exportTestCases = () => {
    const csvContent = [
      ["ID", "Title", "Description", "Preconditions", "Steps", "Expected Result", "Priority", "Type"],
      ...testCases.map((tc) => [
        tc.id,
        tc.title,
        tc.description,
        tc.preconditions,
        tc.steps.join("; "),
        tc.expectedResult,
        tc.priority,
        tc.type,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "test-cases.csv"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Test cases have been exported to CSV file.",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Functional":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Integration":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Regression":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "Smoke":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">JIRA Test Case Generator</h1>
          <p className="text-xl text-muted-foreground">
            Transform your user stories into comprehensive test cases with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Input Requirements
              </CardTitle>
              <CardDescription>Provide your user story and acceptance criteria to generate test cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user-story">User Story *</Label>
                <Textarea
                  id="user-story"
                  placeholder="As a [user type], I want [functionality] so that [benefit]..."
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acceptance-criteria">Acceptance Criteria (Optional)</Label>
                <Textarea
                  id="acceptance-criteria"
                  placeholder="Given [context], When [action], Then [outcome]..."
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={generateTestCases}
                disabled={isGenerating || !userStory.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Test Cases...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Test Cases</CardTitle>
                  <CardDescription>
                    {testCases.length > 0
                      ? `${testCases.length} test cases generated`
                      : "Test cases will appear here after generation"}
                  </CardDescription>
                </div>
                {testCases.length > 0 && (
                  <Button onClick={exportTestCases} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {testCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No test cases generated yet.</p>
                  <p className="text-sm">Fill in the user story and click generate to get started.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {testCases.map((testCase, index) => (
                    <Card key={testCase.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{testCase.id}</Badge>
                              <Badge className={getPriorityColor(testCase.priority)}>{testCase.priority}</Badge>
                              <Badge className={getTypeColor(testCase.type)}>{testCase.type}</Badge>
                            </div>
                            <CardTitle className="text-lg">{testCase.title}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `${testCase.id}: ${testCase.title}\n\nDescription: ${testCase.description}\n\nPreconditions: ${testCase.preconditions}\n\nSteps:\n${testCase.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\nExpected Result: ${testCase.expectedResult}`,
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                          <p className="text-sm">{testCase.description}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Preconditions</h4>
                          <p className="text-sm">{testCase.preconditions}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Test Steps</h4>
                          <ol className="text-sm space-y-1">
                            {testCase.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex">
                                <span className="mr-2 text-muted-foreground">{stepIndex + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Expected Result</h4>
                          <p className="text-sm">{testCase.expectedResult}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
