import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { tickets, aiConfig, language } = requestBody

    console.log("[v0] Generating test code for tickets:", tickets?.length || 0)
    console.log("[v0] AI Config:", aiConfig)

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
**Priority:** ${ticket.priority}`,
      )
      .join("\n\n---\n\n")

    const prompt = `You are an expert Java Spring Boot testing engineer. Based on the following JIRA tickets and their acceptance criteria, generate a COMPLETE Spring Boot Maven project with all files needed for immediate execution.

**JIRA Tickets to Generate Tests For:**
${ticketDetails}

**Test Configuration:**
- Test Type: ${aiConfig.testType}
- Coverage Level: ${aiConfig.coverage}%
- Test Case Types: ${aiConfig.testCaseTypes.join(", ")}
- Download Format: ${aiConfig.downloadFormat}

**CRITICAL REQUIREMENTS:**
1. Generate a complete Spring Boot Maven project that can be compiled and run immediately with "mvn test"
2. Include a complete pom.xml with ALL necessary dependencies and correct versions:
   - Spring Boot 3.2.0
   - RestAssured 5.3.2
   - TestNG 7.8.0
   - Jackson for JSON processing
   - Maven Surefire Plugin for test execution
   - All other required dependencies
3. Use RestAssured for API calls, TestNG for test framework, Spring Boot for dependency injection
4. Extract EXACT API endpoints, HTTP methods, request bodies, and expected responses from the acceptance criteria
5. Create realistic test data based on the acceptance criteria
6. Handle both positive and negative test scenarios based on the test case types requested
7. Use proper assertions and error handling
8. Include proper package structure: com.testing.qaagent.api.tests
9. Make test classes extend AbstractTestNGSpringContextTests
10. Include proper @SpringBootTest annotations
11. Add application.properties with necessary configurations
12. Include a main Application class for Spring Boot
13. Generate comprehensive test methods that cover all acceptance criteria
14. Use proper naming conventions for test methods
15. Add proper imports - NO MISSING IMPORTS
16. Ensure all code compiles without errors

**Project Structure Required:**
- pom.xml (with all dependencies and correct versions)
- src/main/java/com/testing/qaagent/Application.java (main Spring Boot class)
- src/test/java/com/testing/qaagent/api/tests/ApiTestSuite.java (main test class)
- src/main/resources/application.properties (Spring Boot configuration)
- README.md (with execution instructions)

**Response Format:**
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
      "path": "src/main/resources/application.properties",
      "content": "# Spring Boot Configuration..."
    },
    {
      "path": "README.md",
      "content": "# API Test Suite..."
    }
  ]
}

**IMPORTANT:** 
- Generate ONLY the JSON response, no explanations or markdown formatting
- Ensure all imports are correct and complete
- Make sure the project can be executed immediately after extraction
- Include proper error handling and logging
- Generate realistic test scenarios based on the actual acceptance criteria provided
- Use proper Spring Boot testing patterns and annotations`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent code generation
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
