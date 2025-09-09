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
              sha: "yza567",
              message: "Implement payment processing and error handling",
              author: "mike.wilson",
              date: "2024-01-26",
            },
            {
              sha: "bcd890",
              message: "Add multi-currency support and webhooks",
              author: "mike.wilson",
              date: "2024-01-27",
            },
            {
              sha: "efg123",
              message: "Add confirmation emails and success flow",
              author: "mike.wilson",
              date: "2024-01-28",
            },
          ],
          created: "2024-01-25",
          updated: "2024-01-28",
          branch: "feature/stripe-payment-proj-125",
          baseBranch: "main",
        },
        {
          id: "4",
          number: 126,
          title: "User Profile Management System",
          description: `Complete user profile management implementation for PROJ-126.

**Features implemented:**
- Comprehensive profile editing interface
- Profile picture upload with image optimization
-
- Comprehensive profile editing interface
- Profile picture upload with image optimization- Email notification preferences management
- Account deletion with data export option
- Privacy settings and data management

**Technical Implementation:**
- File upload with drag-and-drop interface
- Image resizing and optimization
- Secure data handling for sensitive information
- GDPR-compliant account deletion process`,
          status: "open",
          author: "sarah.johnson",
          reviewers: ["mike.wilson", "jane.smith"],
          files: [
            {
              filename: "src/components/profile/ProfileEditor.tsx",
              status: "added",
              additions: 198,
              deletions: 0,
              changes: 198,
            },
            {
              filename: "src/components/profile/ProfilePicture.tsx",
              status: "added",
              additions: 123,
              deletions: 0,
              changes: 123,
            },
            {
              filename: "src/components/profile/NotificationSettings.tsx",
              status: "added",
              additions: 89,
              deletions: 0,
              changes: 89,
            },
            { filename: "src/hooks/useProfile.ts", status: "added", additions: 156, deletions: 0, changes: 156 },
            { filename: "src/utils/imageUpload.ts", status: "added", additions: 78, deletions: 0, changes: 78 },
            { filename: "src/api/profile.ts", status: "added", additions: 134, deletions: 0, changes: 134 },
          ],
          commits: [
            { sha: "hij456", message: "Add profile editor component", author: "sarah.johnson", date: "2024-01-28" },
            { sha: "klm789", message: "Implement profile picture upload", author: "sarah.johnson", date: "2024-01-29" },
            { sha: "nop012", message: "Add notification preferences", author: "sarah.johnson", date: "2024-01-30" },
          ],
          created: "2024-01-28",
          updated: "2024-01-30",
          branch: "feature/profile-management-proj-126",
          baseBranch: "main",
        },
        {
          id: "5",
          number: 127,
          title: "API Rate Limiting and Security Enhancements",
          description: `Security improvements and API rate limiting implementation.

**Features implemented:**
- JWT token refresh mechanism
- API rate limiting with Redis
- Request validation middleware
- CORS configuration updates
- Security headers implementation
- Audit logging for sensitive operations`,
          status: "draft",
          author: "alex.chen",
          reviewers: [],
          files: [
            { filename: "src/middleware/rateLimiting.ts", status: "added", additions: 89, deletions: 0, changes: 89 },
            { filename: "src/middleware/security.ts", status: "added", additions: 67, deletions: 0, changes: 67 },
            { filename: "src/utils/jwt.ts", status: "modified", additions: 34, deletions: 12, changes: 46 },
          ],
          commits: [
            { sha: "qrs345", message: "Add rate limiting middleware", author: "alex.chen", date: "2024-01-30" },
            { sha: "tuv678", message: "Implement security headers", author: "alex.chen", date: "2024-01-31" },
          ],
          created: "2024-01-30",
          updated: "2024-01-31",
          branch: "feature/security-enhancements",
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
            : `PR #${selectedPR?.number}`,
        ticketSummary: integrationMode === "jira" ? `${selectedTickets.length} JIRA tickets` : selectedPR?.title || "",
        testsGenerated: results.reduce((sum, r) => sum + r.testCases.length, 0),
        timestamp: new Date(),
        testTypes: aiConfig.testTypes,
        priority: "High",
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

  const regenerateTestCases = async (identifier: string, source: "jira" | "github") => {
    try {
      let response

      if (source === "jira") {
        const ticket = mockTickets.find((t) => t.key === identifier)
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
            settings: aiConfig,
            appConfig,
          }),
        })
      }

      if (response) {
        const data = await response.json()
        if (data.success || data.testCases) {
          setGeneratedTests((prev) =>
            prev.map((result) => {
              const resultId = result.ticket?.key || result.pullRequest?.number?.toString()
              if (resultId === identifier) {
                return {
                  ...result,
                  testCases: data.testCases,
                  metadata: {
                    ...result.metadata,
                    generatedAt: new Date().toISOString(),
                    totalTests: data.testCases.length,
                  },
                }
              }
              return result
            }),
          )
        }
      }
    } catch (error) {
      console.error("Failed to regenerate test cases:", error)
    }
  }

  const exportTestCasesOld = async (result: TestGenerationResult) => {
    const testData = {
      ticket: result.ticket,
      pullRequest: result.pullRequest,
      testCases: result.testCases,
      generatedAt: new Date().toISOString(),
      framework: "generic",
      source: result.metadata.source,
    }

    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const filename = result.ticket
      ? `${result.ticket.key}_test_cases.json`
      : `PR_${result.pullRequest?.number}_test_cases.json`

    a.download = filename
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

  const [jiraConnected, setJiraConnected] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [selectedPRs, setSelectedPRs] = useState<number[]>([])

  const downloadHistorySession = async (session: any, format: string) => {
    let content = ""
    let filename = ""

    if (format === "json") {
      content = JSON.stringify(session, null, 2)
      filename = `test_history_session_${session.id}.json`
    } else if (format === "selenium") {
      // Generate Selenium WebDriver Java code
      content = generateSeleniumCode(session.results)
      filename = `test_history_session_${session.id}_selenium.java`
    } else if (format === "cypress") {
      // Generate Cypress JavaScript code
      content = generateCypressCode(session.results)
      filename = `test_history_session_${session.id}_cypress.cy.js`
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

  const exportTestCases = async (result: TestGenerationResult, framework?: string) => {
    if (framework === "json" || !framework) {
      const testData = {
        ticket: result.ticket,
        pullRequest: result.pullRequest,
        testCases: result.testCases,
        generatedAt: new Date().toISOString(),
        framework: "generic",
        source: result.metadata.source,
      }

      const blob = new Blob([JSON.stringify(testData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const filename = result.ticket
        ? `${result.ticket.key}_test_cases.json`
        : `PR_${result.pullRequest?.number}_test_cases.json`

      a.download = filename
      document.body.appendChild(a)
      a.click()

      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (framework === "selenium") {
      const testData = [result]
      const content = generateSeleniumCode(testData)
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const filename = result.ticket
        ? `${result.ticket.key}_test_cases.java`
        : `PR_${result.pullRequest?.number}_test_cases.java`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (framework === "cypress") {
      const testData = [result]
      const content = generateCypressCode(testData)
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const filename = result.ticket
        ? `${result.ticket.key}_test_cases.cy.js`
        : `PR_${result.pullRequest?.number}_test_cases.cy.js`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
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
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
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
                <SettingsIcon />
                Settings
              </div>
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeView === "generator" && "Test Generator"}
            {activeView === "tickets" && "JIRA Tickets"}
            {activeView === "analytics" && "Test Analytics"}
            {activeView === "history" && "Generation History"}
            {activeView === "settings" && "Application Settings"}
          </h2>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeView === "generator" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Source</h3>
                <div className="flex space-x-4 mb-6">
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
                      onClick={() => setJiraConnected(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Connect to JIRA
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
                          placeholder="ghp_your_github_token"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                        <input
                          type="url"
                          value={githubConfig.webhookUrl}
                          onChange={(e) => setGithubConfig({ ...githubConfig, webhookUrl: e.target.value })}
                          placeholder="https://your-app.com/webhook"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={connectToGithub}
                        disabled={isConnectingGithub}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isConnectingGithub ? "Connecting..." : "Connect to GitHub"}
                      </button>
                      <button
                        onClick={() => {
                          setGithubConfig({
                            token: "ghp_demo_token_for_goldman_sachs",
                            organization: "goldman-sachs",
                            repository: "trading-platform-demo",
                            webhookUrl: "https://api.gs.com/webhook/github",
                          })
                          setGithubConnected(true)
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Use Sample Data
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {integrationMode === "jira" && jiraConnected && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QA Tickets</h3>

                  <div className="mb-6 space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-64">
                        <input
                          type="text"
                          placeholder="Search tickets..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="QA">QA</option>
                        <option value="Ready for QA">Ready for QA</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      {(searchTerm || statusFilter || priorityFilter) && (
                        <button
                          onClick={resetFilters}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {filteredTickets.length} of {mockTickets.length} tickets
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
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
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{ticket.key}</div>
                            <div className="text-sm text-gray-600">{ticket.summary}</div>
                            <div className="text-xs text-gray-500">
                              Status: {ticket.status} | Priority: {ticket.priority} | Assignee: {ticket.assignee}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{ticket.updated}</div>
                      </div>
                    ))}
                  </div>

                  {selectedTickets.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={generateTestCases}
                        disabled={isGenerating}
                        title="View generated test cases in Analytics tab"
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isGenerating ? "Generating Test Cases..." : "Generate Test Cases"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {integrationMode === "github" && githubConnected && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull Requests</h3>
                  <div className="space-y-3">
                    {pullRequests.map((pr) => (
                      <div
                        key={pr.number}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="selectedPR"
                            checked={selectedPR?.number === pr.number}
                            onChange={() => setSelectedPR(pr)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div>
                            <div className="font-medium text-gray-900">#{pr.number}</div>
                            <div className="text-sm text-gray-600">{pr.title}</div>
                            <div className="text-xs text-gray-500">
                              Status: {pr.status} | Author: {pr.author} | Files: {pr.files.length}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              pr.status === "open"
                                ? "bg-green-100 text-green-800"
                                : pr.status === "merged"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {pr.status}
                          </span>
                          <div className="text-sm text-gray-500">{pr.updated}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPR && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={generateTestCases}
                        disabled={isGenerating}
                        title="View generated test cases in Analytics tab"
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isGenerating ? "Generating Test Cases..." : "Generate Test Cases"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
                    <div className="flex flex-wrap gap-3">
                      {["Functional", "UI", "Edge Case", "Performance", "Security"].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={aiConfig.testTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAiConfig({
                                  ...aiConfig,
                                  testTypes: [...aiConfig.testTypes, type],
                                })
                              } else {
                                setAiConfig({
                                  ...aiConfig,
                                  testTypes: aiConfig.testTypes.filter((t) => t !== type),
                                })
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
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
                      onChange={(e) => setAiConfig({ ...aiConfig, coverageLevel: Number.parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Basic</span>
                      <span>Standard</span>
                      <span>Comprehensive</span>
                      <span>Exhaustive</span>
                    </div>
                  </div>
                </div>
              </div>

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Test Cases</h3>
                  <div className="space-y-4">
                    {generatedTests.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {result.source === "jira" ? result.ticket?.key : `PR #${result.pr?.number}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {result.source === "jira" ? result.ticket?.summary : result.pr?.title}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                regenerateTestCases(
                                  result.source === "jira"
                                    ? result.ticket?.key || ""
                                    : result.pr?.number?.toString() || "",
                                  result.source,
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => exportTestCasesOld(result)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Export
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {result.testCases.map((testCase, tcIndex) => (
                            <div key={tcIndex} className="bg-gray-50 p-3 rounded">
                              <div className="font-medium text-sm text-gray-900">{testCase.title}</div>
                              <div className="text-xs text-gray-600 mt-1">{testCase.description}</div>
                              <div className="flex gap-2 mt-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    testCase.priority === "High"
                                      ? "bg-red-100 text-red-800"
                                      : testCase.priority === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {testCase.priority}
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {testCase.type}
                                </span>
                              </div>
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

          {activeView === "tickets" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All JIRA Tickets</h3>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{ticket.key}</div>
                          <div className="text-sm text-gray-600 mt-1">{ticket.summary}</div>
                          <div className="text-xs text-gray-500 mt-2">{ticket.description}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                ticket.status === "QA"
                                  ? "bg-blue-100 text-blue-800"
                                  : ticket.status === "Ready for QA"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ticket.status}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                ticket.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">Total Test Cases</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {generatedTests.reduce((sum, result) => sum + result.testCases.length, 0)}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Coverage Score</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {generatedTests.length > 0
                        ? Math.round(
                            generatedTests.reduce(
                              (sum, result) => sum + (result.metadata?.settings?.coverageLevel || 75),
                              0,
                            ) / generatedTests.length,
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Items Processed</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{generatedTests.length}</div>
                  </div>
                </div>
              </div>

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Test Suites</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Selenium (Java)</h4>
                      <p className="text-sm text-gray-600 mb-3">Export as Selenium WebDriver test suite</p>
                      <button
                        onClick={() => exportAllTests("selenium")}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Export Selenium Suite
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Cypress (JavaScript)</h4>
                      <p className="text-sm text-gray-600 mb-3">Export as Cypress test suite</p>
                      <button
                        onClick={() => exportAllTests("cypress")}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Export Cypress Suite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Test Cases</h3>
                  <div className="space-y-4">
                    {generatedTests.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {result.metadata.source === "jira"
                                ? result.ticket?.key
                                : `PR #${result.pullRequest?.number}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {result.metadata.source === "jira" ? result.ticket?.summary : result.pullRequest?.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{result.testCases.length} test cases generated</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                regenerateTestCases(
                                  result.metadata.source === "jira"
                                    ? result.ticket?.key || ""
                                    : result.pullRequest?.number?.toString() || "",
                                  result.metadata.source,
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => exportTestCases(result, "json")}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Export JSON
                            </button>
                            <button
                              onClick={() => exportTestCases(result, "selenium")}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              Export Selenium
                            </button>
                            <button
                              onClick={() => exportTestCases(result, "cypress")}
                              className="text-purple-600 hover:text-purple-800 text-sm"
                            >
                              Export Cypress
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {result.testCases.slice(0, 3).map((testCase, tcIndex) => (
                            <div key={tcIndex} className="bg-gray-50 p-3 rounded">
                              <div className="font-medium text-sm text-gray-900">{testCase.title}</div>
                              <div className="text-xs text-gray-600 mt-1">{testCase.expectedResults}</div>
                              <div className="flex gap-2 mt-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    testCase.priority === "High"
                                      ? "bg-red-100 text-red-800"
                                      : testCase.priority === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {testCase.priority}
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {testCase.type}
                                </span>
                              </div>
                            </div>
                          ))}
                          {result.testCases.length > 3 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              ... and {result.testCases.length - 3} more test cases
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "history" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation History</h3>
                {testHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No test generation history yet. Generate some test cases to see them here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testHistory.map((session, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">Session {session.id}</h4>
                            <p className="text-sm text-gray-600">{session.timestamp.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {session.ticketKey} - {session.testsGenerated} test cases
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadHistorySession(session, "json")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => downloadHistorySession(session, "selenium")}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              Selenium
                            </button>
                            <button
                              onClick={() => downloadHistorySession(session, "cypress")}
                              className="text-purple-600 hover:text-purple-800 text-sm"
                            >
                              Cypress
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">{session.ticketSummary}</p>
                          <p className="text-xs text-gray-500">Test Types: {session.testTypes.join(", ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Configuration</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                      <select
                        value={appConfig.environment}
                        onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                        <option value="development">Development</option>
                      </select>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Any additional configuration notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
