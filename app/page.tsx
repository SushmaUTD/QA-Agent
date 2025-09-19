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

export default function JiraTestAI() {
  const [activeView, setActiveView] = useState("generator")

  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    email: "",
    apiToken: "",
    projectKey: "", // Fixed property name to match API
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
  const [isConnecting, setIsConnecting] = useState(false) // Added missing state
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
  const [tickets, setTickets] = useState<JiraTicket[]>(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

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
      <path d="M12 1v6m0 8v6m11-7h-6m-8 0H1m15.5-3.5L19 12l-2.5 2.5M5 9.5L2.5 12 5 14.5" />
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
        setTickets(data.tickets) // Use real tickets instead of mock data
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

  const connectToGithub = async () => {
    setIsConnectingGithub(true)
    try {
      // Simulate GitHub API connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockPRs: GitHubPullRequest[] = [
        {
          id: "1",
          number: 123,
          title: "Implement User Login Authentication System",
          description: `This PR implements a complete user authentication system corresponding to PROJ-123.

**Features implemented:**
- Secure user login with email and password validation
- Invalid credentials error handling with appropriate messages
- Account lockout mechanism after 3 failed login attempts
- Password reset functionality with email verification
- Session management and token-based authentication

**Testing Notes:**
- All acceptance criteria from PROJ-123 have been implemented
- Ready for comprehensive QA testing
- Includes unit tests for authentication logic`,
          status: "open",
          author: "john.doe",
          reviewers: ["jane.smith", "mike.wilson"],
          files: [
            {
              filename: "src/components/auth/LoginForm.tsx",
              status: "added",
              additions: 89,
              deletions: 0,
              changes: 89,
            },
            {
              filename: "src/components/auth/PasswordReset.tsx",
              status: "added",
              additions: 67,
              deletions: 0,
              changes: 67,
            },
            { filename: "src/hooks/useAuth.ts", status: "added", additions: 134, deletions: 0, changes: 134 },
            { filename: "src/utils/validation.ts", status: "modified", additions: 45, deletions: 12, changes: 57 },
            { filename: "src/api/auth.ts", status: "added", additions: 78, deletions: 0, changes: 78 },
            { filename: "src/middleware/auth.ts", status: "added", additions: 56, deletions: 0, changes: 56 },
          ],
          commits: [
            {
              sha: "abc123",
              message: "Add login form component with validation",
              author: "john.doe",
              date: "2024-01-20",
            },
            {
              sha: "def456",
              message: "Implement password reset functionality",
              author: "john.doe",
              date: "2024-01-21",
            },
            { sha: "ghi789", message: "Add account lockout mechanism", author: "john.doe", date: "2024-01-21" },
            {
              sha: "jkl012",
              message: "Add authentication middleware and session management",
              author: "john.doe",
              date: "2024-01-22",
            },
          ],
          created: "2024-01-20",
          updated: "2024-01-22",
          branch: "feature/user-authentication-proj-123",
          baseBranch: "main",
        },
        {
          id: "2",
          number: 124,
          title: "Shopping Cart Functionality Implementation",
          description: `Complete shopping cart implementation for PROJ-124.

**Features implemented:**
- Add items to cart from product pages
- Update item quantities with real-time price calculation
- Remove items from cart with confirmation
- Cart persistence across user sessions using localStorage
- Accurate total price calculation including taxes and discounts

**Technical Details:**
- Uses React Context for cart state management
- Implements optimistic updates for better UX
- Includes comprehensive error handling
- Mobile-responsive cart interface`,
          status: "open",
          author: "jane.smith",
          reviewers: ["john.doe", "sarah.johnson"],
          files: [
            {
              filename: "src/components/cart/ShoppingCart.tsx",
              status: "added",
              additions: 156,
              deletions: 0,
              changes: 156,
            },
            { filename: "src/components/cart/CartItem.tsx", status: "added", additions: 89, deletions: 0, changes: 89 },
            { filename: "src/hooks/useCart.ts", status: "added", additions: 167, deletions: 0, changes: 167 },
            { filename: "src/context/CartContext.tsx", status: "added", additions: 98, deletions: 0, changes: 98 },
            { filename: "src/utils/cartCalculations.ts", status: "added", additions: 67, deletions: 0, changes: 67 },
            { filename: "src/pages/checkout.tsx", status: "modified", additions: 45, deletions: 23, changes: 68 },
          ],
          commits: [
            {
              sha: "mno345",
              message: "Add shopping cart component and context",
              author: "jane.smith",
              date: "2024-01-22",
            },
            {
              sha: "pqr678",
              message: "Implement cart persistence and calculations",
              author: "jane.smith",
              date: "2024-01-23",
            },
            {
              sha: "stu901",
              message: "Add cart item management and quantity updates",
              author: "jane.smith",
              date: "2024-01-24",
            },
          ],
          created: "2024-01-22",
          updated: "2024-01-24",
          branch: "feature/shopping-cart-proj-124",
          baseBranch: "main",
        },
        {
          id: "3",
          number: 125,
          title: "Stripe Payment Processing Integration - Ready for QA",
          description: `Payment processing integration for PROJ-125 - **READY FOR QA TESTING**

**Features implemented:**
- Secure credit card payment processing via Stripe API
- Comprehensive payment failure handling with user-friendly error messages
- Automated confirmation emails after successful payments
- Multi-currency support (USD, EUR, GBP, CAD)
- PCI-compliant payment form with Stripe Elements
- Webhook handling for payment status updates

**QA Testing Notes:**
- All acceptance criteria from PROJ-125 completed
- Test credit card numbers available in Stripe test mode
- Email templates configured for payment confirmations
- Error scenarios thoroughly tested in development
- Ready for comprehensive QA validation

**Test Cards for QA:**
- Success: 4242424242424242
- Declined: 4000000000000002
- Insufficient funds: 4000000000009995`,
          status: "ready_for_review",
          author: "mike.wilson",
          reviewers: ["john.doe", "jane.smith", "sarah.johnson"],
          files: [
            {
              filename: "src/components/payment/PaymentForm.tsx",
              status: "added",
              additions: 234,
              deletions: 0,
              changes: 234,
            },
            {
              filename: "src/components/payment/PaymentSuccess.tsx",
              status: "added",
              additions: 78,
              deletions: 0,
              changes: 78,
            },
            { filename: "src/api/payment/stripe.ts", status: "added", additions: 189, deletions: 0, changes: 189 },
            { filename: "src/api/payment/webhooks.ts", status: "added", additions: 145, deletions: 0, changes: 145 },
            { filename: "src/utils/currency.ts", status: "added", additions: 67, deletions: 0, changes: 67 },
            {
              filename: "src/services/emailService.ts",
              status: "modified",
              additions: 89,
              deletions: 12,
              changes: 101,
            },
            { filename: "src/types/payment.ts", status: "added", additions: 45, deletions: 0, changes: 45 },
          ],
          commits: [
            {
              sha: "vwx234",
              message: "Add Stripe payment form with Elements integration",
              author: "mike.wilson",
              date: "2024-01-25",
            },
            {
              sha: "yzab567",
              message: "Add payment webhooks and email notifications",
              author: "mike.wilson",
              date: "2024-01-26",
            },
          ],
          created: "2024-01-25",
          updated: "2024-01-26",
          branch: "feature/stripe-payment-proj-125",
          baseBranch: "main",
        },
      ]

      setPullRequests(mockPRs)
      setIsGithubConnected(true)
    } catch (error) {
      console.error("Error connecting to GitHub:", error)
      alert("Error connecting to GitHub. Please check your configuration.")
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const generateTestCases = async (ticket: JiraTicket) => {
    setIsGenerating(true)
    setSelectedTicket(ticket)

    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket,
          settings: {
            coverageLevel: aiConfig.coverageLevel,
            testTypes: aiConfig.testTypes,
            framework: aiConfig.framework,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const testResult: TestGenerationResult = {
          ticket,
          testCases: result.testCases,
          metadata: {
            ticketKey: ticket.key,
            generatedAt: new Date().toISOString(),
            settings: aiConfig,
            totalTests: result.testCases.length,
            source: "jira",
          },
        }

        setGeneratedTests((prev) => [testResult, ...prev])

        setTestHistory((prev) => [
          {
            id: Date.now().toString(),
            ticketKey: ticket.key,
            ticketSummary: ticket.summary,
            testsGenerated: result.testCases.length,
            timestamp: new Date(),
            testTypes: aiConfig.testTypes,
            priority: ticket.priority,
          },
          ...prev,
        ])
      }
    } catch (error) {
      console.error("Error generating test cases:", error)
      alert("Error generating test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTestCasesForPR = async (pullRequest: GitHubPullRequest) => {
    setIsGenerating(true)
    setSelectedPR(pullRequest)

    try {
      const response = await fetch("/api/generate-tests-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pullRequest,
          settings: {
            coverageLevel: aiConfig.coverageLevel,
            testTypes: aiConfig.testTypes,
            framework: aiConfig.framework,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const testResult: TestGenerationResult = {
          pullRequest,
          testCases: result.testCases,
          metadata: {
            prNumber: pullRequest.number,
            generatedAt: new Date().toISOString(),
            settings: aiConfig,
            totalTests: result.testCases.length,
            source: "github",
          },
        }

        setGeneratedTests((prev) => [testResult, ...prev])
      }
    } catch (error) {
      console.error("Error generating test cases for PR:", error)
      alert("Error generating test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateTestCases = async (identifier: string, source: "jira" | "github") => {
    try {
      let response

      if (source === "jira") {
        const ticket = tickets.find((t) => t.key === identifier)
        if (!ticket) return

        response = await fetch("/api/generate-tests", {
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
      } else if (source === "github") {
        const prNumber = Number.parseInt(identifier)
        const pullRequest = pullRequests.find((pr) => pr.number === prNumber)
        if (!pullRequest) return

        response = await fetch("/api/generate-tests-github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pullRequest,
            settings: {
              coverageLevel: aiConfig.coverageLevel,
              testTypes: aiConfig.testTypes,
              framework: aiConfig.framework,
            },
          }),
        })
      }

      if (response) {
        const result = await response.json()
        if (result.success) {
          setGeneratedTests((prev) =>
            prev.map((test) =>
              (source === "jira" && test.metadata.ticketKey === identifier) ||
              (source === "github" && test.metadata.prNumber === Number.parseInt(identifier))
                ? {
                    ...test,
                    testCases: result.testCases,
                    metadata: {
                      ...test.metadata,
                      generatedAt: new Date().toISOString(),
                      totalTests: result.testCases.length,
                    },
                  }
                : test,
            ),
          )
        }
      }
    } catch (error) {
      console.error("Error regenerating test cases:", error)
    }
  }

  const executeTestsInCI = async (testSuiteId: string) => {
    setIsExecutingTests(true)

    try {
      const response = await fetch("/api/execute-tests-ci", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSuiteId,
          ciConfig,
          appConfig,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newRun: CIPipelineRun = {
          id: result.runId,
          testSuiteId,
          status: "pending",
          startedAt: new Date().toISOString(),
          logs: ["Pipeline started..."],
        }

        setPipelineRuns((prev) => [newRun, ...prev])

        const pollStatus = async () => {
          try {
            const statusResponse = await fetch(`/api/pipeline-status/${result.runId}`)
            const statusData = await statusResponse.json()

            setPipelineRuns((prev) =>
              prev.map((run) =>
                run.id === result.runId
                  ? {
                      ...run,
                      status: statusData.status,
                      completedAt: statusData.completedAt,
                      results: statusData.results,
                      logs: statusData.logs,
                    }
                  : run,
              ),
            )

            if (statusData.status === "running" || statusData.status === "pending") {
              setTimeout(pollStatus, 5000)
            }
          } catch (error) {
            console.error("Error polling pipeline status:", error)
          }
        }

        setTimeout(pollStatus, 2000)
      }
    } catch (error) {
      console.error("Error executing tests in CI:", error)
      alert("Error executing tests. Please check your CI configuration.")
    } finally {
      setIsExecutingTests(false)
    }
  }

  const postPRComment = async (prNumber: number, testResults: any) => {
    setIsPostingComment(true)

    try {
      const response = await fetch("/api/post-pr-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          author: "qa-bot",
          body: result.commentBody,
          createdAt: new Date().toISOString(),
          testResults,
        }

        setPrComments((prev) => [newComment, ...prev])
      }
    } catch (error) {
      console.error("Error posting PR comment:", error)
      alert("Error posting comment to PR. Please check your GitHub configuration.")
    } finally {
      setIsPostingComment(false)
    }
  }

  const downloadTestCases = (testResult: TestGenerationResult) => {
    const content = JSON.stringify(testResult, null, 2)
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `test-cases-${testResult.metadata.ticketKey || testResult.metadata.prNumber}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BrainIcon />
            <h1 className="text-xl font-bold text-gray-900">JIRA Test AI</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveView("generator")}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
              activeView === "generator"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <TestTubeIcon />
            <span>Test Generator</span>
          </button>

          <button
            onClick={() => setActiveView("history")}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
              activeView === "history"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <HistoryIcon />
            <span>Test History</span>
          </button>

          <button
            onClick={() => setActiveView("ci")}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
              activeView === "ci" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ZapIcon />
            <span>CI/CD Integration</span>
          </button>

          <button
            onClick={() => setActiveView("analytics")}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
              activeView === "analytics"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BarChartIcon />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
            <span className="text-gray-600">{isConnected ? "Connected to JIRA" : "Not connected"}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {activeView === "generator" && "Test Case Generator"}
              {activeView === "history" && "Test History"}
              {activeView === "ci" && "CI/CD Integration"}
              {activeView === "analytics" && "Analytics Dashboard"}
            </h2>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <SettingsIcon />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeView === "generator" && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="text-center mb-8">
                    <BotIcon />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Integration Source</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Connect to JIRA or GitHub to automatically generate comprehensive test cases from your tickets and
                      pull requests using AI.
                    </p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setIntegrationMode("jira")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          integrationMode === "jira"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        JIRA Tickets
                      </button>
                      <button
                        onClick={() => setIntegrationMode("github")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          integrationMode === "github"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        GitHub Pull Requests
                      </button>
                    </div>
                  </div>

                  {integrationMode === "jira" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">JIRA URL</label>
                          <input
                            type="url"
                            value={jiraConfig.url}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                            placeholder="https://your-domain.atlassian.net"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={jiraConfig.email}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                            placeholder="your-email@company.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Project Key</label>
                          <input
                            type="text"
                            value={jiraConfig.projectKey}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                            placeholder="PROJ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                          <input
                            type="password"
                            value={jiraConfig.apiToken}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                            placeholder="Your JIRA API token"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleJiraConnect}
                        disabled={
                          isConnecting ||
                          !jiraConfig.url ||
                          !jiraConfig.email ||
                          !jiraConfig.apiToken ||
                          !jiraConfig.projectKey
                        }
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isConnecting ? "Connecting..." : "Connect to JIRA"}
                      </button>
                    </div>
                  )}

                  {integrationMode === "github" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Token</label>
                          <input
                            type="password"
                            value={githubConfig.token}
                            onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                          <input
                            type="text"
                            value={githubConfig.organization}
                            onChange={(e) => setGithubConfig({ ...githubConfig, organization: e.target.value })}
                            placeholder="your-org"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Repository</label>
                          <input
                            type="text"
                            value={githubConfig.repository}
                            onChange={(e) => setGithubConfig({ ...githubConfig, repository: e.target.value })}
                            placeholder="your-repo"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL (Optional)</label>
                          <input
                            type="url"
                            value={githubConfig.webhookUrl}
                            onChange={(e) => setGithubConfig({ ...githubConfig, webhookUrl: e.target.value })}
                            placeholder="https://your-app.com/webhook"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isConnectingGithub ? "Connecting..." : "Connect to GitHub"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Main Content Area */}
                  <div className="xl:col-span-3 space-y-6">
                    {integrationMode === "jira" && (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">JIRA Tickets</h3>
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <RefreshIcon />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <FilterIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {ticket.key}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        ticket.priority === "High"
                                          ? "bg-red-100 text-red-800"
                                          : ticket.priority === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {ticket.priority}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                                      {ticket.status}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-2">{ticket.summary}</h4>
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                                  {ticket.acceptanceCriteria.length > 0 && (
                                    <div className="mb-3">
                                      <h5 className="text-sm font-medium text-gray-700 mb-1">Acceptance Criteria:</h5>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {ticket.acceptanceCriteria.slice(0, 2).map((criteria, index) => (
                                          <li key={index} className="flex items-start">
                                            <CheckIcon />
                                            <span>{criteria}</span>
                                          </li>
                                        ))}
                                        {ticket.acceptanceCriteria.length > 2 && (
                                          <li className="text-gray-400 text-xs">
                                            +{ticket.acceptanceCriteria.length - 2} more criteria
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    <span>Assignee: {ticket.assignee}</span>
                                    <span>Updated: {ticket.updated}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => generateTestCases(ticket)}
                                  disabled={isGenerating}
                                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                  <BrainIcon />
                                  <span>{isGenerating ? "Generating..." : "Generate Tests"}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {integrationMode === "github" && isGithubConnected && (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">GitHub Pull Requests</h3>
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <RefreshIcon />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <FilterIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {pullRequests.map((pr) => (
                            <div key={pr.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-sm font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                      #{pr.number}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        pr.status === "open"
                                          ? "bg-green-100 text-green-800"
                                          : pr.status === "ready_for_review"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {pr.status.replace("_", " ")}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-2">{pr.title}</h4>
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{pr.description}</p>
                                  <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                                    <span>Author: {pr.author}</span>
                                    <span>Branch: {pr.branch}</span>
                                    <span>Files: {pr.files.length}</span>
                                    <span>Commits: {pr.commits.length}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    <span>Created: {pr.created}</span>
                                    <span>Updated: {pr.updated}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => generateTestCasesForPR(pr)}
                                  disabled={isGenerating}
                                  className="ml-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                  <BrainIcon />
                                  <span>{isGenerating ? "Generating..." : "Generate Tests"}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
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
                                      setAiConfig({
                                        ...aiConfig,
                                        testTypes: aiConfig.testTypes.filter((t) => t !== type),
                                      })
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coverage Level: {aiConfig.coverageLevel}%
                          </label>
                          <input
                            type="range"
                            min="25"
                            max="100"
                            step="25"
                            value={aiConfig.coverageLevel}
                            onChange={(e) =>
                              setAiConfig({ ...aiConfig, coverageLevel: Number.parseInt(e.target.value) })
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
                          <select
                            value={aiConfig.framework}
                            onChange={(e) => setAiConfig({ ...aiConfig, framework: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="generic">Generic</option>
                            <option value="selenium">Selenium</option>
                            <option value="cypress">Cypress</option>
                            <option value="playwright">Playwright</option>
                            <option value="jest">Jest</option>
                            <option value="postman">Postman</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Config</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
                          <input
                            type="url"
                            value={appConfig.applicationUrl}
                            onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Test Username</label>
                          <input
                            type="text"
                            value={appConfig.loginUsername}
                            onChange={(e) => setAppConfig({ ...appConfig, loginUsername: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Test Password</label>
                          <input
                            type="password"
                            value={appConfig.loginPassword}
                            onChange={(e) => setAppConfig({ ...appConfig, loginPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                          <select
                            value={appConfig.environment}
                            onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="development">Development</option>
                            <option value="staging">Staging</option>
                            <option value="production">Production</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Generated Test Cases</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadTestCases("selenium")}
                          className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <DownloadIcon />
                          <span>Selenium</span>
                        </button>
                        <button
                          onClick={() => downloadTestCases("cypress")}
                          className="bg-purple-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                        >
                          <DownloadIcon />
                          <span>Cypress</span>
                        </button>
                        <button
                          onClick={() => downloadTestCases("json")}
                          className="bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-1"
                        >
                          <DownloadIcon />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {generatedTests.map((testResult, index) => (
                      <div key={index} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {testResult.ticket?.summary || testResult.pullRequest?.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>
                                {testResult.metadata.source === "jira"
                                  ? testResult.metadata.ticketKey
                                  : `PR #${testResult.metadata.prNumber}`}
                              </span>
                              <span>{testResult.metadata.totalTests} test cases</span>
                              <span>{new Date(testResult.metadata.generatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                regenerateTestCases(
                                  testResult.metadata.source === "jira"
                                    ? tickets.find((t) => t.key === testResult.metadata.ticketKey)
                                    : pullRequests.find((pr) => pr.number === testResult.metadata.prNumber),
                                )
                              }
                              disabled={isGenerating}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {testResult.testCases.map((testCase, testIndex) => (
                            <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">{testCase.title}</h5>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      testCase.priority === "High"
                                        ? "bg-red-100 text-red-800"
                                        : testCase.priority === "Medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {testCase.priority}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                    {testCase.type}
                                  </span>
                                </div>
                              </div>

                              {testCase.preconditions.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">Preconditions:</h6>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {testCase.preconditions.map((condition, condIndex) => (
                                      <li key={condIndex} className="flex items-start">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        <span>{condition}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="mb-3">
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Test Steps:</h6>
                                <ol className="text-sm text-gray-600 space-y-1">
                                  {testCase.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="flex items-start">
                                      <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                        {stepIndex + 1}
                                      </span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              <div className="mb-3">
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Expected Result:</h6>
                                <p className="text-sm text-gray-600">{testCase.expectedResults}</p>
                              </div>

                              {testCase.testData && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">Test Data:</h6>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                                    {testCase.testData}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "history" && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Generation History</h3>
              <p className="text-gray-600">View and manage your previously generated test cases.</p>
            </div>
          )}

          {activeView === "ci" && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CI/CD Integration</h3>
              <p className="text-gray-600">Configure continuous integration and deployment workflows.</p>
            </div>
          )}

          {activeView === "analytics" && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600">View test generation metrics and insights.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
