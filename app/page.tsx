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

  // Renamed state variables to match the updates
  const [testTypes, setTestTypes] = useState<string[]>(["functional"])
  const [testCoverage, setTestCoverage] = useState(100)
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
            metadata: result.metadata || {
              ticketKey: ticket.key,
              generatedAt: new Date().toISOString(),
              settings: { coverageLevel: 75, testTypes: ["Functional", "UI", "Edge Case"], framework: "selenium" },
              totalTests: result.testCases.length,
              source: "jira",
            },
          }

          console.log("[v0] Test result created:", testResult)
          console.log("[v0] Test result metadata:", testResult.metadata)
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
    console.log("[v0] Downloading tests for:", testResult)
    console.log("[v0] Test result metadata:", testResult?.metadata)

    if (!testResult || !testResult.metadata) {
      console.error("[v0] Invalid test result or missing metadata")
      return
    }

    const ticketKey = testResult.metadata.ticketKey || "UnknownTicket"

    if (format === "selenium") {
      generateSpringBootProject(testResult, ticketKey)
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

  const generateSpringBootProject = (testResult: TestGenerationResult, ticketKey: string) => {
    const projectName = "qa_agent"
    const packageName = `com.testing.qaagent`
    const className = "InstrumentTests"

    // Create project files
    const files: { [key: string]: string } = {}

    // 1. pom.xml - Maven configuration with all dependencies
    files["pom.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.testing</groupId>
    <artifactId>${projectName}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${projectName}</name>
    <description>Selenium Test Suite for ${testResult.ticket?.summary || "JIRA Ticket"}</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <selenium.version>4.15.0</selenium.version>
        <testng.version>7.8.0</testng.version>
        <spring.boot.version>3.1.5</spring.boot.version>
    </properties>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
        <relativePath/>
    </parent>

    <dependencies>
        <!-- Spring Boot Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- Selenium WebDriver -->
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>

        <!-- WebDriverManager for automatic driver management -->
        <dependency>
            <groupId>io.github.bonigarcia</groupId>
            <artifactId>webdrivermanager</artifactId>
            <version>5.6.2</version>
        </dependency>

        <!-- TestNG -->
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>\${testng.version}</version>
        </dependency>

        <!-- Apache Commons IO for file operations -->
        <dependency>
            <groupId>commons-io</groupId>
            <artifactId>commons-io</artifactId>
            <version>2.11.0</version>
        </dependency>

        <!-- Logging -->
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
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
                <configuration>
                    <suiteXmlFiles>
                        <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                    </suiteXmlFiles>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`

    // 2. Main Application class
    files[`src/main/java/${packageName.replace(/\./g, "/")}/Application.java`] = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`

    // 3. Base Test Configuration
    files[`src/test/java/${packageName.replace(/\./g, "/")}/config/TestConfig.java`] = `package ${packageName}.config;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

import java.time.Duration;

@Configuration
public class TestConfig {
    
    @Value("\${app.base.url:http://localhost:3000}")
    private String baseUrl;
    
    @Bean
    @Scope("prototype")
    public WebDriver webDriver() {
        WebDriverManager.chromedriver().setup();
        
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        // Remove the next line to run in headed mode
        options.addArguments("--headless");
        
        WebDriver driver = new ChromeDriver(options);
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        
        return driver;
    }
    
    @Bean
    public WebDriverWait webDriverWait(WebDriver webDriver) {
        return new WebDriverWait(webDriver, Duration.ofSeconds(15));
    }
    
    public String getBaseUrl() {
        return baseUrl;
    }
}`

    // 4. Base Test Class
    files[`src/test/java/${packageName.replace(/\./g, "/")}/BaseTest.java`] = `package ${packageName};

import ${packageName}.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.testng.AbstractTestNGSpringContextTests;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.Assert;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@SpringBootTest(classes = TestConfig.class)
public abstract class BaseTest extends AbstractTestNGSpringContextTests {
    
    @Autowired
    protected TestConfig testConfig;
    
    protected WebDriver driver;
    protected WebDriverWait wait;
    
    @BeforeMethod
    public void setUp() {
        try {
            driver = testConfig.webDriver();
            wait = testConfig.webDriverWait(driver);
            System.out.println("Test setup completed - WebDriver initialized");
        } catch (Exception e) {
            System.err.println("Failed to initialize WebDriver: " + e.getMessage());
            throw new RuntimeException("WebDriver initialization failed", e);
        }
    }
    
    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
                System.out.println("Test teardown completed - WebDriver closed");
            } catch (Exception e) {
                System.err.println("Error during WebDriver cleanup: " + e.getMessage());
            }
        }
    }
    
    protected void navigateToApp() {
        if (driver == null) {
            throw new RuntimeException("WebDriver is not initialized");
        }
        driver.get(testConfig.getBaseUrl());
        waitForPageLoad();
    }
    
    protected void waitForPageLoad() {
        if (driver == null || wait == null) {
            throw new RuntimeException("WebDriver or WebDriverWait is not initialized");
        }
        wait.until(webDriver -> ((JavascriptExecutor) webDriver)
            .executeScript("return document.readyState").equals("complete"));
    }
    
    protected WebElement findElementSafely(By locator) {
        if (driver == null || wait == null) {
            throw new RuntimeException("WebDriver or WebDriverWait is not initialized");
        }
        try {
            return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
        } catch (Exception e) {
            System.err.println("Element not found: " + locator + " - " + e.getMessage());
            return null;
        }
    }
    
    protected void verifyElementVisible(By locator) {
        if (driver == null || wait == null) {
            throw new RuntimeException("WebDriver or WebDriverWait is not initialized");
        }
        try {
            WebElement element = wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
            Assert.assertNotNull(element, "Element should be visible: " + locator);
            System.out.println("✓ Element verified visible: " + locator);
        } catch (Exception e) {
            System.err.println("Element not visible: " + locator + " - " + e.getMessage());
            takeScreenshot("element_not_visible_" + locator.toString().replaceAll("[^a-zA-Z0-9]", "_"));
            throw new AssertionError("Element not visible: " + locator, e);
        }
    }
    
    protected void verifyTextPresent(String text) {
        if (driver == null) {
            throw new RuntimeException("WebDriver is not initialized");
        }
        try {
            String pageSource = driver.getPageSource();
            Assert.assertTrue(pageSource.contains(text), "Text should be present on page: " + text);
            System.out.println("✓ Text verified present: " + text);
        } catch (Exception e) {
            System.err.println("Text not found on page: " + text);
            takeScreenshot("text_not_found_" + text.replaceAll("[^a-zA-Z0-9]", "_"));
            throw new AssertionError("Text not present: " + text, e);
        }
    }
    
    protected void clickElement(By locator) {
        if (driver == null || wait == null) {
            throw new RuntimeException("WebDriver or WebDriverWait is not initialized");
        }
        try {
            WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));
            element.click();
            System.out.println("✓ Clicked element: " + locator);
        } catch (Exception e) {
            System.err.println("Failed to click element: " + locator + " - " + e.getMessage());
            takeScreenshot("click_failed_" + locator.toString().replaceAll("[^a-zA-Z0-9]", "_"));
            throw new RuntimeException("Failed to click element: " + locator, e);
        }
    }
    
    protected void enterText(By locator, String text) {
        if (driver == null || wait == null) {
            throw new RuntimeException("WebDriver or WebDriverWait is not initialized");
        }
        try {
            WebElement element = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            element.clear();
            element.sendKeys(text);
            System.out.println("✓ Entered text '" + text + "' into element: " + locator);
        } catch (Exception e) {
            System.err.println("Failed to enter text into element: " + locator + " - " + e.getMessage());
            takeScreenshot("text_entry_failed_" + locator.toString().replaceAll("[^a-zA-Z0-9]", "_"));
            throw new RuntimeException("Failed to enter text: " + locator, e);
        }
    }
    
    protected void takeScreenshot(String testName) {
        if (driver == null) {
            System.err.println("Cannot take screenshot: WebDriver is null");
            return;
        }
        
        try {
            TakesScreenshot screenshot = (TakesScreenshot) driver;
            File sourceFile = screenshot.getScreenshotAs(OutputType.FILE);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            File destFile = new File("screenshots/" + testName + "_" + timestamp + ".png");
            
            // Create screenshots directory if it doesn't exist
            destFile.getParentFile().mkdirs();
            
            FileUtils.copyFile(sourceFile, destFile);
            System.out.println("Screenshot saved: " + destFile.getAbsolutePath());
        } catch (Exception e) {
            System.err.println("Failed to take screenshot: " + e.getMessage());
        }
    }
}`

    // 5. Main Test Class with actual test methods
    const seleniumCodeResult = generateSeleniumCode(testResult)
    if (!seleniumCodeResult) {
      console.error("[v0] generateSeleniumCode returned undefined")
      throw new Error("Failed to generate Selenium code")
    }

    const safeTicketKey = testResult.metadata?.ticketKey || "UnknownTicket"
    const cleanClassName = `${safeTicketKey.replace(/-/g, "_")}_Tests`

    files[`src/test/java/${packageName.replace(/\./g, "/")}/tests/${cleanClassName}.java`] = seleniumCodeResult
      .replace(
        /public class \w+_Tests \{/,
        `package ${packageName}.tests;

import ${packageName}.BaseTest;
import org.testng.annotations.Test;
import org.openqa.selenium.By;

/**
 * Automated Test Suite for ${testResult.ticket?.summary || "JIRA Ticket"}
 * Generated on: ${testResult.metadata?.generatedAt || new Date().toISOString()}
 * Framework: Selenium WebDriver with Spring Boot & TestNG
 * Total Test Cases: ${testResult.testCases?.length || 0}
 */
public class ${cleanClassName} extends BaseTest {`,
      )
      .replace(/public static void main\$\$String\[\] args\$\$[^}]*?}\s*/m, "")
      .replace(/public void setUp\$\$\$\$[^}]*?}\s*/m, "")
      .replace(/public void tearDown\$\$\$\$[^}]*?}\s*/m, "")
      .replace(/private void takeScreenshot[^}]*?}\s*/m, "")
      .replace(/private void waitAndClick[^}]*?}\s*/m, "")
      .replace(/private void waitAndSendKeys[^}]*?}\s*/m, "")
      .replace(/private boolean isElementPresent[^}]*?}\s*/m, "")
      .replace(/public void test/g, "@Test\n    public void test")
      .replace(/driver\.get\$\$BASE_URL\$\$;/g, "navigateToApp();")
      .replace(/Thread\.sleep\$\$\d+\$\$;/g, "waitForPageLoad();")

    // 6. TestNG configuration
    files["src/test/resources/testng.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<suite name="${projectName}" verbose="1">
    <test name="${ticketKey} Tests">
        <classes>
            <class name="${packageName}.tests.${cleanClassName}"/>
        </classes>
    </test>
</suite>`

    // 7. Application properties
    files["src/test/resources/application.properties"] = `# Application Configuration
app.base.url=http://localhost:3000

# Logging Configuration
logging.level.root=INFO
logging.level.${packageName}=DEBUG

# Test Configuration
spring.main.web-application-type=none`

    // 8. README.md with instructions
    files["README.md"] = `# ${projectName.toUpperCase()} - Selenium Test Suite

## Overview
Automated test suite for **${testResult.ticket?.summary || "JIRA Ticket"}** (${ticketKey})

- **Framework**: Selenium WebDriver with Spring Boot & TestNG
- **Generated**: ${new Date().toLocaleString()}
- **Total Test Cases**: ${testResult.testCases?.length || 0}

## Prerequisites
- Java 11 or higher
- Maven 3.6 or higher
- Chrome browser installed

## Project Structure
\`\`\`
${projectName}/
├── pom.xml                           # Maven dependencies
├── src/main/java/                    # Main application code
├── src/test/java/                    # Test code
│   ├── config/TestConfig.java        # WebDriver configuration
│   ├── BaseTest.java                 # Base test class
│   └── tests/${cleanClassName}.java       # Test cases
├── src/test/resources/
│   ├── testng.xml                    # TestNG configuration
│   └── application.properties        # Test properties
└── README.md                         # This file
\`\`\`

## How to Run

### 1. Import into IDE
- Open your IDE (IntelliJ IDEA, Eclipse, VS Code)
- Import as Maven project
- Wait for dependencies to download

### 2. Update Configuration
Edit \`src/test/resources/application.properties\`:
\`\`\`properties
app.base.url=http://your-application-url
\`\`\`

### 3. Run Tests

#### Via IDE:
- Right-click on \`${cleanClassName}.java\` → Run
- Or right-click on \`testng.xml\` → Run

#### Via Maven:
\`\`\`bash
mvn clean test
\`\`\`

#### Run specific test:
\`\`\`bash
mvn test -Dtest=${cleanClassName}#testMethodName
\`\`\`

### 4. View Results
- Test results: \`target/surefire-reports/\`
- Screenshots: \`screenshots/\` (on test failures)

## Test Cases Included
${testResult.testCases?.map((tc: any, i: number) => `${i + 1}. **${tc.title}** (${tc.priority} priority)`).join("\n") || "No test cases available"}

## Configuration Options

### Browser Settings
Edit \`TestConfig.java\` to modify browser options:
- Remove \`--headless\` to see browser actions
- Change window size, add extensions, etc.

### Timeouts
Adjust timeouts in \`TestConfig.java\`:
- Implicit wait: Currently 10 seconds
- Explicit wait: Currently 15 seconds

## Troubleshooting

### Common Issues:
1. **ChromeDriver not found**: WebDriverManager handles this automatically
2. **Tests fail**: Check application URL in properties file
3. **Screenshots not saving**: Ensure write permissions in project directory

### Debug Mode:
Set logging level to DEBUG in \`application.properties\`:
\`\`\`properties
logging.level.${packageName}=DEBUG
\`\`\`

## Support
Generated by JIRA Test Case Generator
For issues, check the application logs and screenshots in the \`screenshots/\` directory.
`

    // Create and download ZIP file
    createZipDownload(files, `${projectName}.zip`)
  }

  const createZipDownload = async (files: { [key: string]: string }, filename: string) => {
    // Import JSZip dynamically
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    // Add all files to ZIP
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content)
    })

    // Generate ZIP and download
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

  const generateSeleniumCode = (testResult: TestGenerationResult): string => {
    const ticketKey = testResult.metadata?.ticketKey || "UnknownTicket"
    const safeTicketKey = ticketKey ? String(ticketKey) : "UnknownTicket"
    const className = `${safeTicketKey.replace(/-/g, "_")}_Tests`
    const packageName = `com.testing.qaagent` // Defined here to fix undeclared variable error

    const seleniumCode = `package ${packageName}.tests;

import ${packageName}.BaseTest;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Automated Test Suite for ${testResult.ticket?.summary || "JIRA Ticket"}
 * Generated on: ${testResult.metadata?.generatedAt || new Date().toISOString()}
 * Framework: Selenium WebDriver with Spring Boot & TestNG
 * Total Test Cases: ${testResult.testCases?.length || 0}
 */
public class ${className} extends BaseTest {
    
    // Test methods generated from test cases
${(testResult?.testCases || [])
  .map((testCase, index) => {
    const testMethodName = `test${String(index + 1).padStart(2, "0")}_${testCase.title?.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50) || "TestCase"}`
    const testSteps = generateTestSteps(testCase, testResult.ticket)
    const verification = generateRealSeleniumVerification(testCase, testResult.ticket)

    return `
    @Test(priority = ${index + 1})
    public void ${testMethodName}() {
        System.out.println("Starting test: ${testCase.title}");
        
        try {
            // Navigate to application
            navigateToApp();
            System.out.println("Navigated to application");
            
            // Test preconditions
            ${(testCase.preconditions || []).map((precondition) => `// Precondition: ${precondition}`).join("\n            ")}
            
            // Test steps
            ${testSteps}
            
            // Verify expected result: ${testCase.expectedResults}
            ${verification}
            
            System.out.println("✅ Test passed: ${testCase.title}");
            
        } catch (Exception e) {
            System.err.println("❌ Test failed: ${testCase.title}");
            System.err.println("Error: " + e.getMessage());
            takeScreenshot("${testMethodName}_failed");
            throw e; // Re-throw to mark the test as failed in TestNG
        }
    }`
  })
  .join("")}
}`

    return seleniumCode
  }

  const generateTestSteps = (testCase: any, ticket: any): string => {
    const steps = testCase.steps || []
    let testData = {}
    try {
      testData = testCase.testData ? JSON.parse(testCase.testData) : {}
    } catch (error) {
      console.log("[v0] Failed to parse testData JSON, using empty object:", testCase.testData)
      testData = {}
    }

    if (steps.length === 0) {
      return `// No test steps provided`
    }

    let testStepsCode = ""

    steps.forEach((step: string, index: number) => {
      const stepLower = step.toLowerCase()

      if (stepLower.includes("navigate") && stepLower.includes("add") && stepLower.includes("instrument")) {
        testStepsCode += `
            // Navigate to Add Trading Instrument page
            System.out.println("Looking for Add Instrument button...");
            
            // Try multiple selectors for Add Instrument button (top right corner)
            WebElement addInstrumentButton = findElementSafely(By.xpath(
                "//button[contains(text(), 'Add Instrument')] | " +
                "//a[contains(text(), 'Add Instrument')] | " +
                "//button[contains(text(), 'Add')] | " +
                "//a[contains(text(), 'Add')] | " +
                "//*[@class='btn' and contains(text(), 'Add')] | " +
                "//*[contains(@class, 'add-btn')] | " +
                "//*[contains(@class, 'btn-primary') and contains(text(), 'Add')]"
            ));
            
            if (addInstrumentButton != null) {
                clickElement(addInstrumentButton);
                Thread.sleep(2000); // Wait for page load
                System.out.println("✓ Successfully clicked Add Instrument button");
            } else {
                System.out.println("! Add Instrument button not found, trying direct navigation...");
                driver.get(driver.getCurrentUrl() + "/add-instrument");
                Thread.sleep(2000);
            }`
      } else if (stepLower.includes("enter") && stepLower.includes("symbol")) {
        const symbol = (testData as any)?.symbol || "AAPL"
        testStepsCode += `
            // Enter stock symbol
            System.out.println("Entering stock symbol: ${symbol}");
            WebElement symbolField = findElementSafely(By.xpath(
                "//input[@name='symbol'] | " +
                "//input[@id='symbol'] | " +
                "//input[contains(@placeholder, 'symbol')] | " +
                "//input[contains(@placeholder, 'Symbol')] | " +
                "//input[@type='text'][1]"
            ));
            
            if (symbolField != null) {
                enterText(symbolField, "${symbol}");
                System.out.println("✓ Entered stock symbol: ${symbol}");
            } else {
                throw new RuntimeException("Could not find symbol input field");
            }`
      } else if (stepLower.includes("enter") && stepLower.includes("company")) {
        const companyName = (testData as any)?.companyName || "Apple Inc."
        testStepsCode += `
            // Enter company name
            System.out.println("Entering company name: ${companyName}");
            WebElement companyField = findElementSafely(By.xpath(
                "//input[@name='companyName'] | " +
                "//input[@name='company'] | " +
                "//input[@id='companyName'] | " +
                "//input[@id='company'] | " +
                "//input[contains(@placeholder, 'company')] | " +
                "//input[contains(@placeholder, 'Company')] | " +
                "//input[@type='text'][2]"
            ));
            
            if (companyField != null) {
                enterText(companyField, "${companyName}");
                System.out.println("✓ Entered company name: ${companyName}");
            } else {
                throw new RuntimeException("Could not find company name input field");
            }`
      } else if (stepLower.includes("select") && stepLower.includes("type")) {
        const instrumentType = (testData as any)?.type || "Stock"
        testStepsCode += `
            // Select instrument type
            System.out.println("Selecting instrument type: ${instrumentType}");
            WebElement typeDropdown = findElementSafely(By.xpath(
                "//select[@name='type'] | " +
                "//select[@name='instrumentType'] | " +
                "//select[@id='type'] | " +
                "//select[@id='instrumentType'] | " +
                "//select[contains(@class, 'type')]"
            ));
            
            if (typeDropdown != null) {
                Select select = new Select(typeDropdown);
                select.selectByVisibleText("${instrumentType}");
                System.out.println("✓ Selected instrument type: ${instrumentType}");
            } else {
                System.out.println("! Instrument type dropdown not found - may be optional");
            }`
      } else if (stepLower.includes("click") && stepLower.includes("add instrument")) {
        testStepsCode += `
            // Click Add Instrument submit button
            System.out.println("Looking for submit button...");
            WebElement submitButton = findElementSafely(By.xpath(
                "//button[contains(text(), 'Add Instrument')] | " +
                "//button[contains(text(), 'Save')] | " +
                "//button[contains(text(), 'Create')] | " +
                "//button[contains(text(), 'Submit')] | " +
                "//button[@type='submit'] | " +
                "//input[@type='submit'] | " +
                "//*[contains(@class, 'btn-primary')]"
            ));
            
            if (submitButton != null) {
                clickElement(submitButton);
                Thread.sleep(3000); // Wait for form submission
                System.out.println("✓ Successfully submitted the form");
            } else {
                throw new RuntimeException("Could not find submit button");
            }`
      } else if (stepLower.includes("verify") || stepLower.includes("check")) {
        testStepsCode += `
            // Verification: ${step}
            System.out.println("Performing verification...");
            
            // Check for success message or new instrument in list
            WebElement successIndicator = findElementSafely(By.xpath(
                "//*[contains(text(), 'successfully')] | " +
                "//*[contains(text(), 'Success')] | " +
                "//*[contains(text(), 'added')] | " +
                "//*[contains(@class, 'success')] | " +
                "//*[contains(@class, 'alert-success')] | " +
                "//table//td[contains(text(), 'AAPL')] | " +
                "//div[contains(@class, 'instrument-list')]//div[contains(text(), 'AAPL')]"
            ));
            
            if (successIndicator != null) {
                System.out.println("✓ Verification passed: " + successIndicator.getText());
            } else {
                System.out.println("! Verification warning: Success indicator not found, but no error occurred");
            }`
      }
    })

    return testStepsCode
  }

  const generateRealSeleniumVerification = (testCase: TestCase, ticket?: JiraTicket) => {
    const expectedResult = testCase.expectedResults.toLowerCase()
    const ticketSummary = ticket?.summary?.toLowerCase() || ""

    if (ticketSummary.includes("add") || ticketSummary.includes("create") || ticketSummary.includes("new")) {
      if (ticketSummary.includes("instrument")) {
        return `            // Verify new instrument was added successfully
            Thread.sleep(2000); // Wait for save operation
            try {
                verifyTextPresent("successfully");
                System.out.println("✓ Success message found");
            } catch (Exception e) {
                // Alternative: check if we're redirected to list page
                if (driver.getCurrentUrl().contains("list") || driver.getCurrentUrl().contains("instruments")) {
                    System.out.println("✓ Redirected to instruments list");
                } else {
                    // Check for the newly added instrument in the page
                    verifyElementVisible(By.xpath("//td[contains(text(), 'Test Instrument')] | //div[contains(text(), 'Test Instrument')]"));
                    System.out.println("✓ New instrument visible in list");
                }
            }`
      } else {
        return `            // Verify item was created successfully
            Thread.sleep(2000);
            try {
                verifyTextPresent("success");
                System.out.println("✓ Success message displayed");
            } catch (Exception e) {
                // Check for redirect or new item in list
                verifyElementVisible(By.xpath("//div[contains(@class, 'success')] | //div[contains(text(), 'created')]"));
                System.out.println("✓ Creation confirmed");
            }`
      }
    } else if (expectedResult.includes("login") || expectedResult.includes("authenticated")) {
      return `            // Verify successful login
            wait.until(ExpectedConditions.urlContains("dashboard"));
            verifyElementVisible(By.xpath("//div[contains(@class, 'user-menu')] | //button[contains(text(), 'Logout')] | //span[contains(text(), 'Welcome')]"));
            System.out.println("✓ User successfully logged in");`
    } else if (expectedResult.includes("error") || expectedResult.includes("fail")) {
      return `            // Verify error is displayed
            verifyElementVisible(By.xpath("//div[contains(@class, 'error')] | //div[contains(@class, 'alert-danger')]"));
            verifyTextPresent("error");
            System.out.println("✓ Error message displayed as expected");`
    } else if (expectedResult.includes("redirect") || expectedResult.includes("navigate")) {
      return `            // Verify page redirection
            wait.until(ExpectedConditions.not(ExpectedConditions.urlToBe(driver.getCurrentUrl())));
            System.out.println("✓ Page redirected successfully to: " + driver.getCurrentUrl());`
    } else if (
      expectedResult.includes("display") ||
      expectedResult.includes("show") ||
      expectedResult.includes("visible")
    ) {
      return `            // Verify content is displayed
            verifyElementVisible(By.xpath("//div[contains(@class, 'content')] | //main | //section"));
            System.out.println("✓ Content displayed successfully");
            
            // Take screenshot of final result
            takeScreenshot("test_result_success");`
    } else {
      return `            // Generic verification: ${testCase.expectedResults}
            // Verify page is functional and no errors occurred
            verifyElementVisible(By.tagName("body"));
            
            // Check that no error messages are present
            List<WebElement> errorElements = driver.findElements(By.xpath("//div[contains(@class, 'error')] | //div[contains(text(), 'Error')]"));
            if (errorElements.size() > 0) {
                throw new RuntimeException("Unexpected error found on page");
            }
            
            System.out.println("✓ Test completed successfully - no errors detected");
            takeScreenshot("test_completion");`
    }
  }

  const generateCypressCode = (testResult: TestGenerationResult) => {
    const ticketKey = testResult?.metadata?.ticketKey || "UnknownTicket"
    const generatedAt = testResult?.metadata?.generatedAt || new Date().toISOString()

    return `// Cypress tests for ${ticketKey}
// Generated on ${new Date(generatedAt).toLocaleString()}
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

  const downloadAllTests = () => {
    if (generatedTests.length === 0) {
      alert("No test cases to download")
      return
    }

    const allTestCode = generatedTests.map(generateSeleniumCode).join("\n\n")
    const testTypeString = Array.isArray(testTypes) && testTypes.length > 0 ? testTypes.join("_") : "AllTypes"
    const frameworkString = selectedFramework || "selenium"
    const percentageString = testCoverage || 75

    const blob = new Blob([allTestCode], { type: "text/java" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${frameworkString}_test_suite_${testTypeString}_${percentageString}percent.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // The following function was duplicated and caused a linting error.
  // The first definition is kept, and this one is removed.
  // const downloadSelenium = () => {
  //   if (generatedTests.length === 0) return

  //   const generateSeleniumCode = (test: any) => {
  //     const className = `${test.title.replace(/[^a-zA-Z0-9]/g, "")}Test`

  //     let testMethods = ""

  //     // Generate different test methods based on selected test types
  //     testTypes.forEach((type) => {
  //       switch (type) {
  //         case "functional":
  //           testMethods += `
  //   @Test
  //   public void test${test.title.replace(/[^a-zA-Z0-9]/g, "")}Functional() {
  //       System.out.println("Starting functional test: ${test.title}");

  //       // Navigate to application
  //       driver.get("${appConfig.applicationUrl}");

  //       // Perform functional test steps
  //       ${test.steps
  //         .map((step: string, index: number) => {
  //           if (step.toLowerCase().includes("click") || step.toLowerCase().includes("button")) {
  //             const elementName = step.match(/click\s+(?:on\s+)?(?:the\s+)?([^.]+)/i)?.[1] || "button"
  //             return `        // Step ${index + 1}: ${step}
  //       WebElement ${elementName.replace(/\s+/g, "")}Element = waitForElement(By.xpath("//button[contains(text(),'${elementName}')]"));
  //       ${elementName.replace(/\s+/g, "")}Element.click();
  //       Thread.sleep(1000);`
  //           } else if (
  //             step.toLowerCase().includes("enter") ||
  //             step.toLowerCase().includes("input") ||
  //             step.toLowerCase().includes("fill")
  //           ) {
  //             const fieldMatch = step.match(/(?:enter|input|fill)\s+(?:in\s+)?(?:the\s+)?([^.]+)/i)
  //             const fieldName = fieldMatch?.[1] || "field"
  //             return `        // Step ${index + 1}: ${step}
  //       WebElement ${fieldName.replace(/\s+/g, "")}Field = waitForElement(By.name("${fieldName.toLowerCase().replace(/\s+/g, "_")}"));
  //       ${fieldName.replace(/\s+/g, "")}Field.clear();
  //       ${fieldName.replace(/\s+/g, "")}Field.sendKeys("Test Data ${index + 1}");`
  //           } else if (step.toLowerCase().includes("verify") || step.toLowerCase().includes("check")) {
  //             const elementMatch = step.match(/(?:verify|check)\s+(?:that\s+)?([^.]+)/i)
  //             const elementName = elementMatch?.[1] || "element"
  //             return `        // Step ${index + 1}: ${step}
  //       WebElement ${elementName.replace(/\s+/g, "")}Element = waitForElement(By.xpath("//*[contains(text(),'${elementName}')]"));
  //       Assert.assertTrue("${elementName} should be visible", ${elementName.replace(/\s+/g, "")}Element.isDisplayed());`
  //           } else {
  //             return `        // Step ${index + 1}: ${step}
  //       // Custom implementation needed for: ${step}`
  //           }
  //         })
  //         .join("\n")}

  //       System.out.println("Functional test completed successfully");
  //   }`
  //             break

  //         case "ui":
  //           testMethods += `
  //   @Test
  //   public void test${test.title.replace(/[^a-zA-Z0-9]/g, "")}UI() {
  //       System.out.println("Starting UI test: ${test.title}");

  //       driver.get("${appConfig.applicationUrl}");

  //       // UI-specific validations
  //       Assert.assertTrue("Page title should be present", !driver.getTitle().isEmpty());

  //       // Check responsive design
  //       driver.manage().window().setSize(new Dimension(1920, 1080));
  //       Thread.sleep(500);
  //       driver.manage().window().setSize(new Dimension(768, 1024));
  //       Thread.sleep(500);
  //       driver.manage().window().maximize();

  //       System.out.println("UI test completed successfully");
  //   }`
  //             break

  //         case "edgecase":
  //           testMethods += `
  //   @Test
  //   public void test${test.title.replace(/[^a-zA-Z0-9]/g, "")}EdgeCases() {
  //       System.out.println("Starting edge case test: ${test.title}");

  //       driver.get("${appConfig.applicationUrl}");

  //       // Test with empty inputs
  //       ${test.steps
  //         .filter((step: string) => step.toLowerCase().includes("enter") || step.toLowerCase().includes("input"))
  //         .map((step: string, index: number) => {
  //           const fieldMatch = step.match(/(?:enter|input|fill)\s+(?:in\s+)?(?:the\s+)?([^.]+)/i)
  //           const fieldName = fieldMatch?.[1] || "field"
  //           return `        // Edge case: Empty ${fieldName}
  //       WebElement ${fieldName.replace(/\s+/g, "")}Field = waitForElement(By.name("${fieldName.toLowerCase().replace(/\s+/g, "_")}"));
  //       ${fieldName.replace(/\s+/g, "")}Field.clear();
  //       ${fieldName.replace(/\s+/g, "")}Field.sendKeys("");`
  //         })
  //         .join("\n")}

  //       // Test with invalid data
  //       // Test with maximum length inputs
  //       // Test boundary conditions

  //       System.out.println("Edge case test completed successfully");
  //   }`
  //             break

  //         case "performance":
  //           testMethods += `
  //   @Test
  //   public void test${test.title.replace(/[^a-zA-Z0-9]/g, "")}Performance() {
  //       System.out.println("Starting performance test: ${test.title}");

  //       long startTime = System.currentTimeMillis();

  //       driver.get("${appConfig.applicationUrl}");

  //       long pageLoadTime = System.currentTimeMillis() - startTime;
  //       Assert.assertTrue("Page should load within 5 seconds", pageLoadTime < 5000);

  //       // Measure action performance
  //       ${test.steps
  //         .slice(0, Math.ceil((test.steps.length * testCoverage) / 100))
  //         .map((step: string, index: number) => {
  //           return `        // Performance test for: ${step}
  //       long actionStart = System.currentTimeMillis();
  //       // Perform action here
  //       long actionTime = System.currentTimeMillis() - actionStart;
  //       System.out.println("Action ${index + 1} took: " + actionTime + "ms");`
  //         })
  //         .join("\n")}

  //       System.out.println("Performance test completed successfully");
  //   }`
  //             break
  //       }
  //     })

  //     return `package com.testautomation;

  // import org.openqa.selenium.WebDriver;
  // import org.openqa.selenium.WebElement;
  // import org.openqa.selenium.By;
  // import org.openqa.selenium.chrome.ChromeDriver;
  // import org.openqa.selenium.chrome.ChromeOptions;
  // import org.openqa.selenium.support.ui.WebDriverWait;
  // import org.openqa.selenium.support.ui.ExpectedConditions;
  // import org.openqa.selenium.Dimension;
  // import org.testng.Assert;
  // import org.testng.annotations.*;
  // import java.time.Duration;

  // /**
  //  * Automated Test Suite for: ${test.title}
  //  * Generated from JIRA: ${test.jiraKey}
  //  * Framework: ${selectedFramework.toUpperCase()}
  //  * Test Types: ${testTypes.join(", ")}
  //  * Coverage: ${testCoverage}%
  //  * Environment: ${appConfig.environment}
  //  * Application URL: ${appConfig.applicationUrl}
  //  */
  // public class ${className} {
  //     private WebDriver driver;
  //     private WebDriverWait wait;

  //     @BeforeMethod
  //     public void setUp() {
  //         ChromeOptions options = new ChromeOptions();
  //         options.addArguments("--headless=false"); // Set to true for headless mode
  //         options.addArguments("--no-sandbox");
  //         options.addArguments("--disable-dev-shm-usage");
  //         options.addArguments("--window-size=1920,1080");

  //         driver = new ChromeDriver(options);
  //         wait = new WebDriverWait(driver, Duration.ofSeconds(10));
  //         driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
  //     }

  //     @AfterMethod
  //     public void tearDown() {
  //         if (driver != null) {
  //             driver.quit();
  //         }
  //     }

  //     private WebElement waitForElement(By locator) {
  //         return wait.until(ExpectedConditions.elementToBeClickable(locator));
  //     }

  //     private void takeScreenshot(String testName) {
  //         // Screenshot implementation
  //         System.out.println("Screenshot taken for: " + testName);
  //     }
  //     ${testMethods}

  //     // Main method for standalone execution
  //     public static void main(String[] args) {
  //         ${className} testSuite = new ${className}();

  //         try {
  //             testSuite.setUp();
  //             ${testTypes.map((type) => `testSuite.test${test.title.replace(/[^a-zA-Z0-9]/g, "")}${type.charAt(0).toUpperCase() + type.slice(1)}();`).join("\n            ")}
  //             System.out.println("All tests completed successfully!");
  //         } catch (Exception e) {
  //             System.err.println("Test execution failed: " + e.getMessage());
  //             e.printStackTrace();
  //         } finally {
  //             testSuite.tearDown();
  //         }
  //     }
  // }`
  //   }

  //   const allTestCode = generatedTests.map(generateSeleniumCode).join("\n\n")

  //   const blob = new Blob([allTestCode], { type: "text/java" })
  //   const url = URL.createObjectURL(blob)
  //   const a = document.createElement("a")
  //   a.href = url
  //   a.download = `${selectedFramework}_test_suite_${testTypes.join("_")}_${testCoverage}percent.java`
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  //   URL.revokeObjectURL(url)
  // }

  const generateTestCases = async () => {
    console.log("[v0] Starting test generation...")
    console.log("[v0] Selected tickets:", selectedTickets)

    if (selectedTickets.length === 0) {
      alert("Please select at least one ticket to generate tests for.")
      return
    }

    setIsGenerating(true)
    setGeneratedTests([]) // Clear previous results

    try {
      // Fetch the full ticket objects for the selected IDs
      const selectedTicketObjects = tickets.filter((ticket) => selectedTickets.includes(ticket.id))

      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tickets: selectedTicketObjects, // Send the full ticket objects
          appConfig, // Include appConfig here
          settings: {
            coverageLevel: testCoverage, // Use testCoverage for coverageLevel
            testTypes: testTypes,
            framework: selectedFramework,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] API response:", data)

      if (data.success && data.testCases) {
        const formattedResults = [
          {
            testCases: data.testCases,
            metadata: {
              ticketKey: selectedTickets[0] || "UNKNOWN",
              generatedAt: new Date().toISOString(),
              settings: {},
              totalTests: data.testCases.length,
              source: "jira" as const,
            },
          },
        ]
        setGeneratedTests(formattedResults)
        setActiveSection("test-results")
      } else {
        throw new Error(data.error || "Unknown error during test generation.")
      }
    } catch (error) {
      console.error("[v0] Error generating tests:", error)
      alert(`Error generating tests: ${error.message}`)
    } finally {
      setIsGenerating(false)
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Test Type Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Test Types</label>
                              <div className="space-y-2">
                                {["functional", "ui", "edgecase", "performance"].map((type) => (
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
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Test Percentage */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Test Coverage (%)</label>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="10"
                                value={testCoverage}
                                onChange={(e) => setTestCoverage(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>10%</span>
                                <span className="font-medium text-blue-600">{testCoverage}%</span>
                                <span>100%</span>
                              </div>
                            </div>

                            {/* Framework Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Test Framework</label>
                              <select
                                value={selectedFramework}
                                onChange={(e) => setSelectedFramework(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="selenium">Selenium (Java)</option>
                                <option value="cypress">Cypress (JavaScript)</option>
                                <option value="playwright">Playwright (TypeScript)</option>
                                <option value="testng">TestNG (Java)</option>
                                <option value="junit">JUnit (Java)</option>
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={generateTestCases}
                            disabled={isGenerating || !Array.isArray(testTypes) || testTypes.length === 0}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating
                              ? "🔄 Generating..."
                              : `🚀 Generate ${Array.isArray(testTypes) ? testTypes.join(", ") : "Tests"} Tests (${testCoverage}%)`}
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
                  generatedTests.map((result, index) => {
                    const testCases = result.testCases || []

                    return (
                      <div key={index} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-600">
                              {result?.metadata?.ticketKey || `Test Suite ${index + 1}`}
                            </h3>
                            <p className="text-gray-600">{result?.ticket?.summary || "No summary available"}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Generated {result?.testCases?.length || 0} test cases on{" "}
                              {result?.metadata?.generatedAt
                                ? new Date(result.metadata.generatedAt).toLocaleString()
                                : "Unknown date"}
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
                          {Array.isArray(testCases) ? (
                            testCases.map((testCase, testIndex) => (
                              <div key={testIndex} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {testCase.TestCaseID || testCase.id || `Test Case ${testIndex + 1}`}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      (testCase.Priority || testCase.priority) === "High"
                                        ? "bg-red-100 text-red-800"
                                        : (testCase.Priority || testCase.priority) === "Medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {testCase.Priority || testCase.priority || "Medium"}
                                  </span>
                                </div>
                                <p className="text-gray-700 mb-2">{testCase.Title || testCase.title || "No title"}</p>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <strong>Type:</strong> {testCase.Type || testCase.type || "Functional"}
                                  </p>
                                  <p>
                                    <strong>Preconditions:</strong>{" "}
                                    {testCase.Preconditions || testCase.preconditions || "None specified"}
                                  </p>
                                  <div>
                                    <strong>Steps:</strong>
                                    <ol className="list-decimal list-inside mt-1">
                                      {Array.isArray(testCase.TestSteps || testCase.steps) ? (
                                        (testCase.TestSteps || testCase.steps).map(
                                          (step: string, stepIndex: number) => <li key={stepIndex}>{step}</li>,
                                        )
                                      ) : (
                                        <li>No steps defined</li>
                                      )}
                                    </ol>
                                  </div>
                                  <p>
                                    <strong>Expected Results:</strong>{" "}
                                    {testCase.ExpectedResults ||
                                      testCase.expectedResults ||
                                      "No expected results defined"}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500">No test cases available</div>
                          )}
                        </div>
                      </div>
                    )
                  })
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
