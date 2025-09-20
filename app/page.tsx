"use client"

import { useState } from "react"
import JSZip from "jszip"

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
  type: "API" | "Integration" | "Contract" | "Performance" | "Security"
  apiEndpoint: string
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  requestPayload?: string
  expectedStatusCode: number
  expectedResponse?: string
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

export default function JiraTestGenerator() {
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

  // Updated testTypes to include API-specific types and adjusted default
  const [testTypes, setTestTypes] = useState<string[]>(["API"])
  // Updated testCoverage to use string values for better semantic meaning
  const [testCoverage, setTestCoverage] = useState("comprehensive")
  const [selectedFramework, setSelectedFramework] = useState("selenium")

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

  const generateTestCasesOld = async () => {
    if (selectedTickets.length === 0) {
      alert("Please select at least one ticket to generate API test cases.")
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
              coverageLevel: testCoverage,
              testTypes,
              framework: selectedFramework,
              testingType: "API", // Added API testing type
            },
          }),
        })

        const result = await response.json()

        if (result.success) {
          const testResult: TestGenerationResult = {
            ticket,
            testCases: result.testCases,
            metadata: result.metadata || {
              ticketKey: ticket.key,
              generatedAt: new Date().toISOString(),
              settings: { coverageLevel: testCoverage, testTypes, framework: selectedFramework, testingType: "API" },
              totalTests: result.testCases.length,
              source: "jira",
            },
          }

          console.log("[v0] API Test result created:", testResult)
          setGeneratedTests((prev) => [testResult, ...prev])
        }
      }
    } catch (error) {
      console.error("Error generating API test cases:", error)
      alert("Error generating API test cases. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCypressCode = (testResult: TestGenerationResult): string => {
    const { testCases, ticket } = testResult
    const applicationUrl = appConfig.applicationUrl || "http://localhost:3000"

    let cypressCode = `// Cypress Test Suite for ${ticket?.summary || "JIRA Ticket"}
// Generated on: ${new Date().toISOString()}

describe('${ticket?.key || "Test"} - ${ticket?.summary || "Generated Tests"}', () => {
  beforeEach(() => {
    cy.visit('${applicationUrl}');
  });

`

    testCases.forEach((testCase) => {
      cypressCode += `  it('${testCase.title}', () => {
    // Test: ${testCase.title}
    // Priority: ${testCase.priority}
    // Type: ${testCase.type}
    
    ${testCase.steps.map((step: string) => `    // ${step}`).join("\n")}
    
    // Add your Cypress commands here
    cy.get('[data-testid="add-instrument"]').click();
    cy.get('[name="symbol"]').type('AAPL');
    cy.get('[name="companyName"]').type('Apple Inc.');
    cy.get('[name="type"]').select('Stock');
    cy.get('[type="submit"]').click();
    
    // Verify expected result: ${testCase.expectedResults}
    cy.contains('successfully').should('be.visible');
  });

`
    })

    cypressCode += `});`

    return cypressCode
  }

  const downloadTestCases = (format: "selenium" | "cypress" | "json", testResult: TestGenerationResult) => {
    console.log("[v0] Downloading tests for:", testResult)
    console.log("[v0] Test result metadata:", testResult?.metadata)

    if (!testResult || !testResult.metadata) {
      console.error("[v0] Invalid test result or missing metadata")
      return
    }

    const ticketKey = testResult.metadata.ticketKey || "UnknownTicket"

    if (format === "selenium") {
      // Updated to call generateSeleniumCode for API tests
      generateSeleniumCodeForApi(testResult, ticketKey)
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === "cypress") {
      content = generateCypressCode(testResult)
      filename = `${ticketKey}_cypress_tests.js`
      mimeType = "text/javascript"
    } else {
      content = JSON.stringify(testResult, null, 2)
      filename = `${ticketKey}_test_cases.json`
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

  const generateSeleniumCodeForApi = (testResult: any, ticketKey: string) => {
    const projectName = "qa_agent_api"
    const packageName = `com.testing.qaagent.api`

    const files: { [key: string]: string } = {}

    files["pom.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://www.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.testing</groupId>
    <artifactId>${projectName}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${projectName}</name>
    <description>API Test Suite for ${testResult.ticket?.summary || "JIRA Ticket"}</description>

    <properties>
        <java.version>17</java.version>
        <spring.boot.version>3.1.5</spring.boot.version>
        <spring.boot.starter.test.version>3.1.5</spring.boot.starter.test.version>
        <testng.version>7.8.0</testng.version>
        <jackson.version>2.15.3</jackson.version>
    </properties>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>${"${spring.boot.version}"}</version>
        <relativePath/>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <version>${"${spring.boot.starter.test.version}"}</version>
        </dependency>
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>${"${testng.version}"}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>${"${jackson.version}"}</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
            <version>${"${jackson.version}"}</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-annotations</artifactId>
            <version>${"${jackson.version}"}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>${"${java.version}"}</source>
                    <target>${"${java.version}"}</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M5</version>
                <configuration>
                    <suiteXmlFiles>
                        <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                    </suiteXmlFiles>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`

    files[`src/main/java/${packageName.replace(/\./g, "/")}/Application.java`] = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`

    const apiTestCode = generateSeleniumCode(testResult)
    if (apiTestCode) {
      const safeTicketKey = testResult.metadata?.ticketKey || "UnknownTicket"
      const cleanClassName = `${safeTicketKey.replace(/-/g, "_")}_ApiTests`
      files[`src/test/java/${packageName.replace(/\./g, "/")}/tests/${cleanClassName}.java`] = apiTestCode
    }

    files["src/test/resources/testng.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<suite name="${projectName}" verbose="1">
    <test name="${ticketKey} API Tests">
        <classes>
            <class name="${packageName}.tests.${ticketKey.replace(/-/g, "_")}_ApiTests"/>
        </classes>
    </test>
</suite>`

    files["src/test/resources/application.properties"] =
      `app.base.url=${appConfig.applicationUrl || "http://localhost:3000"}
server.port=0
logging.level.root=INFO
logging.level.${packageName}=DEBUG`

    files["README.md"] = `# ${projectName.toUpperCase()} - API Test Suite

## Overview
Automated API test suite for **${testResult.ticket?.summary || "JIRA Ticket"}** (${ticketKey})

- **Framework**: Spring Boot TestRestTemplate with TestNG
- **Generated**: ${new Date().toLocaleString()}
- **Total Test Cases**: ${testResult.testCases?.length || 0}

## Prerequisites
- Java 17 or higher
- Maven 3.6 or higher

## How to Run

### 1. Import into IDE
- Open your IDE (IntelliJ IDEA, Eclipse, VS Code)
- Import as Maven project
- Wait for dependencies to download

### 2. Update Configuration
Edit \`src/test/resources/application.properties\`:
\`\`\`properties
app.base.url=http://your-api-base-url
\`\`\`

### 3. Run Tests

#### Via IDE:
- Right-click on test class → Run
- Or right-click on \`testng.xml\` → Run

#### Via Maven:
\`\`\`bash
mvn clean test
\`\`\`

## Test Cases Included
${testResult.testCases?.map((tc: any, i: number) => `${i + 1}. **${tc.title}** (${tc.priority} priority) - ${tc.httpMethod} ${tc.apiEndpoint}`).join("\n") || "No test cases available"}

## Support
Generated by JIRA API Test Generator
`

    createZipDownload(files, `${projectName}.zip`)
  }

  const createZipDownload = async (files: { [key: string]: string }, filename: string) => {
    const zip = new JSZip()
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content)
    })
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateSeleniumCode = (testResult: any) => {
    if (!testResult || !testResult.testCases) {
      return undefined
    }

    const baseUrl = appConfig.applicationUrl || "http://localhost:3000"

    return `package com.testing.qaagent.tests;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.testng.AbstractTestNGSpringContextTests;
import org.testng.annotations.Test;
import org.testng.annotations.BeforeMethod;
import org.testng.Assert;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class GeneratedApiTests extends AbstractTestNGSpringContextTests {

    @Autowired
    private TestRestTemplate restTemplate;
    
    private ObjectMapper objectMapper = new ObjectMapper();
    private String baseUrl = "${baseUrl}";
    
    @BeforeMethod
    public void setUp() {
        System.out.println("Setting up API tests for base URL: " + baseUrl);
    }

${testResult.testCases
  .map(
    (testCase: TestCase) => `
    @Test(priority = ${testCase.priority === "High" ? "1" : testCase.priority === "Medium" ? "2" : "3"})
    public void ${testCase.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}() {
        System.out.println("Executing API test: ${testCase.title}");
        
        try {
            // Test: ${testCase.title}
            // API Endpoint: ${testCase.apiEndpoint}
            // HTTP Method: ${testCase.httpMethod}
            // Expected Status: ${testCase.expectedStatusCode}
            
            String endpoint = baseUrl + "${testCase.apiEndpoint}";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            ${
              testCase.requestPayload
                ? `
            // Request payload from JIRA AC
            String requestBody = """
            ${testCase.requestPayload}
            """;
            
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            `
                : `
            HttpEntity<String> request = new HttpEntity<>(headers);
            `
            }
            
            // Execute ${testCase.httpMethod} request
            ResponseEntity<String> response = restTemplate.exchange(
                endpoint,
                HttpMethod.${testCase.httpMethod},
                request,
                String.class
            );
            
            // Verify status code
            Assert.assertEquals(response.getStatusCode().value(), ${testCase.expectedStatusCode}, 
                "Expected status code ${testCase.expectedStatusCode} but got " + response.getStatusCode().value());
            
            ${
              testCase.expectedResponse
                ? `
            // Verify response content
            String responseBody = response.getBody();
            Assert.assertNotNull(responseBody, "Response body should not be null");
            
            // Parse and validate JSON response
            JsonNode responseJson = objectMapper.readTree(responseBody);
            JsonNode expectedJson = objectMapper.readTree("""
            ${testCase.expectedResponse}
            """);
            
            // Validate key fields from expected response
            validateJsonResponse(responseJson, expectedJson);
            `
                : `
            // Verify response is not null
            Assert.assertNotNull(response.getBody(), "Response body should not be null");
            `
            }
            
            System.out.println("✓ API test passed: ${testCase.title}");
            
        } catch (Exception e) {
            System.err.println("✗ API test failed: ${testCase.title}");
            System.err.println("Error: " + e.getMessage());
            Assert.fail("API test failed: " + e.getMessage());
        }
    }`,
  )
  .join("\n")}

    private void validateJsonResponse(JsonNode actual, JsonNode expected) {
        expected.fieldNames().forEachRemaining(fieldName -> {
            Assert.assertTrue(actual.has(fieldName), 
                "Response missing expected field: " + fieldName);
            
            JsonNode expectedValue = expected.get(fieldName);
            JsonNode actualValue = actual.get(fieldName);
            
            if (expectedValue.isTextual()) {
                Assert.assertEquals(actualValue.asText(), expectedValue.asText(),
                    "Field " + fieldName + " value mismatch");
            } else if (expectedValue.isNumber()) {
                Assert.assertEquals(actualValue.asInt(), expectedValue.asInt(),
                    "Field " + fieldName + " value mismatch");
            } else if (expectedValue.isObject()) {
                validateJsonResponse(actualValue, expectedValue);
            } else if (expectedValue.isArray()) {
                Assert.assertTrue(actualValue.isArray(), "Expected an array for field: " + fieldName);
                Assert.assertEquals(actualValue.size(), expectedValue.size(), "Array size mismatch for field: " + fieldName);
                for (int i = 0; i < expectedValue.size(); i++) {
                    validateJsonResponse(actualValue.get(i), expectedValue.get(i));
                }
            }
        });
    }
}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Updated title and description for API focus */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">JIRA API Test Generator</h1>
            <p className="text-lg text-gray-600">Generate comprehensive API test cases from JIRA tickets</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setActiveSection("ai-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "ai-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                AI Configuration
              </button>
              <button
                onClick={() => setActiveSection("jira-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "jira-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                JIRA Configuration
              </button>
              <button
                onClick={() => setActiveSection("app-config")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "app-config" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                App Configuration
              </button>
              <button
                onClick={() => setActiveSection("tickets")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === "tickets" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tickets & Tests
              </button>
            </div>
          </div>

          {activeSection === "ai-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
                  <div className="space-y-2">
                    {/* Updated test types to be API-focused */}
                    {["API", "Integration", "Contract", "Performance", "Security"].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={testTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTestTypes([...testTypes, type])
                            } else {
                              setTestTypes(testTypes.filter((t) => t !== type))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{type.replace("-", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  {/* Updated coverage label and range for API testing */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Test Coverage Level</label>
                  <select
                    value={testCoverage}
                    onChange={(e) => setTestCoverage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic - Core API endpoints</option>
                    <option value="comprehensive">Comprehensive - All endpoints + edge cases</option>
                    <option value="exhaustive">Exhaustive - Full contract validation</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Testing Framework</label>
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="selenium">Selenium WebDriver (for API Project)</option>
                  <option value="cypress">Cypress</option>
                  <option value="playwright">Playwright</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === "jira-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">JIRA Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">JIRA URL</label>
                  <input
                    type="url"
                    value={jiraConfig.url}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                    placeholder="https://your-company.atlassian.net"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={jiraConfig.email}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                    placeholder="your-email@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                  <input
                    type="password"
                    value={jiraConfig.apiToken}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                    placeholder="Your JIRA API token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Key</label>
                  <input
                    type="text"
                    value={jiraConfig.projectKey}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value })}
                    placeholder="PROJ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleJiraConnect}
                  disabled={isConnecting || !jiraConfig.url || !jiraConfig.email || !jiraConfig.apiToken}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Connecting..." : "Connect to JIRA"}
                </button>
                {isConnected && <span className="ml-3 text-green-600 font-medium">✓ Connected</span>}
              </div>
            </div>
          )}

          {activeSection === "app-config" && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Application Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
                  <input
                    type="url"
                    value={appConfig.applicationUrl}
                    onChange={(e) => setAppConfig({ ...appConfig, applicationUrl: e.target.value })}
                    placeholder="https://your-api-base-url.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select
                    value={appConfig.environment}
                    onChange={(e) => setAppConfig({ ...appConfig, environment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "tickets" && (
            <div className="space-y-6">
              {isConnected && tickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">JIRA Tickets</h2>
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center p-3 border rounded-lg">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-blue-600">{ticket.key}</span>
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
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              {ticket.status}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 mt-1">{ticket.summary}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={generateTestCasesOld}
                      disabled={isGenerating || selectedTickets.length === 0}
                      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? "Generating..." : `Generate API Test Cases (${selectedTickets.length})`}
                    </button>
                  </div>
                </div>
              )}

              {generatedTests.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Generated API Test Cases</h2>
                  <div className="space-y-6">
                    {generatedTests.map((testResult, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {testResult.ticket?.key} - {testResult.ticket?.summary}
                            </h3>
                            <p className="text-sm text-gray-600">{testResult.testCases.length} test cases generated</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadTestCases("selenium", testResult)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Download Java API Tests
                            </button>
                            <button
                              onClick={() => downloadTestCases("cypress", testResult)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Download Cypress
                            </button>
                            <button
                              onClick={() => downloadTestCases("json", testResult)}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              Download JSON
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {testResult.testCases.map((testCase, tcIndex) => (
                            <div key={tcIndex} className="bg-gray-50 p-3 rounded">
                              <div className="flex items-center justify-between">
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
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {testCase.type}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{testCase.expectedResults}</p>
                              {/* Displaying API specific details */}
                              <p className="text-sm text-gray-600 mt-1">
                                Endpoint: <strong>{testCase.apiEndpoint}</strong> | Method:{" "}
                                <strong>{testCase.httpMethod}</strong> | Expected Status:{" "}
                                <strong>{testCase.expectedStatusCode}</strong>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No JIRA Connection</h3>
                  <p className="text-gray-600 mb-4">
                    Connect to JIRA to start generating API test cases from your tickets.
                  </p>
                  <button
                    onClick={() => setActiveSection("jira-config")}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Configure JIRA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
