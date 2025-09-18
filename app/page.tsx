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

  const [isConnectedJira, setIsConnectedJira] = useState(false)
  const mockTickets: JiraTicket[] = useMemo(
    () => [
      {
        id: "1",
        key: "TRADE-001",
        summary: "Add New Trading Instrument Functionality",
        description:
          "Implement the ability to add new trading instruments to the Goldman Sachs Global Markets platform with proper validation and real-time updates",
        status: "Ready for QA",
        acceptanceCriteria: [
          "User can click 'Add Instrument' button to open the add instrument form",
          "Form includes fields for Symbol, Name, Asset Class, Price",
          "Form validates required fields (Symbol, Name, Asset Class, Price)",
          "Symbol must be unique and follow proper format (e.g., AAPL, TSLA)",
          "Price must be a valid positive number with up to 2 decimal places",
          "Asset Class dropdown includes options: Stock, ETF, Currency, Bond, Commodity",
          "New instrument appears in the trading instruments table immediately after creation",
          "Table updates Total Instruments count in dashboard cards",
          "Form resets after successful submission",
          "Error messages display for validation failures",
        ],
        assignee: "sarah.johnson",
        priority: "High",
        updated: "2024-01-15T10:30:00Z",
      },
    ],
    [],
  )
  const [tickets, setTickets] = useState<JiraTicket[]>(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConnectingJira, setIsConnectingJira] = useState(false)

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

  const [isLiveTesting, setIsLiveTesting] = useState(false)
  const [liveTestResults, setLiveTestResults] = useState<string>("")

  const [isVisualTesting, setIsVisualTesting] = useState(false)
  const [visualTestSteps, setVisualTestSteps] = useState<
    Array<{ step: string; status: "pending" | "running" | "completed" | "failed"; screenshot?: string }>
  >([])

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
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
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
    setIsConnectingJira(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsConnectedJira(true)
    setIsConnectingJira(false)
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
- Email notification preferences management
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
          ],
          commits: [],
          created: "2024-01-29",
          updated: "2024-01-30",
          branch: "feature/user-profile-proj-126",
          baseBranch: "main",
        },
      ]
      setPullRequests(mockPRs)
    } catch (error) {
      console.error("Error connecting to GitHub:", error)
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const mockTickets2: JiraTicket[] = useMemo(
    () => [
      {
        id: "1",
        key: "TRADE-001",
        summary: "Add New Trading Instrument Functionality",
        description:
          "Implement the ability to add new trading instruments to the Goldman Sachs Global Markets platform with proper validation and real-time updates",
        status: "Ready for QA",
        acceptanceCriteria: [
          "User can click 'Add Instrument' button to open the add instrument form",
          "Form includes fields for Symbol, Name, Asset Class, Price",
          "Form validates required fields (Symbol, Name, Asset Class, Price)",
          "Symbol must be unique and follow proper format (e.g., AAPL, TSLA)",
          "Price must be a valid positive number with up to 2 decimal places",
          "Asset Class dropdown includes options: Stock, ETF, Currency, Bond, Commodity",
          "New instrument appears in the trading instruments table immediately after creation",
          "Table updates Total Instruments count in dashboard cards",
          "Form resets after successful submission",
          "Error messages display for validation failures",
        ],
        assignee: "sarah.johnson",
        priority: "High",
        updated: "2024-01-15T10:30:00Z",
      },
    ],
    [],
  )
  const [tickets2, setTickets2] = useState<JiraTicket[]>(mockTickets2)
  const [selectedTicket2, setSelectedTicket2] = useState<JiraTicket | null>(null)
  const [generatedTests2, setGeneratedTests2] = useState<TestGenerationResult[]>([])
  const [isGenerating2, setIsGenerating2] = useState(false)
  const [isConnecting2, setIsConnecting2] = useState(false)

  const [integrationMode2, setIntegrationMode2] = useState<"jira" | "github">("jira")

  const [filters2, setFilters2] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    search: "",
  })

  const [aiConfig2, setAiConfig2] = useState<AIConfig>({
    testTypes: ["Functional", "UI", "Edge Case"],
    coverageLevel: 75,
    includeEdgeCases: true,
    includeNegativeTests: true,
    includePerformanceTests: false,
    framework: "generic",
    coverage: "comprehensive",
  })

  const [testHistory2, setTestHistory2] = useState<
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

  const [ciConfig2, setCiConfig2] = useState<CIConfig>({
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

  const [pipelineRuns2, setPipelineRuns2] = useState<CIPipelineRun[]>([])
  const [isExecutingTests2, setIsExecutingTests2] = useState(false)

  const [prReports2, setPrReports2] = useState<PRReport[]>([])
  const [prComments2, setPrComments2] = useState<PRComment[]>([])
  const [isPostingComment2, setIsPostingComment2] = useState(false)

  const [isLiveTesting2, setIsLiveTesting2] = useState(false)
  const [liveTestResults2, setLiveTestResults2] = useState<string>("")

  const [isVisualTesting2, setIsVisualTesting2] = useState(false)
  const [visualTestSteps2, setVisualTestSteps2] = useState<
    Array<{ step: string; status: "pending" | "running" | "completed" | "failed"; screenshot?: string }>
  >([])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TestTubeIcon />
            </div>
            <h1 className="text-xl font-bold">JIRA Test AI</h1>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("generator")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === "generator" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <BotIcon />
              Test Generator
            </button>

            <button
              onClick={() => setActiveView("tickets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === "tickets" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <FileIcon />
              Tickets
            </button>

            <button
              onClick={() => setActiveView("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === "analytics" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <BarChartIcon />
              Analytics
            </button>

            <button
              onClick={() => setActiveView("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === "history" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <HistoryIcon />
              History
            </button>

            <button
              onClick={() => setActiveView("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeView === "settings" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <SettingsIcon />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {activeView === "generator" && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Generator</h2>
              <p className="text-gray-600">
                Generate comprehensive test cases from JIRA tickets and GitHub pull requests
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Integration Source */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Source</h3>

                  <div className="flex space-x-1 mb-6">
                    <button
                      onClick={() => setIntegrationMode("jira")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        integrationMode === "jira"
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      JIRA Tickets
                    </button>
                    <button
                      onClick={() => setIntegrationMode("github")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        integrationMode === "github"
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                            placeholder="https://your-domain.atlassian.net"
                            value={jiraConfig.url}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            placeholder="your-email@company.com"
                            value={jiraConfig.email}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Project Key</label>
                          <input
                            type="text"
                            placeholder="PROJ"
                            value={jiraConfig.project}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, project: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                          <input
                            type="password"
                            placeholder="Your JIRA API token"
                            value={jiraConfig.apiToken}
                            onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleJiraConnect}
                        disabled={isConnectingJira}
                        className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isConnectingJira ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ZapIcon />
                            Connect to JIRA
                          </>
                        )}
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
                            placeholder="ghp_xxxxxxxxxxxx"
                            value={githubConfig.token}
                            onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                          <input
                            type="text"
                            placeholder="your-org"
                            value={githubConfig.organization}
                            onChange={(e) => setGithubConfig({ ...githubConfig, organization: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Repository</label>
                        <input
                          type="text"
                          placeholder="your-repo"
                          value={githubConfig.repository}
                          onChange={(e) => setGithubConfig({ ...githubConfig, repository: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={connectToGithub}
                        disabled={isConnectingGithub}
                        className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isConnectingGithub ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ZapIcon />
                            Connect to GitHub
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Connected State */}
                  {((integrationMode === "jira" && isConnectedJira) ||
                    (integrationMode === "github" && isGithubConnected)) && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckIcon />
                        <span className="font-medium">
                          {integrationMode === "jira" ? "Connected to JIRA" : "Connected to GitHub"}
                        </span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        {integrationMode === "jira"
                          ? `Found ${tickets.length} ticket(s) ready for test generation`
                          : `Found ${pullRequests.length} pull request(s) ready for test generation`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Configuration */}
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
                      <div className="space-y-2">
                        {["Functional", "UI", "Edge Case", "Performance", "Security"].map((type) => (
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
                        onChange={(e) => setAiConfig({ ...aiConfig, coverageLevel: Number.parseInt(e.target.value) })}
                        className="w-full"
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
              </div>
            </div>

            {/* Generate Tests Button */}
            {((integrationMode === "jira" && isConnectedJira) ||
              (integrationMode === "github" && isGithubConnected)) && (
              <div className="mt-8">
                <button
                  onClick={async () => {
                    setIsGenerating(true)
                    // Simulate test generation
                    await new Promise((resolve) => setTimeout(resolve, 3000))

                    const mockResult: TestGenerationResult = {
                      ticket: integrationMode === "jira" ? tickets[0] : undefined,
                      pullRequest: integrationMode === "github" ? pullRequests[0] : undefined,
                      testCases: [
                        {
                          id: "1",
                          title: "Verify Add Instrument Button Functionality",
                          priority: "High",
                          type: "Functional",
                          preconditions: [
                            "User is logged into Goldman Sachs trading platform",
                            "User has appropriate permissions to add instruments",
                          ],
                          steps: [
                            "Navigate to the trading instruments dashboard",
                            "Locate the 'Add Instrument' button in the top-right corner",
                            "Click the 'Add Instrument' button",
                            "Verify the add instrument form opens",
                          ],
                          expectedResults: "Add instrument form should open with all required fields visible",
                          testData: "Valid user credentials, appropriate permissions",
                        },
                        {
                          id: "2",
                          title: "Validate Required Field Validation",
                          priority: "High",
                          type: "UI",
                          preconditions: ["Add instrument form is open"],
                          steps: [
                            "Leave Symbol field empty",
                            "Leave Name field empty",
                            "Leave Asset Class unselected",
                            "Leave Price field empty",
                            "Click Submit button",
                            "Verify error messages appear for all required fields",
                          ],
                          expectedResults:
                            "Error messages should display for Symbol, Name, Asset Class, and Price fields",
                          testData: "Empty form data",
                        },
                      ],
                      metadata: {
                        ticketKey: integrationMode === "jira" ? "TRADE-001" : undefined,
                        prNumber: integrationMode === "github" ? 123 : undefined,
                        generatedAt: new Date().toISOString(),
                        settings: aiConfig,
                        totalTests: 2,
                        source: integrationMode,
                      },
                    }

                    setGeneratedTests([mockResult])
                    setIsGenerating(false)
                  }}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Tests...
                    </>
                  ) : (
                    <>
                      <BrainIcon />
                      Generate Test Cases
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Generated Test Cases */}
            {generatedTests.length > 0 && (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Test Cases</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Generate Selenium code
                          const response = await fetch("/api/generate-selenium-code", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              testCases: generatedTests[0].testCases,
                              applicationUrl: appConfig.applicationUrl,
                            }),
                          })
                          const data = await response.json()
                          console.log("[v0] Generated Selenium code:", data.seleniumCode)
                        }}
                        disabled={generatedTests.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CodeIcon />
                        Generate Selenium Code
                      </button>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                        <DownloadIcon />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {generatedTests[0].testCases.map((testCase) => (
                      <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                testCase.priority === "High"
                                  ? "bg-red-100 text-red-800"
                                  : testCase.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {testCase.priority}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {testCase.type}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Preconditions:</span>
                            <ul className="list-disc list-inside text-gray-600 mt-1">
                              {testCase.preconditions.map((condition, idx) => (
                                <li key={idx}>{condition}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Steps:</span>
                            <ol className="list-decimal list-inside text-gray-600 mt-1">
                              {testCase.steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Expected Results:</span>
                            <p className="text-gray-600 mt-1">{testCase.expectedResults}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "settings" && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Configure your application settings and integrations</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Configuration</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
                  <input
                    type="url"
                    placeholder="https://your-app.com"
                    value={appConfig.applicationUrl}
                    onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Username</label>
                    <input
                      type="email"
                      placeholder="testuser@company.com"
                      value={appConfig.loginUsername}
                      onChange={(e) => setAppConfig({ ...appConfig, loginUsername: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Password</label>
                    <input
                      type="password"
                      placeholder="test123"
                      value={appConfig.loginPassword}
                      onChange={(e) => setAppConfig({ ...appConfig, loginPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other views can be added here */}
        {activeView === "tickets" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Tickets</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Ticket management coming soon...</p>
            </div>
          </div>
        )}

        {activeView === "analytics" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          </div>
        )}

        {activeView === "history" && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">History</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Test generation history coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
