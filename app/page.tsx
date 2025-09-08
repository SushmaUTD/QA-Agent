"use client"

import { useState, useMemo } from "react"
// import {
//   Search,
//   Filter,
//   Download,
//   RefreshCw,
//   Settings,
//   BarChart3,
//   FileText,
//   History,
//   Zap,
//   CheckCircle,
//   Bot,
//   TestTube,
//   Brain,
//   ExternalLink,
//   SuperscriptIcon as AlertDescription,
//   Sliders as Slider,
//   AlertCircle,
//   ChevronDown,
//   ListOrdered,
//   Code,
// } from "lucide-react"

// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface GitHubPullRequest {
  id: string
  number: number
  title: string
  description: string
  status: string
  author: string
  reviewers: string[]
  files: GitHubFile[]
  commits: GitHubCommit[]
  created: string
  updated: string
  branch: string
  baseBranch: string
}

interface GitHubFile {
  filename: string
  status: "added" | "modified" | "removed"
  additions: number
  deletions: number
  changes: number
  patch?: string
}

interface GitHubCommit {
  sha: string
  message: string
  author: string
  date: string
}

interface GitHubConfig {
  token: string
  repository: string
  organization: string
  webhookUrl?: string
}

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
  type: "Functional" | "UI" | "Integration" | "Edge Case" | "Performance" | "Security"
  preconditions: string[]
  steps: string[]
  expectedResults: string
  testData: string
}

interface TestGenerationResult {
  ticket?: JiraTicket
  pullRequest?: GitHubPullRequest // Added GitHub PR support to test results
  testCases: TestCase[]
  metadata: {
    ticketKey?: string
    prNumber?: number // Added PR number to metadata
    generatedAt: string
    settings: any
    totalTests: number
    source: "jira" | "github" // Added source tracking
  }
}

interface AIConfig {
  testTypes: string[]
  coverageLevel: number
  includeEdgeCases: boolean
  includeNegativeTests: boolean
  includePerformanceTests: boolean
  includeSecurityTests: boolean
  framework: string
  coverage: string
}

interface CIPipelineRun {
  id: string
  testSuiteId: string
  status: "pending" | "running" | "success" | "failed" | "cancelled"
  startedAt: string
  completedAt?: string
  results?: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    failedTests: Array<{
      name: string
      error: string
      screenshot?: string
    }>
  }
  logs: string[]
  prNumber?: number
  commitSha?: string
}

interface CIConfig {
  provider: "github-actions" | "jenkins" | "gitlab-ci" | "custom"
  webhookUrl: string
  apiKey: string
  environment: string
  timeout: number
  parallelJobs: number
  notifications: {
    slack?: string
    email?: string[]
    prComments: boolean
  }
}

interface PRComment {
  id: string
  prNumber: number
  author: string
  body: string
  createdAt: string
  testResults?: {
    total: number
    passed: number
    failed: number
    duration: number
    status: "success" | "failed"
    failedTests: Array<{
      name: string
      error: string
    }>
  }
}

interface PRReport {
  id: string
  prNumber: number
  prTitle: string
  testSuiteId: string
  status: "pending" | "success" | "failed"
  createdAt: string
  results: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    coverage: number
    missingTests: string[]
  }
  comments: PRComment[]
}

