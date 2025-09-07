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
  ticket: JiraTicket
  testCases: TestCase[]
  metadata: {
    ticketKey: string
    generatedAt: string
    settings: any
    totalTests: number
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

  const [isConnected, setIsConnected] = useState(false)
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

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
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 1.82-.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

  const generateTestCases = async () => {
    if (selectedTickets.length === 0) return

    setIsGenerating(true)
    const newResults: TestGenerationResult[] = []

    try {
      for (const ticketKey of selectedTickets) {
        const ticket = mockTickets.find((t) => t.key === ticketKey)
        if (!ticket) continue

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
          newResults.push({
            ticket,
            testCases: data.testCases,
            metadata: data.metadata,
          })
        }
      }

      setGeneratedTests((prev) => [...prev, ...newResults])
    } catch (error) {
      console.error("Failed to generate test cases:", error)
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
    <div className="flex flex-col min-h-screen">
      <div className="bg-white p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Jira Test Generator</h1>
          <div className="flex gap-4">
            <button
              className={`${
                activeView === "generator" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              } px-4 py-2 rounded`}
              onClick={() => setActiveView("generator")}
            >
              Generator
            </button>
            <button
              className={`${
                activeView === "settings" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              } px-4 py-2 rounded`}
              onClick={() => setActiveView("settings")}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
      <main className="flex-1 p-6">
        {activeView === "generator" && (
          <div className="space-y-6">
            {/* JIRA Connection Section */}
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
                                ? "bg-red-100 text-red-800"
                                : ticket.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
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
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>

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
                    <div key={result.ticket.key} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded mr-2">
                            {result.ticket.key}
                          </span>
                          <span className="font-medium">{result.ticket.summary}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => regenerateTestCases(result.ticket.key)}
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
                                    ? "bg-red-100 text-red-800"
                                    : testCase.priority === "Medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center justify-center gap-2"
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
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <DownloadIcon />
                        Export Cypress Suite
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
                      placeholder="testuser@company.com"
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
                    These settings will be used in the exported Selenium and Cypress test code to make them ready-to-run
                    for your specific application.
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
      </main>
    </div>
  )
}
