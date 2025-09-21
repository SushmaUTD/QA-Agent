import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { tickets, aiConfig, language, jiraConfig } = requestBody

    console.log("[v0] Generating test code for tickets:", tickets?.length || 0)
    console.log("[v0] AI Config:", aiConfig)
    console.log("[v0] JIRA Config:", jiraConfig)

    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

    if (!hasApiKey) {
      console.log("[v0] OpenAI API key not found, using fallback")
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured",
      })
    }

    const ticketDetails = tickets
      .map(
        (ticket: any) =>
          `**JIRA Ticket:** ${ticket.key} - ${ticket.summary}
**Description:** ${ticket.description}
**Acceptance Criteria:**
${ticket.acceptanceCriteria.map((ac: string) => `- ${ac}`).join("\n")}
**Status:** ${ticket.status}
**Priority:** ${ticket.priority}
**Labels:** ${ticket.labels?.join(", ") || "None"}
**Components:** ${ticket.components?.join(", ") || "None"}
**Epic:** ${ticket.epic || "None"}
**Story Points:** ${ticket.storyPoints || "Not estimated"}`,
      )
      .join("\n\n---\n\n")

    const prompt = `You are an expert Java Spring Boot testing engineer with deep knowledge of API testing, microservices, and enterprise applications. Based on the following JIRA tickets and their acceptance criteria, generate a COMPLETE Spring Boot Maven project with all files needed for immediate execution.

**APPLICATION CONTEXT:**
- JIRA URL: ${jiraConfig?.jiraUrl || "Not specified"}
- Project Key: ${jiraConfig?.projectKey || "Not specified"}
- Environment: ${jiraConfig?.environment || "Development"}
- Base API URL: ${jiraConfig?.baseApiUrl || "http://localhost:8080"}
- Authentication Type: ${jiraConfig?.authType || "Basic Auth"}

**JIRA TICKETS TO GENERATE TESTS FOR:**
${ticketDetails}

**TEST CONFIGURATION:**
- Test Type: ${aiConfig.testType}
- Coverage Level: ${aiConfig.coverage}%
- Test Case Types: ${aiConfig.testCaseTypes.join(", ")}
- Download Format: ${aiConfig.downloadFormat}

**CRITICAL REQUIREMENTS - READ CAREFULLY:**
1. Generate a complete Spring Boot Maven project that can be compiled and run immediately with "mvn test"
2. Include a complete pom.xml with ALL necessary dependencies and EXACT VERSIONS:
   - Spring Boot: 3.2.0
   - RestAssured: 5.3.2
   - TestNG: 7.8.0
   - Jackson: 2.15.2
   - Maven Surefire Plugin: 3.0.0
   - Hamcrest: 2.2
   - JSON Path: 2.8.0
   - All other required dependencies with proper versions
3. ANALYZE the acceptance criteria to extract:
   - EXACT API endpoints (GET /api/users, POST /api/orders, etc.)
   - HTTP methods and request/response formats
   - Sample request payloads and expected responses
   - Authentication requirements
   - Error scenarios and status codes
   - Business rules and validation logic
4. Create REALISTIC test data based on the actual API specifications in acceptance criteria
5. Generate test methods that cover:
   - Happy path scenarios from acceptance criteria
   - Error handling (4xx, 5xx responses)
   - Data validation and business rules
   - Authentication and authorization
   - Edge cases and boundary conditions
6. Use RestAssured with proper assertions:
   - Status code validation
   - Response body validation
   - JSON schema validation where applicable
   - Response time assertions
7. Include proper Spring Boot test configuration:
   - @SpringBootTest with proper web environment
   - @TestPropertySource for test-specific properties
   - Proper test class structure extending AbstractTestNGSpringContextTests
8. Add comprehensive application.properties with:
   - Server configuration
   - Database configuration (H2 for testing)
   - Logging configuration
   - Custom properties for API endpoints
9. Generate test methods with descriptive names that reflect the actual functionality being tested
10. Include proper error handling, logging, and cleanup methods
11. Add data providers for parameterized tests where applicable
12. Ensure ALL imports are correct and complete - NO MISSING IMPORTS
13. Make the code production-ready with proper exception handling

**ENHANCED ANALYSIS INSTRUCTIONS:**
- If acceptance criteria mention specific APIs, extract the exact endpoint paths, methods, and payloads
- If sample JSON is provided in acceptance criteria, use it as test data
- If error scenarios are mentioned, create specific negative test cases
- If authentication is mentioned, include proper auth setup in tests
- If database operations are mentioned, include database validation
- If third-party integrations are mentioned, include mock/stub configurations

**PROJECT STRUCTURE REQUIRED:**
- pom.xml (with all dependencies and exact versions)
- src/main/java/com/testing/qaagent/Application.java (main Spring Boot class)
- src/test/java/com/testing/qaagent/api/tests/ApiTestSuite.java (main test class)
- src/test/java/com/testing/qaagent/api/tests/NegativeTestSuite.java (negative scenarios)
- src/test/java/com/testing/qaagent/api/tests/IntegrationTestSuite.java (integration tests)
- src/main/resources/application.properties (Spring Boot configuration)
- src/test/resources/application-test.properties (test-specific configuration)
- src/test/resources/test-data.json (test data file)
- README.md (with detailed execution instructions)

**RESPONSE FORMAT:**
Return the response as a JSON object with this exact structure:
{
  "files": [
    {
      "path": "pom.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>..."
    },
    {
      "path": "src/main/java/com/testing/qaagent/Application.java",
      "content": "package com.testing.qaagent;..."
    },
    {
      "path": "src/test/java/com/testing/qaagent/api/tests/ApiTestSuite.java",
      "content": "package com.testing.qaagent.api.tests;..."
    },
    {
      "path": "src/test/java/com/testing/qaagent/api/tests/NegativeTestSuite.java",
      "content": "package com.testing.qaagent.api.tests;..."
    },
    {
      "path": "src/test/java/com/testing/qaagent/api/tests/IntegrationTestSuite.java",
      "content": "package com.testing.qaagent.api.tests;..."
    },
    {
      "path": "src/main/resources/application.properties",
      "content": "# Spring Boot Configuration..."
    },
    {
      "path": "src/test/resources/application-test.properties",
      "content": "# Test Configuration..."
    },
    {
      "path": "src/test/resources/test-data.json",
      "content": "{ \\"testData\\": ... }"
    },
    {
      "path": "README.md",
      "content": "# API Test Suite..."
    }
  ]
}

**FINAL INSTRUCTIONS:**
- Generate ONLY the JSON response, no explanations or markdown formatting
- Ensure all imports are correct and complete
- Make sure the project can be executed immediately after extraction
- Include proper error handling and comprehensive logging
- Generate realistic test scenarios based on the EXACT acceptance criteria provided
- Use proper Spring Boot testing patterns and annotations
- Let OpenAI do the heavy lifting - analyze the acceptance criteria deeply and generate comprehensive, executable tests
- Focus on quality over quantity - make each test meaningful and based on real requirements`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.1, // Lower temperature for more consistent code generation
    })

    console.log("[v0] Generated code length:", text.length)

    const responseJson = JSON.parse(text.trim())

    return NextResponse.json(responseJson)
  } catch (error) {
    console.error("Test generation error:", error.message || error)

    return NextResponse.json({
      success: false,
      error: `Test generation failed: ${error.message || "Unknown error"}`,
    })
  }
}