export default function JiraTestGenerator() {
  const [activeView, setActiveView] = useState("generator")

  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    email: "",
    apiToken: "",
    project: "",
  })

  const [appConfig, setAppConfig] = useState({
    applicationUrl: "https://your-app.com",
    loginUsername: "testuser@company.com",
    loginPassword: "test123",
    environment: "staging",
  })

  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    token: "",
    repository: "",
    organization: "",
    webhookUrl: "",
  })

  const [isGithubConnected, setIsGithubConnected] = useState(false)
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([])
  const [selectedPR, setSelectedPR] = useState<GitHubPullRequest | null>(null)
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)

  const [isConnected, setIsConnected] = useState(false)
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const [integrationMode, setIntegrationMode] = useState<"jira" | "github">("jira")

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    search: "",
  })

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    testTypes: ["Functional", "UI", "Edge Case"],
    coverageLevel: 75,
    includeEdgeCases: true,
    includeNegativeTests: true,
    includePerformanceTests: false,
    includeSecurityTests: false,
    framework: "generic",
    coverage: "comprehensive",
  })

  const [testHistory, setTestHistory] = useState<
    Array<{
      id: string
      ticketKey: string
      ticketSummary: string
      testsGenerated: number
      timestamp: Date
      testTypes: string[]
      priority: string
    }>
  >([])

  const [ciConfig, setCiConfig] = useState<CIConfig>({
    provider: "github-actions",
    webhookUrl: "",
    apiKey: "",
    environment: "staging",
    timeout: 30,
    parallelJobs: 2,
    notifications: {
      prComments: true,
    },
  })

  const [pipelineRuns, setPipelineRuns] = useState<CIPipelineRun[]>([])
  const [isExecutingTests, setIsExecutingTests] = useState(false)

  const [prReports, setPrReports] = useState<PRReport[]>([])
  const [prComments, setPrComments] = useState<PRComment[]>([])
  const [isPostingComment, setIsPostingComment] = useState(false)

  const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )

  const FilterIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
    </svg>
  )

  const DownloadIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  const RefreshIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  )

  const SettingsIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )

  const BarChartIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )

  const FileIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  )

  const HistoryIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )

  const ZapIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  )

  const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  )

  const BotIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )

  const TestTubeIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14.5 2h-5L7 8v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-2.5-6z" />
      <line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  )

  const BrainIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  )

  const ExternalLinkIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )

  const AlertIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )

  const ChevronDownIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )

  const ListIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )

  const CodeIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="16,18 22,12 16,6" />
      <polyline points="8,6 2,12 8,18" />
    </svg>
  )

  const InfoIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )

  const ClockIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

  const mockTickets: JiraTicket[] = useMemo(
    () => [
      {
        id: "1",
        key: "PROJ-123",
        summary: "User Login Authentication",
        description: "Implement secure user login with email and password validation",
        status: "QA",
        acceptanceCriteria: [
          "User can login with valid email and password",
          "Invalid credentials show appropriate error message",
          "Account lockout after 3 failed attempts",
          "Password reset functionality works",
        ],
        assignee: "john.doe@company.com",
        priority: "High",
        updated: "2024-01-20",
      },
      {
        id: "2",
        key: "PROJ-124",
        summary: "Shopping Cart Functionality",
        description: "Users should be able to add, remove, and modify items in shopping cart",
        status: "QA",
        acceptanceCriteria: [
          "Add items to cart from product page",
          "Update quantity of items in cart",
          "Remove items from cart",
          "Cart persists across sessions",
          "Calculate total price correctly",
        ],
        assignee: "jane.smith@company.com",
        priority: "Medium",
        updated: "2024-01-22",
      },
      {
        id: "3",
        key: "PROJ-125",
        summary: "Payment Processing Integration",
        description: "Integrate Stripe payment processing for checkout flow",
        status: "Ready for QA",
        acceptanceCriteria: [
          "Process credit card payments securely",
          "Handle payment failures gracefully",
          "Send confirmation emails after successful payment",
          "Send confirmation emails after successful payment",
          "Support multiple currencies",
        ],
        assignee: "mike.wilson@company.com",
        priority: "High",
        updated: "2024-01-25",
      },
      {
        id: "4",
        key: "PROJ-126",
        summary: "User Profile Management",
        description: "Allow users to update their profile information and preferences",
        status: "QA",
        acceptanceCriteria: [
          "Users can edit personal information",
          "Profile picture upload functionality",
          "Email notification preferences",
          "Account deletion option",
        ],
        assignee: "sarah.johnson@company.com",
        priority: "Low",
        updated: "2024-01-28",
      },
      {
        id: "5",
        key: "PROJ-127",
        summary: "Search and Filter Products",
        description: "Implement product search with advanced filtering options",
        status: "In Review",
        acceptanceCriteria: [
          "Search products by name and description",
          "Filter by category, price range, and ratings",
          "Sort results by relevance, price, and popularity",
          "Save search preferences",
        ],
        assignee: "john.doe@company.com",
        priority: "Medium",
        updated: "2024-01-30",
      },
    ],
    [],
  )

  const filteredTickets = useMemo(() => {
    let result = [...mockTickets]

    if (searchTerm) {
      result = result.filter(
        (ticket) =>
          ticket.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter) {
      result = result.filter((ticket) => ticket.status === statusFilter)
    }

    if (priorityFilter) {
      result = result.filter((ticket) => ticket.priority === priorityFilter)
    }

    return result
  }, [mockTickets, searchTerm, statusFilter, priorityFilter])

  const toggleTicketSelection = (ticketKey: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketKey) ? prev.filter((key) => key !== ticketKey) : [...prev, ticketKey],
    )
  }

  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setPriorityFilter("")
  }

  const handleJiraConnect = async () => {
    setIsConnecting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsConnected(true)
    setIsConnecting(false)
  }

  const connectToGithub = async () => {
    setIsConnectingGithub(true)
    try {
      // Simulate GitHub API connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock GitHub PRs for demo
      const mockPRs: GitHubPullRequest[] = [
        {
          id: "1",
          number: 123,
          title: "Add user authentication system",
          description:
            "This PR implements a complete user authentication system with login, registration, and password reset functionality.",
          status: "open",
          author: "john.doe",
          reviewers: ["jane.smith", "mike.wilson"],
          files: [
            { filename: "src/auth/login.tsx", status: "added", additions: 45, deletions: 0, changes: 45 },
            { filename: "src/auth/register.tsx", status: "added", additions: 38, deletions: 0, changes: 38 },
            { filename: "src/utils/auth.ts", status: "modified", additions: 12, deletions: 3, changes: 15 },
          ],
          commits: [
            { sha: "abc123", message: "Add login component", author: "john.doe", date: "2024-01-20" },
            { sha: "def456", message: "Add registration form", author: "john.doe", date: "2024-01-21" },
          ],
          created: "2024-01-20",
          updated: "2024-01-21",
          branch: "feature/auth-system",
          baseBranch: "main",
        },
        {
          id: "2",
          number: 124,
          title: "Implement shopping cart functionality",
          description: "Added shopping cart with add/remove items, quantity updates, and persistent storage.",
          status: "open",
          author: "jane.smith",
          reviewers: ["john.doe"],
          files: [
            { filename: "src/components/Cart.tsx", status: "added", additions: 67, deletions: 0, changes: 67 },
            { filename: "src/hooks/useCart.ts", status: "added", additions: 34, deletions: 0, changes: 34 },
            { filename: "src/pages/checkout.tsx", status: "modified", additions: 23, deletions: 8, changes: 31 },
          ],
          commits: [
            { sha: "ghi789", message: "Add cart component", author: "jane.smith", date: "2024-01-22" },
            { sha: "jkl012", message: "Add cart persistence", author: "jane.smith", date: "2024-01-23" },
          ],
          created: "2024-01-22",
          updated: "2024-01-23",
          branch: "feature/shopping-cart",
          baseBranch: "main",
        },
      ]

      setPullRequests(mockPRs)
      setIsGithubConnected(true)
    } catch (error) {
      console.error("Failed to connect to GitHub:", error)
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const executeTestsInCI = async (testSuite: TestGenerationResult) => {
    setIsExecutingTests(true)

    try {
      const response = await fetch("/api/execute-tests-ci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testSuite,
          ciConfig,
          appConfig,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newRun: CIPipelineRun = {
          id: result.runId,
          testSuiteId: testSuite.metadata.ticketKey || `pr-${testSuite.metadata.prNumber}`,
          status: "pending",
          startedAt: new Date().toISOString(),
          logs: ["Pipeline started..."],
          prNumber: testSuite.metadata.prNumber,
          commitSha: result.commitSha,
        }

        setPipelineRuns((prev) => [newRun, ...prev])

        // Poll for updates
        pollPipelineStatus(result.runId)
      }
    } catch (error) {
      console.error("Failed to execute tests in CI:", error)
    } finally {
      setIsExecutingTests(false)
    }
  }

  const pollPipelineStatus = async (runId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/pipeline-status/${runId}`)
        const status = await response.json()

        setPipelineRuns((prev) => prev.map((run) => (run.id === runId ? { ...run, ...status } : run)))

        if (status.status === "running" || status.status === "pending") {
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error) {
        console.error("Failed to poll pipeline status:", error)
      }
    }

    poll()
  }

  const generateTestCases = async () => {
    if (integrationMode === "jira" && selectedTickets.length === 0) {
      alert("Please select at least one ticket to generate test cases.")
      return
    }

    if (integrationMode === "github" && !selectedPR) {
      alert("Please select a pull request to generate test cases.")
      return
    }

    setIsGenerating(true)

    try {
      const results: TestGenerationResult[] = []

      if (integrationMode === "jira") {
        // Existing JIRA test generation logic
        for (const ticketId of selectedTickets) {
          const ticket = mockTickets.find((t) => t.id === ticketId)
          if (!ticket) continue

          const response = await fetch("/api/generate-tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticket,
              settings: aiConfig,
              appConfig,
            }),
          })

          const data = await response.json()
          results.push({
            ticket,
            testCases: data.testCases,
            metadata: {
              ticketKey: ticket.key,
              generatedAt: new Date().toISOString(),
              settings: aiConfig,
              totalTests: data.testCases.length,
              source: "jira",
            },
          })
        }
      } else if (integrationMode === "github" && selectedPR) {
        // New GitHub PR test generation
        const response = await fetch("/api/generate-tests-github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pullRequest: selectedPR,
            settings: aiConfig,
            appConfig,
          }),
        })

        const data = await response.json()
        results.push({
          pullRequest: selectedPR,
          testCases: data.testCases,
          metadata: {
            prNumber: selectedPR.number,
            generatedAt: new Date().toISOString(),
            settings: aiConfig,
            totalTests: data.testCases.length,
            source: "github",
          },
        })
      }

      setGeneratedTests(results)

      const historyEntry = {
        id: Date.now().toString(),
        ticketKey:
          integrationMode === "jira"
            ? selectedTickets.map((id) => mockTickets.find((t) => t.id === id)?.key).join(", ")
            : undefined,
        prNumber: integrationMode === "github" ? selectedPR?.number : undefined,
        ticketSummary: integrationMode === "jira" ? `${selectedTickets.length} JIRA tickets` : selectedPR?.title || "",
        testCount: results.reduce((sum, r) => sum + r.testCases.length, 0),
        generatedAt: new Date().toISOString(),
        settings: aiConfig,
        results,
        source: integrationMode,
      }

      setTestHistory((prev) => [historyEntry, ...prev])
    } catch (error) {
      console.error("Test generation error:", error)
      alert("Failed to generate test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateTestCases = async (ticketKey: string) => {
    const ticket = mockTickets.find((t) => t.key === ticketKey)
    if (!ticket) return

    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket,
          settings: {
            coverageLevel: aiConfig.coverageLevel,
            testTypes: aiConfig.testTypes,
            framework: aiConfig.framework,
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedTests((prev) =>
          prev.map((result) =>
            result.ticket.key === ticketKey ? { ticket, testCases: data.testCases, metadata: data.metadata } : result,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to regenerate test cases:", error)
    }
  }

  const exportTestCases = async (result: any) => {
    const testData = {
      ticket: result.ticket,
      testCases: result.testCases,
      generatedAt: new Date().toISOString(),
      framework: "generic",
    }

    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.ticket.key}_test_cases.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [testResults, setTestResults] = useState<any>({})

  const postResultsToPR = async (prNumber: number, testResults: any) => {
    setIsPostingComment(true)

    try {
      const response = await fetch("/api/post-pr-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prNumber,
          testResults,
          githubConfig,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newComment: PRComment = {
          id: result.commentId,
          prNumber,
          author: "jira-test-ai[bot]",
          body: result.commentBody,
          createdAt: new Date().toISOString(),
          testResults,
        }

        setPrComments((prev) => [newComment, ...prev])

        // Update PR report
        const newReport: PRReport = {
          id: `report-${Date.now()}`,
          prNumber,
          prTitle: selectedPR?.title || `PR #${prNumber}`,
          testSuiteId: testResults.suiteId,
          status: testResults.status,
          createdAt: new Date().toISOString(),
          results: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            skipped: testResults.skipped || 0,
            duration: testResults.duration,
            coverage: Math.round((testResults.passed / testResults.total) * 100),
            missingTests: testResults.missingTests || [],
          },
          comments: [newComment],
        }

        setPrReports((prev) => [newReport, ...prev])
      }
    } catch (error) {
      console.error("Failed to post PR comment:", error)
    } finally {
      setIsPostingComment(false)
    }
  }

  const exportAllTests = async (framework: string) => {
    if (generatedTests.length === 0) {
      alert("No test cases generated yet. Please generate some test cases first.")
      return
    }

    let content = ""
    let filename = ""

    if (framework === "selenium") {
      // Generate Selenium WebDriver Java code
      content = generateSeleniumCode(generatedTests)
      filename = "selenium_test_suite.java"
    } else if (framework === "cypress") {
      // Generate Cypress JavaScript code
      content = generateCypressCode(generatedTests)
      filename = "cypress_test_suite.cy.js"
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function generateSeleniumCode(tests: TestGenerationResult[]): string {
    const allTests = tests.flatMap((result) => result.testCases)

    return `package com.company.tests;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

/**
 * Generated Test Suite for JIRA Tickets
 * Generated on: ${new Date().toISOString()}
 * Application URL: ${appConfig.applicationUrl}
 * Environment: ${appConfig.environment}
 */
public class GeneratedTestSuite {
    
    private WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "${appConfig.applicationUrl}";
    private static final String TEST_USERNAME = "${appConfig.loginUsername}";
    private static final String TEST_PASSWORD = "${appConfig.loginPassword}";
    
    @BeforeEach
    void setUp() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
        driver.get(BASE_URL);
        performLogin();
    }
    
    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
    
    private void performLogin() {
        try {
            WebElement usernameField = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.xpath("//input[@type='email' or @name='username' or @id='username']")));
            WebElement passwordField = driver.findElement(
                By.xpath("//input[@type='password' or @name='password' or @id='password']"));
            WebElement loginButton = driver.findElement(
                By.xpath("//button[contains(text(), 'Login') or contains(text(), 'Sign In')]"));
            
            usernameField.clear();
            usernameField.sendKeys(TEST_USERNAME);
            passwordField.clear();
            passwordField.sendKeys(TEST_PASSWORD);
            loginButton.click();
            
            // Wait for login to complete
            wait.until(ExpectedConditions.urlContains("dashboard"));
        } catch (Exception e) {
            System.out.println("Login not required or different login flow");
        }
    }

${allTests
  .map(
    (test, index) => `    
    @Test
    @DisplayName("${test.title}")
    void test${index + 1}_${test.title.replace(/[^a-zA-Z0-9]/g, "")}() {
        // Test Priority: ${test.priority}
        // Test Type: ${test.type}
        
        // Preconditions
${test.preconditions.map((pre) => `        // ${pre}`).join("\n")}
        
        try {
${test.steps
  .map((step, stepIndex) => {
    const action = step.toLowerCase()
    if (action.includes("click")) {
      const element = step.match(/click (?:on )?(.+)/i)?.[1] || "element"
      return `            // Step ${stepIndex + 1}: ${step}
            WebElement ${element.replace(/[^a-zA-Z0-9]/g, "")}Element = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//*[contains(text(), '${element}') or @aria-label='${element}']")));
            ${element.replace(/[^a-zA-Z0-9]/g, "")}Element.click();`
    } else if (action.includes("enter") || action.includes("input") || action.includes("type")) {
      const match = step.match(/(?:enter|input|type) "(.+)"/i)
      const value = match?.[1] || "test value"
      return `            // Step ${stepIndex + 1}: ${step}
            WebElement inputField = driver.findElement(By.xpath("//input[@type='text' or @type='email']"));
            inputField.clear();
            inputField.sendKeys("${value}");`
    } else if (action.includes("verify") || action.includes("check") || action.includes("assert")) {
      const element = step.match(/(?:verify|check|assert) (.+)/i)?.[1] || "element"
      return `            // Step ${stepIndex + 1}: ${step}
            WebElement verifyElement = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.xpath("//*[contains(text(), '${element}')]")));
            Assertions.assertTrue(verifyElement.isDisplayed(), "${step}");`
    } else if (action.includes("navigate") || action.includes("go to")) {
      const url = step.match(/(?:navigate to|go to) (.+)/i)?.[1] || "/page"
      return `            // Step ${stepIndex + 1}: ${step}
            driver.get(BASE_URL + "${url}");`
    } else {
      return `            // Step ${stepIndex + 1}: ${step}
            // TODO: Implement specific action for: ${step}`
    }
  })
  .join("\n")}
            
            // Expected Result: ${test.expectedResults}
            // TODO: Add specific assertions for expected results
            
        } catch (Exception e) {
            Assertions.fail("Test failed: " + e.getMessage());
        }
    }`,
  )
  .join("\n")}
}`
  }

  function generateCypressCode(tests: TestGenerationResult[]): string {
    const allTests = tests.flatMap((result) => result.testCases)

    return `/**
 * Generated Cypress Test Suite for JIRA Tickets
 * Generated on: ${new Date().toISOString()}
 * Application URL: ${appConfig.applicationUrl}
 * Environment: ${appConfig.environment}
 */

describe('Generated Test Suite', () => {
  const BASE_URL = '${appConfig.applicationUrl}';
  const TEST_USERNAME = '${appConfig.loginUsername}';
  const TEST_PASSWORD = '${appConfig.loginPassword}';

  beforeEach(() => {
    cy.visit(BASE_URL);
    cy.performLogin();
  });

  // Custom command for login
  Cypress.Commands.add('performLogin', () => {
    cy.get('body').then(($body) => {
      if ($body.find('input[type="email"], input[name="username"], input[id="username"]').length > 0) {
        cy.get('input[type="email"], input[name="username"], input[id="username"]').first().type(TEST_USERNAME);
        cy.get('input[type="password"], input[name="password"], input[id="password"]').first().type(TEST_PASSWORD);
        cy.get('button').contains(/Login|Sign In/i).click();
        cy.url().should('include', 'dashboard');
      }
    });
  });

${allTests
  .map(
    (test, index) => `  
  it('${test.title} (${test.priority} Priority)', () => {
    // Test Type: ${test.type}
    
    // Preconditions
${test.preconditions.map((pre) => `    // ${pre}`).join("\n")}
    
${test.steps
  .map((step, stepIndex) => {
    const action = step.toLowerCase()
    if (action.includes("click")) {
      const element = step.match(/click (?:on )?(.+)/i)?.[1] || "element"
      return `    // Step ${stepIndex + 1}: ${step}
    cy.contains('${element}').click();`
    } else if (action.includes("enter") || action.includes("input") || action.includes("type")) {
      const match = step.match(/(?:enter|input|type) "(.+)"/i)
      const value = match?.[1] || "test value"
      return `    // Step ${stepIndex + 1}: ${step}
    cy.get('input[type="text"], input[type="email"]').first().type('${value}');`
    } else if (action.includes("verify") || action.includes("check") || action.includes("assert")) {
      const element = step.match(/(?:verify|check|assert) (.+)/i)?.[1] || "element"
      return `    // Step ${stepIndex + 1}: ${step}
    cy.contains('${element}').should('be.visible');`
    } else if (action.includes("navigate") || action.includes("go to")) {
      const url = step.match(/(?:navigate to|go to) (.+)/i)?.[1] || "/page"
      return `    // Step ${stepIndex + 1}: ${step}
    cy.visit(BASE_URL + '${url}');`
    } else {
      return `    // Step ${stepIndex + 1}: ${step}
    // TODO: Implement specific action for: ${step}`
    }
  })
  .join("\n")}
    
    // Expected Result: ${test.expectedResults}
    // TODO: Add specific assertions for expected results
  });`,
  )
  .join("\n")}
});

// Add this to cypress/support/commands.js
declare global {
  namespace Cypress {
    interface Chainable {
      performLogin(): Chainable<void>
    }
  }
}`
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">JIRA Test AI</h1>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveView("generator")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "generator"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Test Generator
              </div>
            </button>

            <button
              onClick={() => setActiveView("tickets")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "tickets"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Tickets
              </div>
            </button>

            <button
              onClick={() => setActiveView("analytics")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "analytics"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Analytics
              </div>
            </button>

            <button
              onClick={() => setActiveView("history")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "history"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                History
              </div>
            </button>

            <button
              onClick={() => setActiveView("settings")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "settings"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Settings
              </div>
            </button>

            <button
              onClick={() => setActiveView("reports")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === "reports"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                PR Reports
              </div>
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeView === "generator" && "Test Generator"}
                {activeView === "tickets" && "JIRA Tickets"}
                {activeView === "analytics" && "Analytics & Results"}
                {activeView === "history" && "Generation History"}
                {activeView === "settings" && "Application Settings"}
                {activeView === "reports" && "PR Reports & Comments"}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeView === "generator" && "Generate AI-powered test cases from JIRA tickets"}
                {activeView === "tickets" && "View and filter JIRA tickets in QA status"}
                {activeView === "analytics" && "View test case analytics and export options"}
                {activeView === "history" && "View previous test generation sessions"}
                {activeView === "settings" && "Configure application settings for test generation"}
                {activeView === "reports" && "View PR test results, comments, and reporting dashboard"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeView === "generator" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Integration Source</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIntegrationMode("jira")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      integrationMode === "jira"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    JIRA Tickets
                  </button>
                  <button
                    onClick={() => setIntegrationMode("github")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      integrationMode === "github"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    GitHub Pull Requests
                  </button>
                </div>
              </div>

              {integrationMode === "jira" && (
                <>
                  {/* Existing JIRA Connection Section */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ZapIcon />
                      JIRA Connection
                    </h2>

                    {!isConnected ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">JIRA URL</label>
                            <input
                              type="url"
                              placeholder="https://your-company.atlassian.net"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={jiraConfig.url}
                              onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Project Key</label>
                            <input
                              type="text"
                              placeholder="PROJ"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={jiraConfig.project}
                              onChange={(e) => setJiraConfig({ ...jiraConfig, project: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                              type="email"
                              placeholder="your.email@company.com"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={jiraConfig.email}
                              onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">API Token</label>
                            <input
                              type="password"
                              placeholder="Your JIRA API token"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={jiraConfig.apiToken}
                              onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleJiraConnect}
                          disabled={isConnecting}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isConnecting ? <RefreshIcon /> : <ZapIcon />}
                          {isConnecting ? "Connecting..." : "Connect to JIRA"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckIcon />
                        <span>Connected to JIRA successfully</span>
                      </div>
                    )}
                  </div>

                  {/* Ticket Selection Section */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileIcon />
                      QA Tickets ({filteredTickets.length})
                    </h2>

                    {/* Search and Filters */}
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <SearchIcon />
                            <input
                              type="text"
                              placeholder="Search tickets..."
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="">All Status</option>
                            <option value="QA">QA</option>
                            <option value="Ready for QA">Ready for QA</option>
                            <option value="In Review">In Review</option>
                          </select>
                          <select
                            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                          >
                            <option value="">All Priority</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <button
                            onClick={resetFilters}
                            className="px-3 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-1"
                          >
                            <RefreshIcon />
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tickets List */}
                    <div className="space-y-3">
                      {filteredTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTickets.includes(ticket.key)
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => toggleTicketSelection(ticket.key)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{ticket.key}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    ticket.priority === "High"
                                      ? "bg-slate-200 text-slate-800"
                                      : ticket.priority === "Medium"
                                        ? "bg-slate-100 text-slate-700"
                                        : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {ticket.priority}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  {ticket.status}
                                </span>
                              </div>
                              <h3 className="font-medium text-slate-900 mb-1">{ticket.summary}</h3>
                              <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                              <div className="text-xs text-slate-500">
                                Assignee: {ticket.assignee} • Updated: {ticket.updated}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.key)}
                              onChange={() => toggleTicketSelection(ticket.key)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Generate Button */}
                    <div className="mt-6 flex justify-between items-center">
                      <span className="text-sm text-slate-600">{selectedTickets.length} ticket(s) selected</span>
                      <div className="relative">
                        <button
                          onClick={generateTestCases}
                          disabled={selectedTickets.length === 0 || isGenerating}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          title="View generated test cases in Analytics tab"
                        >
                          {isGenerating ? <RefreshIcon /> : <BrainIcon />}
                          {isGenerating ? "Generating..." : "Generate Test Cases"}
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                          View generated test cases in Analytics tab
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {integrationMode === "github" && (
                <>
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 1.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      GitHub Connection
                    </h2>

                    {!isGithubConnected ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Token</label>
                            <input
                              type="password"
                              value={githubConfig.token}
                              onChange={(e) => setGithubConfig((prev) => ({ ...prev, token: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ghp_xxxxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                            <input
                              type="text"
                              value={githubConfig.organization}
                              onChange={(e) => setGithubConfig((prev) => ({ ...prev, organization: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="your-org"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Repository</label>
                            <input
                              type="text"
                              value={githubConfig.repository}
                              onChange={(e) => setGithubConfig((prev) => ({ ...prev, repository: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="your-repo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Webhook URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={githubConfig.webhookUrl}
                              onChange={(e) => setGithubConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://your-ci.com/webhook"
                            />
                          </div>
                        </div>
                        <button
                          onClick={connectToGithub}
                          disabled={
                            isConnectingGithub ||
                            !githubConfig.token ||
                            !githubConfig.organization ||
                            !githubConfig.repository
                          }
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isConnectingGithub ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Connecting...
                            </>
                          ) : (
                            "Connect to GitHub"
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-800 font-medium">
                            Connected to {githubConfig.organization}/{githubConfig.repository}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsGithubConnected(false)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>

                  {isGithubConnected && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <h2 className="text-lg font-semibold mb-4">Select Pull Request</h2>
                      <div className="space-y-3">
                        {pullRequests.map((pr) => (
                          <div
                            key={pr.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedPR?.id === pr.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedPR(pr)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  #{pr.number}: {pr.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{pr.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>By {pr.author}</span>
                                  <span>{pr.files.length} files changed</span>
                                  <span>{pr.commits.length} commits</span>
                                  <span>Updated {pr.updated}</span>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  pr.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {pr.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* AI Configuration */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BrainIcon />
                  AI Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Test Types</label>
                    <div className="space-y-2">
                      {["Functional", "UI", "Integration", "Edge Case", "Performance", "Security"].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={aiConfig.testTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAiConfig({ ...aiConfig, testTypes: [...aiConfig.testTypes, type] })
                              } else {
                                setAiConfig({ ...aiConfig, testTypes: aiConfig.testTypes.filter((t) => t !== type) })
                              }
                            }}
                            className="mr-2"
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Coverage Level: {aiConfig.coverageLevel}%</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      step="25"
                      value={aiConfig.coverageLevel}
                      onChange={(e) => setAiConfig({ ...aiConfig, coverageLevel: Number.parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Basic</span>
                      <span>Standard</span>
                      <span>Comprehensive</span>
                      <span>Extensive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TestTubeIcon />
                    Generated Test Cases ({generatedTests.length} tickets)
                  </h2>

                  <div className="space-y-4">
                    {generatedTests.map((result) => (
                      <div
                        key={result.ticket?.key || result.pullRequest?.number}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded mr-2">
                              {result.ticket?.key || `#${result.pullRequest?.number}`}
                            </span>
                            <span className="font-medium">{result.ticket?.summary || result.pullRequest?.title}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => regenerateTestCases(result.ticket?.key || "")}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                            >
                              <RefreshIcon />
                              Regenerate
                            </button>
                            <button
                              onClick={() => exportTestCases(result)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                            >
                              <DownloadIcon />
                              Export
                            </button>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600 mb-3">
                          {result.testCases.length} test cases generated • {result.metadata.generatedAt}
                        </div>

                        <div className="space-y-2">
                          {result.testCases.slice(0, 3).map((testCase) => (
                            <div key={testCase.id} className="bg-slate-50 p-3 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{testCase.title}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    testCase.priority === "High"
                                      ? "bg-slate-200 text-slate-800"
                                      : testCase.priority === "Medium"
                                        ? "bg-slate-100 text-slate-700"
                                        : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {testCase.priority}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600">
                                {testCase.steps.length} steps • {testCase.type}
                              </div>
                            </div>
                          ))}
                          {result.testCases.length > 3 && (
                            <div className="text-sm text-slate-500 text-center py-2">
                              +{result.testCases.length - 3} more test cases
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Export All Section */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h3 className="font-medium mb-3">Export Test Suite</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CodeIcon />
                          <span className="font-medium">Selenium (Java)</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          Export as ready-to-run Selenium WebDriver test suite
                        </p>
                        <button
                          onClick={() => exportAllTests("selenium")}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <DownloadIcon />
                          Export Selenium Suite
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CodeIcon />
                          <span className="font-medium">Cypress (JavaScript)</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">Export as ready-to-run Cypress test suite</p>
                        <button
                          onClick={() => exportAllTests("cypress")}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <DownloadIcon />
                          Export Cypress Suite
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 opacity-50">
                        <div className="flex items-center gap-2 mb-2">
                          <CodeIcon />
                          <span className="font-medium">Playwright (Available in Download)</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          Playwright export available when you download the project locally
                        </p>
                        <button
                          disabled
                          className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <DownloadIcon />
                          Available Locally Only
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "settings" && (
            <div className="space-y-6">
              {/* Application Configuration section */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Application URL</label>
                      <input
                        type="url"
                        placeholder="https://your-app.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={appConfig.applicationUrl}
                        onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Environment</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={appConfig.environment}
                        onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                      >
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                        <option value="development">Development</option>
                        <option value="qa">QA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Test Username/Email</label>
                      <input
                        type="text"
                        placeholder="https://your-app.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={appConfig.loginUsername}
                        onChange={(e) => setAppConfig({ ...appConfig, loginUsername: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Test Password</label>
                      <input
                        type="password"
                        placeholder="test123"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={appConfig.loginPassword}
                        onChange={(e) => setAppConfig({ ...appConfig, loginPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <InfoIcon />
                      <span className="font-medium">Configuration Usage</span>
                    </div>
                    <p className="text-blue-700 mt-1">
                      These settings will be used in the exported Selenium and Cypress test code to make them
                      ready-to-run for your specific application.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Default AI Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Coverage</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
                        <option>Comprehensive</option>
                        <option>Basic</option>
                        <option>Extensive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Framework</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
                        <option>Generic</option>
                        <option>Selenium</option>
                        <option>Cypress</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Auto-Export</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
                        <option>Disabled</option>
                        <option>JSON</option>
                        <option>Framework Specific</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "tickets" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileIcon />
                    All JIRA Tickets ({filteredTickets.length})
                  </h2>
                  <div className="text-sm text-slate-600">{selectedTickets.length} selected</div>
                </div>

                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <SearchIcon />
                        <input
                          type="text"
                          placeholder="Search tickets..."
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="QA">QA</option>
                        <option value="Ready for QA">Ready for QA</option>
                        <option value="In Review">In Review</option>
                      </select>
                      <select
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="">All Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <button
                        onClick={resetFilters}
                        className="px-3 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-1"
                      >
                        <RefreshIcon />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tickets List */}
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTickets.includes(ticket.key)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => toggleTicketSelection(ticket.key)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{ticket.key}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                ticket.priority === "High"
                                  ? "bg-slate-200 text-slate-800"
                                  : ticket.priority === "Medium"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {ticket.status}
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-900 mb-1">{ticket.summary}</h3>
                          <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                          {ticket.acceptanceCriteria && (
                            <div className="text-sm text-slate-600 mb-2">
                              <strong>AC:</strong> {ticket.acceptanceCriteria}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">
                            Assignee: {ticket.assignee} • Updated: {ticket.updated}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.key)}
                          onChange={() => toggleTicketSelection(ticket.key)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "analytics" && (
            <div className="space-y-6">
              {generatedTests.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <TestTubeIcon />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Test Cases Generated Yet</h3>
                  <p className="text-slate-600 mb-4">
                    Generate test cases from JIRA tickets to view analytics and export options.
                  </p>
                  <button
                    onClick={() => setActiveView("generator")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Go to Test Generator
                  </button>
                </div>
              ) : (
                <>
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="text-2xl font-bold text-blue-600">{generatedTests.length}</div>
                      <div className="text-sm text-slate-600">Tickets Processed</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedTests.reduce((sum, result) => sum + result.testCases.length, 0)}
                      </div>
                      <div className="text-sm text-slate-600">Total Test Cases</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          generatedTests.reduce((sum, result) => sum + result.testCases.length, 0) /
                            generatedTests.length,
                        )}
                      </div>
                      <div className="text-sm text-slate-600">Avg Tests/Ticket</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="text-2xl font-bold text-orange-600">{aiConfig.coverageLevel}%</div>
                      <div className="text-sm text-slate-600">Coverage Level</div>
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ListIcon />
                      Test Cases
                    </h2>

                    <div className="space-y-4">
                      {generatedTests.map((result) => (
                        <div
                          key={result.ticket?.key || result.pullRequest?.number}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <h3 className="font-medium text-slate-900 mb-2">
                            {result.ticket?.summary || result.pullRequest?.title}
                            <span className="ml-2 font-mono text-sm text-slate-500">
                              ({result.testCases.length} tests)
                            </span>
                          </h3>

                          <div className="space-y-3">
                            {result.testCases.map((testCase) => (
                              <div key={testCase.id} className="bg-slate-50 p-3 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{testCase.title}</span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      testCase.priority === "High"
                                        ? "bg-slate-200 text-slate-800"
                                        : testCase.priority === "Medium"
                                          ? "bg-slate-100 text-slate-700"
                                          : "bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {testCase.priority}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600">
                                  {testCase.steps.length} steps • {testCase.type}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeView === "history" && (
            <div className="space-y-6">
              {testHistory.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <HistoryIcon />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Test Generation History</h3>
                  <p className="text-slate-600 mb-4">Generate test cases to view your generation history.</p>
                  <button
                    onClick={() => setActiveView("generator")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Go to Test Generator
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <HistoryIcon />
                    Test Generation History
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ticket/PR
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Summary
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tests Generated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Settings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {testHistory.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{entry.source}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{entry.ticketKey || `#${entry.prNumber}`}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{entry.ticketSummary}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{entry.testCount}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{entry.generatedAt}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => alert(JSON.stringify(entry.settings, null, 2))}
                              >
                                View Settings
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "reports" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChartIcon />
                  PR Test Reports
                </h2>

                {prReports.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No PR reports available yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PR #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Results
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prReports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">#{report.prNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{report.prTitle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{report.status}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Passed: {report.results.passed}, Failed: {report.results.failed}, Total:{" "}
                                {report.results.total}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{report.createdAt}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-blue-600 hover:text-blue-800">View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileIcon />
                  PR Comments
                </h2>

                {prComments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">No PR comments posted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prComments.map((comment) => (
                      <div key={comment.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-slate-900">
                            PR #{comment.prNumber} - {comment.author}
                          </div>
                          <div className="text-xs text-slate-500">{comment.createdAt}</div>
                        </div>
                        <div className="text-sm text-slate-700">{comment.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
