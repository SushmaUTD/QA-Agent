"use client"

import { useState } from "react"

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
  testCases: TestCase[]
  metadata: {
    ticketKey?: string
    generatedAt: string
    settings: any
    totalTests: number
    source: "jira"
  }
}

export default function JiraTestAI() {
  const [activeSection, setActiveSection] = useState("ai-config")

  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    email: "",
    apiToken: "",
    projectKey: "",
  })

  const [appConfig, setAppConfig] = useState({
    applicationUrl: "",
    environment: "staging",
  })

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [generatedTests, setGeneratedTests] = useState<TestGenerationResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

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
        setTickets(data.tickets)
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

  const generateTestCases = async () => {
    if (selectedTickets.length === 0) {
      alert("Please select at least one ticket to generate test cases.")
      return
    }

    setIsGenerating(true)
    try {
      const selectedTicketObjects = tickets.filter((ticket) => selectedTickets.includes(ticket.id))

      for (const ticket of selectedTicketObjects) {
        const response = await fetch("/api/generate-tests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticket,
            appConfig,
            settings: {
              coverageLevel: 75,
              testTypes: ["Functional", "UI", "Edge Case"],
              framework: "selenium",
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
              settings: { coverageLevel: 75, testTypes: ["Functional", "UI", "Edge Case"], framework: "selenium" },
              totalTests: result.testCases.length,
              source: "jira",
            },
          }

          setGeneratedTests((prev) => [testResult, ...prev])
        }
      }
    } catch (error) {
      console.error("Error generating test cases:", error)
      alert("Error generating test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadTestCases = (format: "selenium" | "cypress" | "json", testResult: TestGenerationResult) => {
    let content = ""
    let filename = ""
    let mimeType = ""

    if (format === "selenium") {
      content = generateSeleniumCode(testResult)
      filename = `${testResult.metadata.ticketKey}_selenium_tests.java`
      mimeType = "text/java"
    } else if (format === "cypress") {
      content = generateCypressCode(testResult)
      filename = `${testResult.metadata.ticketKey}_cypress_tests.js`
      mimeType = "text/javascript"
    } else {
      content = JSON.stringify(testResult, null, 2)
      filename = `${testResult.metadata.ticketKey}_test_cases.json`
      mimeType = "application/json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateSeleniumCode = (testResult: TestGenerationResult) => {
    const className = `${testResult.metadata.ticketKey?.replace("-", "_")}_Tests`

    return `package com.company.tests;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import java.time.Duration;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Automated tests for ${testResult.ticket?.summary || "JIRA Ticket"}
 * Generated from JIRA ticket: ${testResult.metadata.ticketKey}
 * Application URL: ${appConfig.applicationUrl}
 * Environment: ${appConfig.environment}
 */
public class ${className} {
    private WebDriver driver;
    private WebDriverWait wait;
    private final String BASE_URL = "${appConfig.applicationUrl}";
    private final String ENVIRONMENT = "${appConfig.environment}";

    @BeforeEach
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless"); // Remove this line to run with browser UI
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1920,1080");
        
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    // Helper methods for common actions
    private void navigateToPage(String path) {
        String fullUrl = BASE_URL + (path.startsWith("/") ? path : "/" + path);
        driver.get(fullUrl);
        wait.until(ExpectedConditions.urlContains(path));
    }

    private WebElement waitForElement(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    private void clickElement(By locator) {
        WebElement element = waitForElement(locator);
        element.click();
    }

    private void enterText(By locator, String text) {
        WebElement element = waitForElement(locator);
        element.clear();
        element.sendKeys(text);
    }

    private void verifyElementVisible(By locator) {
        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(locator)).isDisplayed(),
                "Element should be visible: " + locator.toString());
    }

    private void verifyTextPresent(String text) {
        assertTrue(driver.getPageSource().contains(text),
                "Text should be present on page: " + text);
    }

${testResult.testCases
  .map(
    (testCase, index) => `
    @Test
    public void ${testCase.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}() {
        // Test: ${testCase.title}
        // Priority: ${testCase.priority} | Type: ${testCase.type}
        
        try {
            // Navigate to application
            driver.get(BASE_URL);
            
            // Wait for page to load
            wait.until(ExpectedConditions.titleContains(""));
            
            ${generateSeleniumSteps(testCase)}
            
            // Verify expected result: ${testCase.expectedResults}
            ${generateSeleniumVerification(testCase)}
            
        } catch (Exception e) {
            // Take screenshot on failure
            // ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            fail("Test '${testCase.title}' failed: " + e.getMessage());
        }
    }
`,
  )
  .join("")}
}`
  }

  // Helper function to generate actual Selenium test steps
  const generateSeleniumSteps = (testCase: TestCase) => {
    return testCase.steps
      .map((step, stepIndex) => {
        // Convert natural language steps to Selenium code
        const stepLower = step.toLowerCase()

        if (stepLower.includes("click") || stepLower.includes("select")) {
          if (stepLower.includes("button")) {
            return `            // Step ${stepIndex + 1}: ${step}
            clickElement(By.xpath("//button[contains(text(), 'Submit') or contains(text(), 'Save') or contains(text(), 'Login')]"));`
          } else if (stepLower.includes("link")) {
            return `            // Step ${stepIndex + 1}: ${step}
            clickElement(By.xpath("//a[contains(text(), 'Link Text')]"));`
          } else {
            return `            // Step ${stepIndex + 1}: ${step}
            clickElement(By.id("elementId")); // Update with actual element ID`
          }
        } else if (stepLower.includes("enter") || stepLower.includes("input") || stepLower.includes("type")) {
          if (stepLower.includes("email")) {
            return `            // Step ${stepIndex + 1}: ${step}
            enterText(By.id("email"), "test@example.com");`
          } else if (stepLower.includes("password")) {
            return `            // Step ${stepIndex + 1}: ${step}
            enterText(By.id("password"), "testPassword123");`
          } else if (stepLower.includes("username")) {
            return `            // Step ${stepIndex + 1}: ${step}
            enterText(By.id("username"), "testuser");`
          } else {
            return `            // Step ${stepIndex + 1}: ${step}
            enterText(By.id("inputField"), "test data"); // Update with actual field ID and data`
          }
        } else if (stepLower.includes("navigate") || stepLower.includes("go to")) {
          return `            // Step ${stepIndex + 1}: ${step}
            navigateToPage("/target-page"); // Update with actual page path`
        } else if (stepLower.includes("wait") || stepLower.includes("load")) {
          return `            // Step ${stepIndex + 1}: ${step}
            Thread.sleep(2000); // Wait for page to load
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));`
        } else if (stepLower.includes("scroll")) {
          return `            // Step ${stepIndex + 1}: ${step}
            ((JavascriptExecutor) driver).executeScript("window.scrollTo(0, document.body.scrollHeight);");`
        } else if (stepLower.includes("select") && stepLower.includes("dropdown")) {
          return `            // Step ${stepIndex + 1}: ${step}
            Select dropdown = new Select(driver.findElement(By.id("dropdownId")));
            dropdown.selectByVisibleText("Option Text");`
        } else {
          return `            // Step ${stepIndex + 1}: ${step}
            // TODO: Implement specific action for this step
            verifyElementVisible(By.tagName("body")); // Generic verification`
        }
      })
      .join("\n")
  }

  // Helper function to generate verification code
  const generateSeleniumVerification = (testCase: TestCase) => {
    const expectedResult = testCase.expectedResults.toLowerCase()

    if (expectedResult.includes("success") || expectedResult.includes("successful")) {
      return `            verifyTextPresent("Success");
            verifyElementVisible(By.className("success-message"));`
    } else if (expectedResult.includes("error") || expectedResult.includes("fail")) {
      return `            verifyTextPresent("Error");
            verifyElementVisible(By.className("error-message"));`
    } else if (expectedResult.includes("redirect") || expectedResult.includes("navigate")) {
      return `            wait.until(ExpectedConditions.urlContains("/expected-page"));
            assertTrue(driver.getCurrentUrl().contains("/expected-page"));`
    } else if (expectedResult.includes("display") || expectedResult.includes("show")) {
      return `            verifyElementVisible(By.id("result-element"));
            assertTrue(driver.findElement(By.id("result-element")).isDisplayed());`
    } else if (expectedResult.includes("login") || expectedResult.includes("authenticated")) {
      return `            wait.until(ExpectedConditions.urlContains("/dashboard"));
            verifyElementVisible(By.id("user-menu"));`
    } else {
      return `            // Verify: ${testCase.expectedResults}
            verifyElementVisible(By.tagName("body"));
            assertFalse(driver.getPageSource().contains("error"));`
    }
  }

  const generateCypressCode = (testResult: TestGenerationResult) => {
    return `// Cypress tests for ${testResult.metadata.ticketKey}
// Generated on ${new Date(testResult.metadata.generatedAt).toLocaleString()}
// Application: ${appConfig.applicationUrl} (${appConfig.environment})

describe('${testResult.ticket?.summary || "Test Suite"}', () => {
  const BASE_URL = '${appConfig.applicationUrl}';
  const ENVIRONMENT = '${appConfig.environment}';

  beforeEach(() => {
    cy.visit(BASE_URL);
    cy.viewport(1920, 1080);
  });

${testResult.testCases
  .map(
    (testCase, index) => `
  it('${testCase.title}', () => {
    // Priority: ${testCase.priority} | Type: ${testCase.type}
    
    ${generateCypressSteps(testCase)}
    
    // Verify expected result: ${testCase.expectedResults}
    ${generateCypressVerification(testCase)}
  });
`,
  )
  .join("")}
});`
  }

  // Helper function to generate Cypress test steps
  const generateCypressSteps = (testCase: TestCase) => {
    return testCase.steps
      .map((step, stepIndex) => {
        const stepLower = step.toLowerCase()

        if (stepLower.includes("click") || stepLower.includes("select")) {
          if (stepLower.includes("button")) {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('button').contains('Submit').click();`
          } else if (stepLower.includes("link")) {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('a').contains('Link Text').click();`
          } else {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('[data-testid="element"]').click();`
          }
        } else if (stepLower.includes("enter") || stepLower.includes("input") || stepLower.includes("type")) {
          if (stepLower.includes("email")) {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('input[type="email"]').type('test@example.com');`
          } else if (stepLower.includes("password")) {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('input[type="password"]').type('testPassword123');`
          } else {
            return `    // Step ${stepIndex + 1}: ${step}
    cy.get('input').type('test data');`
          }
        } else if (stepLower.includes("navigate") || stepLower.includes("go to")) {
          return `    // Step ${stepIndex + 1}: ${step}
    cy.visit(BASE_URL + '/target-page');`
        } else if (stepLower.includes("wait") || stepLower.includes("load")) {
          return `    // Step ${stepIndex + 1}: ${step}
    cy.wait(2000);`
        } else {
          return `    // Step ${stepIndex + 1}: ${step}
    cy.get('body').should('be.visible');`
        }
      })
      .join("\n")
  }

  // Helper function to generate Cypress verification
  const generateCypressVerification = (testCase: TestCase) => {
    const expectedResult = testCase.expectedResults.toLowerCase()

    if (expectedResult.includes("success") || expectedResult.includes("successful")) {
      return `    cy.contains('Success').should('be.visible');
    cy.get('.success-message').should('be.visible');`
    } else if (expectedResult.includes("error") || expectedResult.includes("fail")) {
      return `    cy.contains('Error').should('be.visible');
    cy.get('.error-message').should('be.visible');`
    } else if (expectedResult.includes("redirect") || expectedResult.includes("navigate")) {
      return `    cy.url().should('include', '/expected-page');`
    } else if (expectedResult.includes("display") || expectedResult.includes("show")) {
      return `    cy.get('[data-testid="result"]').should('be.visible');`
    } else {
      return `    // Verify: ${testCase.expectedResults}
    cy.get('body').should('be.visible');
    cy.get('body').should('not.contain', 'error');`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Dark Navy Blue Sidebar */}
        <div className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold">QA Test Generator</h1>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveSection("ai-config")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeSection === "ai-config" ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              🤖 AI Configuration
            </button>

            <button
              onClick={() => setActiveSection("test-generator")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeSection === "test-generator" ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              🧪 Test Generator
            </button>

            <button
              onClick={() => setActiveSection("test-results")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeSection === "test-results" ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              📊 Test Results
            </button>

            <button
              onClick={() => setActiveSection("ci-cd")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeSection === "ci-cd" ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              🚀 CI/CD Integration
            </button>

            <button
              onClick={() => setActiveSection("analytics")}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeSection === "analytics" ? "bg-blue-600" : "hover:bg-slate-800"
              }`}
            >
              📈 Analytics
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {activeSection === "ai-config" && "AI Configuration"}
              {activeSection === "test-generator" && "Test Generator"}
              {activeSection === "test-results" && "Test Results"}
              {activeSection === "ci-cd" && "CI/CD Integration"}
              {activeSection === "analytics" && "Analytics"}
            </h2>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {activeSection === "ai-config" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Default JIRA Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">JIRA URL</label>
                      <input
                        type="text"
                        value={jiraConfig.url}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                        placeholder="https://your-domain.atlassian.net"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={jiraConfig.email}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                        placeholder="your-email@company.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                      <input
                        type="password"
                        value={jiraConfig.apiToken}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                        placeholder="Your JIRA API Token"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Key</label>
                      <input
                        type="text"
                        value={jiraConfig.projectKey}
                        onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                        placeholder="KAN"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Default Application Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
                      <input
                        type="text"
                        value={appConfig.applicationUrl}
                        onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                        placeholder="https://your-app.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                      <select
                        value={appConfig.environment}
                        onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                        <option value="development">Development</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "test-generator" && (
              <div className="space-y-6">
                {!isConnected ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Connect to JIRA</h3>
                    <p className="text-gray-600 mb-4">
                      Connect to your JIRA instance to fetch real tickets for test generation.
                    </p>
                    <button
                      onClick={handleJiraConnect}
                      disabled={
                        isConnecting ||
                        !jiraConfig.url ||
                        !jiraConfig.email ||
                        !jiraConfig.apiToken ||
                        !jiraConfig.projectKey
                      }
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? "Connecting..." : "Connect to JIRA"}
                    </button>
                    {(!jiraConfig.url || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) && (
                      <p className="text-sm text-gray-600 mt-2">
                        Please configure your JIRA settings in AI Configuration first.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          Select JIRA Tickets ({tickets.length} found from {jiraConfig.projectKey})
                        </h3>
                        <button
                          onClick={() => setIsConnected(false)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          🔄 Reconnect
                        </button>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                          >
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
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-blue-600">{ticket.key}</span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    ticket.status === "QA Ready"
                                      ? "bg-green-100 text-green-800"
                                      : ticket.status === "Dev In Progess"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {ticket.status}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
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
                              <p className="text-sm text-gray-600 mt-1">{ticket.summary}</p>
                              <p className="text-xs text-gray-500">Assigned to: {ticket.assignee}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTickets.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800 mb-3">
                            {selectedTickets.length} ticket(s) selected for test generation
                          </p>
                          <button
                            onClick={generateTestCases}
                            disabled={isGenerating}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? "🔄 Generating..." : `🚀 Generate Test Cases`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "test-results" && (
              <div className="space-y-6">
                {generatedTests.length > 0 ? (
                  generatedTests.map((result, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600">{result.metadata.ticketKey}</h3>
                          <p className="text-gray-600">{result.ticket?.summary}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Generated {result.testCases.length} test cases on{" "}
                            {new Date(result.metadata.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadTestCases("selenium", result)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            📥 Selenium
                          </button>
                          <button
                            onClick={() => downloadTestCases("cypress", result)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            📥 Cypress
                          </button>
                          <button
                            onClick={() => downloadTestCases("json", result)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                          >
                            📥 JSON
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {result.testCases.map((testCase, tcIndex) => (
                          <div key={tcIndex} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                              <div className="flex space-x-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    testCase.priority === "High"
                                      ? "bg-red-100 text-red-800"
                                      : testCase.priority === "Medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {testCase.priority}
                                </span>
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {testCase.type}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              <strong>Expected:</strong> {testCase.expectedResults}
                            </p>
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-gray-700">Test Steps:</h5>
                              {testCase.steps.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-start space-x-2">
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded min-w-[24px] text-center">
                                    {stepIndex + 1}
                                  </span>
                                  <span className="text-sm text-gray-700">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-gray-400 text-6xl mb-4">🧪</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No test results yet</h3>
                    <p className="text-gray-600">Generate some test cases first to see them here!</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "ci-cd" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">CI/CD Integration</h3>
                  <p className="text-gray-600">Configure your CI/CD pipeline integration here.</p>
                </div>
              </div>
            )}

            {activeSection === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                  <p className="text-gray-600">View your test generation analytics here.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
