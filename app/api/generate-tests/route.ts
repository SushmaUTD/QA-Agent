import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { tickets, aiConfig, language, jiraConfig, appConfig } = requestBody

    console.log("[v0] Generating complete Spring Boot project for tickets:", tickets?.length || 0)

    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

    if (!hasApiKey) {
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

    const prompt = `Generate a complete Spring Boot Maven project for API testing based on these JIRA tickets. Return ONLY a JSON object with this structure:

{
  "files": [
    {
      "path": "pom.xml",
      "content": "complete pom.xml content"
    },
    {
      "path": "src/main/java/com/testing/qaagent/Application.java", 
      "content": "complete Java file content"
    }
    // ... all other files
  ]
}

**APPLICATION CONTEXT:**
- Base URL: ${appConfig?.baseUrl || "http://localhost:8080"}
- Environment: ${appConfig?.environment || "dev"}
- Auth Details: ${appConfig?.authDetails || "Basic Auth"}
- AI Model: ${aiConfig?.model || "gpt-4o-mini"}
- Temperature: ${aiConfig?.temperature || 0.1}
- Max Tokens: ${aiConfig?.maxTokens || 4000}

**JIRA TICKETS:**
${ticketDetails}

**CRITICAL REQUIREMENTS:**

1. **POM.XML REQUIREMENTS:**
   - Use Spring Boot 3.2.0 with valid, compatible dependency versions
   - Include RestAssured 5.3.2, TestNG 7.8.0, Jackson 2.15.2
   - All dependencies MUST have explicit versions (no version ranges)
   - Include maven-surefire-plugin 3.1.2 for test execution
   - Ensure all versions are compatible and production-ready

2. **TEST CASE GENERATION:**
   - Analyze each acceptance criteria thoroughly to extract ALL testable scenarios
   - For EACH function/endpoint, create BOTH positive and negative test cases:
     * **Positive Tests:** Valid inputs, expected success scenarios, boundary conditions
     * **Negative Tests:** Invalid inputs, error conditions, edge cases, security tests
   - Generate realistic test data that matches the business domain
   - Include data validation tests, authentication tests, and error handling tests

3. **COMPREHENSIVE COVERAGE:**
   - Create separate test classes for each major functionality
   - Include integration tests for end-to-end workflows
   - Add performance tests for critical endpoints
   - Generate test data setup and teardown methods
   - Include parameterized tests for multiple input scenarios

4. **PROJECT STRUCTURE:**
   - Complete Spring Boot project with proper package structure
   - Include application.properties for different environments
   - Add README.md with setup and execution instructions
   - Make it immediately executable with "mvn test"
   - Include logging configuration and test reporting

5. **QUALITY STANDARDS:**
   - Follow Java naming conventions and best practices
   - Add comprehensive JavaDoc comments
   - Include assertion messages for better test failure diagnosis
   - Use Page Object Model pattern for UI tests if applicable

Return ONLY the JSON object with complete file contents, no markdown or explanations`

    const { text } = await generateText({
      model: openai(aiConfig?.model || "gpt-4o-mini"),
      prompt,
      temperature: aiConfig?.temperature || 0.1,
      maxTokens: aiConfig?.maxTokens || 4000,
    })

    console.log("[v0] Generated project structure")

    const projectData = JSON.parse(text.trim())

    const zip = new JSZip()

    // Add all files to zip
    projectData.files.forEach((file: { path: string; content: string }) => {
      zip.file(file.path, file.content)
    })

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="spring-boot-test-project.zip"',
        "Content-Length": zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Test generation error:", error.message || error)
    return NextResponse.json({
      success: false,
      error: `Test generation failed: ${error.message || "Unknown error"}`,
    })
  }
}
