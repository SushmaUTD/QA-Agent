"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToastContainer } from "@/components/ui/toast"
import {
  Search,
  Filter,
  Download,
  Play,
  BarChart3,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import type { Project } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

interface TestCase {
  id: string
  title: string
  description: string
  steps: string[]
  expectedResult: string
  priority: "high" | "medium" | "low"
  type: "functional" | "ui" | "integration" | "regression"
  projectId: string
  projectName: string
}

interface TestSession {
  id: string
  projectIds: string[]
  projectNames: string[]
  testTypes: string[]
  testCases: TestCase[]
  generatedAt: string
  totalTests: number
}

export default function JiraTestGenerator() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [testTypes, setTestTypes] = useState<string[]>(["functional"])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [generatedTests, setGeneratedTests] = useState<TestCase[]>([])
  const [testHistory, setTestHistory] = useState<TestSession[]>([])
  const [activeTab, setActiveTab] = useState("projects")

  const { toasts, removeToast, success, error, warning } = useToast()

  useEffect(() => {
    fetchProjects()
    loadTestHistory()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")
      const data = await response.json()
      if (data.success) {
        setProjects(data.data)
        success("Projects loaded successfully")
      } else {
        error("Failed to load projects", data.error)
      }
    } catch (err) {
      error("Failed to load projects", "Please check your connection and try again")
    } finally {
      setLoading(false)
    }
  }

  const loadTestHistory = () => {
    const saved = localStorage.getItem("jira-test-history")
    if (saved) {
      setTestHistory(JSON.parse(saved))
    }
  }

  const saveTestHistory = (sessions: TestSession[]) => {
    localStorage.setItem("jira-test-history", JSON.stringify(sessions))
    setTestHistory(sessions)
  }

  const generateTestCases = async () => {
    if (selectedProjects.length === 0) {
      warning("No projects selected", "Please select at least one project to generate test cases")
      return
    }

    if (testTypes.length === 0) {
      warning("No test types selected", "Please select at least one test type")
      return
    }

    try {
      setGenerating(true)
      const selectedProjectData = projects.filter((p) => selectedProjects.includes(p.id))

      // Simulate AI generation with realistic test cases
      const testCases: TestCase[] = []

      for (const project of selectedProjectData) {
        for (const testType of testTypes) {
          const casesForType = generateTestCasesForProject(project, testType as any)
          testCases.push(...casesForType)
        }
      }

      const session: TestSession = {
        id: Date.now().toString(),
        projectIds: selectedProjects,
        projectNames: selectedProjectData.map((p) => p.name),
        testTypes,
        testCases,
        generatedAt: new Date().toISOString(),
        totalTests: testCases.length,
      }

      setGeneratedTests(testCases)
      const newHistory = [session, ...testHistory]
      saveTestHistory(newHistory)

      success(
        `Generated ${testCases.length} test cases`,
        `Test cases created for ${selectedProjectData.length} projects`,
      )
      setActiveTab("analytics")
    } catch (err) {
      error("Failed to generate test cases", "Please try again")
    } finally {
      setGenerating(false)
    }
  }

  const generateTestCasesForProject = (
    project: Project,
    testType: "functional" | "ui" | "integration" | "regression",
  ): TestCase[] => {
    const baseTests = {
      functional: [
        {
          title: `Verify ${project.name} core functionality`,
          description: `Test the main features and workflows of ${project.name}`,
          steps: [
            "Navigate to the project dashboard",
            "Verify all main features are accessible",
            "Test primary user workflows",
            "Validate data processing",
          ],
          expectedResult: "All core functionality works as expected",
        },
        {
          title: `Validate ${project.name} business rules`,
          description: `Ensure business logic is correctly implemented`,
          steps: [
            "Test business rule validation",
            "Verify edge cases",
            "Check error handling",
            "Validate data constraints",
          ],
          expectedResult: "Business rules are enforced correctly",
        },
      ],
      ui: [
        {
          title: `${project.name} UI responsiveness test`,
          description: `Verify UI adapts to different screen sizes`,
          steps: ["Open application on desktop", "Resize browser window", "Test on tablet view", "Test on mobile view"],
          expectedResult: "UI is responsive across all screen sizes",
        },
        {
          title: `${project.name} accessibility compliance`,
          description: `Ensure UI meets accessibility standards`,
          steps: [
            "Run accessibility scanner",
            "Test keyboard navigation",
            "Verify screen reader compatibility",
            "Check color contrast ratios",
          ],
          expectedResult: "UI meets WCAG 2.1 AA standards",
        },
      ],
      integration: [
        {
          title: `${project.name} API integration test`,
          description: `Verify external API integrations work correctly`,
          steps: [
            "Test API connection",
            "Verify data synchronization",
            "Test error handling for API failures",
            "Validate data transformation",
          ],
          expectedResult: "All API integrations function correctly",
        },
      ],
      regression: [
        {
          title: `${project.name} regression suite`,
          description: `Ensure existing functionality still works after changes`,
          steps: [
            "Run full test suite",
            "Verify critical user paths",
            "Test previously fixed bugs",
            "Validate performance benchmarks",
          ],
          expectedResult: "No regression in existing functionality",
        },
      ],
    }

    return baseTests[testType].map((test, index) => ({
      id: `${project.id}-${testType}-${index}`,
      title: test.title,
      description: test.description,
      steps: test.steps,
      expectedResult: test.expectedResult,
      priority: project.priority,
      type: testType,
      projectId: project.id,
      projectName: project.name,
    }))
  }

  const downloadTestCases = (testCases: TestCase[], filename: string) => {
    const csvContent = [
      ["ID", "Title", "Description", "Steps", "Expected Result", "Priority", "Type", "Project"],
      ...testCases.map((tc) => [
        tc.id,
        tc.title,
        tc.description,
        tc.steps.join("; "),
        tc.expectedResult,
        tc.priority,
        tc.type,
        tc.projectName,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "on-hold":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "completed":
        return "bg-secondary text-secondary-foreground"
      case "on-hold":
        return "bg-muted text-muted-foreground"
      case "cancelled":
        return "bg-destructive text-destructive-foreground"
    }
  }

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">JIRA Test Case Generator</h1>
            <p className="text-muted-foreground mt-2">Generate comprehensive test cases for your projects using AI</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects & Generation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Results</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Project Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Project Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Projects for Test Generation</CardTitle>
                <CardDescription>
                  Choose projects to generate test cases for ({selectedProjects.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <div className="text-muted-foreground">Loading projects...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                        <Checkbox
                          id={project.id}
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjects([...selectedProjects, project.id])
                            } else {
                              setSelectedProjects(selectedProjects.filter((id) => id !== project.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{project.name}</h3>
                            <Badge className={`${getStatusColor(project.status)} flex items-center gap-1`}>
                              {getStatusIcon(project.status)}
                              {project.status.replace("-", " ")}
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(project.startDate).toLocaleDateString()} -{" "}
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Ongoing"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredProjects.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No projects found. Try adjusting your filters.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>Configure the types of test cases to generate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Types</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: "functional", label: "Functional Tests" },
                        { value: "ui", label: "UI Tests" },
                        { value: "integration", label: "Integration Tests" },
                        { value: "regression", label: "Regression Tests" },
                      ].map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={type.value}
                            checked={testTypes.includes(type.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTestTypes([...testTypes, type.value])
                              } else {
                                setTestTypes(testTypes.filter((t) => t !== type.value))
                              }
                            }}
                          />
                          <label htmlFor={type.value} className="text-sm">
                            {type.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateTestCases}
                    disabled={generating || selectedProjects.length === 0}
                    className="w-full"
                  >
                    {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Play className="mr-2 h-4 w-4" />
                    Generate Test Cases
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Test Generation Results
                  </CardTitle>
                  <CardDescription>
                    {generatedTests.length > 0
                      ? `${generatedTests.length} test cases generated`
                      : "No test cases generated yet"}
                  </CardDescription>
                </div>
                {generatedTests.length > 0 && (
                  <Button onClick={() => downloadTestCases(generatedTests, "test-cases.csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {generatedTests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{generatedTests.length}</div>
                          <div className="text-sm text-muted-foreground">Total Test Cases</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {new Set(generatedTests.map((t) => t.projectId)).size}
                          </div>
                          <div className="text-sm text-muted-foreground">Projects Covered</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{new Set(generatedTests.map((t) => t.type)).size}</div>
                          <div className="text-sm text-muted-foreground">Test Types</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {generatedTests.filter((t) => t.priority === "high").length}
                          </div>
                          <div className="text-sm text-muted-foreground">High Priority</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Steps</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedTests.slice(0, 10).map((testCase) => (
                          <TableRow key={testCase.id}>
                            <TableCell className="font-medium">{testCase.title}</TableCell>
                            <TableCell>{testCase.projectName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{testCase.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(testCase.priority)}>{testCase.priority}</Badge>
                            </TableCell>
                            <TableCell>{testCase.steps.length} steps</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {generatedTests.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Showing 10 of {generatedTests.length} test cases. Download CSV for complete list.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No test cases generated yet. Go to Projects & Generation tab to create test cases.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Test Generation History
                </CardTitle>
                <CardDescription>View and download previous test generation sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {testHistory.length > 0 ? (
                  <div className="space-y-4">
                    {testHistory.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">
                                {session.projectNames.join(", ")} - {session.totalTests} test cases
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Generated on {new Date(session.generatedAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Test types: {session.testTypes.join(", ")}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => downloadTestCases(session.testCases, `test-cases-${session.id}.csv`)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No test generation history yet. Generate some test cases to see them here.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
