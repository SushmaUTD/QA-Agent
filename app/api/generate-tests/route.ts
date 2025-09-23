import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import JSZip from "jszip"

export async function POST(req: Request) {
  try {
    const { tickets, aiConfig, language, jiraConfig, appConfig } = await req.json()

    // Build the enhanced prompt similar to the working Java version
    const buildEnhancedPrompt = () => {
      const ticketDetails = tickets
        .map((ticket: any) => {
          return `
**Ticket: ${ticket.key}**
- **Summary:** ${ticket.summary}
- **Description:** ${ticket.description}
- **Status:** ${ticket.status}
- **Priority:** ${ticket.priority}
- **Acceptance Criteria:**
${ticket.acceptanceCriteria.map((criteria: string) => `  • ${criteria}`).join("\n")}
`
        })
        .join("\n")

      const applicationContext = `
**Application Context:**
- **Base URL:** ${appConfig.baseUrl}
- **Environment:** ${appConfig.environment}
- **Authentication:** ${appConfig.authDetails ? "Bearer Token" : "Basic Auth"}
- **Project:** ${jiraConfig.projectKey}
`

      const requirements = `
**Requirements:**
- Generate ${aiConfig.testType} tests in ${language}
- Target ${aiConfig.coverage}% test coverage
- Include test case types: ${aiConfig.testCaseTypes.join(", ")}
- Output format: ${aiConfig.downloadFormat}
`

      if (aiConfig.downloadFormat === "single-file") {
        return `You are an expert QA automation engineer. Generate comprehensive test cases for the following JIRA tickets.

${applicationContext}

${ticketDetails}

${requirements}

Generate a single Java test class that covers all the tickets. Include proper imports, setup methods, and comprehensive test methods. Use TestNG framework and RestAssured for API testing.

Return only the Java code without any markdown formatting or explanations.`
      } else {
        return `You are an expert QA automation engineer. Generate a complete Spring Boot Maven project with comprehensive test cases for the following JIRA tickets.

${applicationContext}

${ticketDetails}

${requirements}

Generate a complete Spring Boot project structure with the following files:
- pom.xml (Maven configuration with TestNG, RestAssured, Spring Boot Test dependencies)
- src/main/java/com/example/Application.java (Main Spring Boot application class)
- src/test/java/com/example/BaseTest.java (Base test class with common setup)
- src/test/java/com/example/ApiTest.java (Main test class with all test methods)
- src/test/java/com/example/DataProviders.java (Test data providers)
- src/test/resources/application-test.properties (Test configuration)
- src/test/resources/testng.xml (TestNG configuration)
- README.md (Project documentation and setup instructions)

Return the response in the following JSON format:
{
  "files": [
    {
      "path": "pom.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>..."
    },
    {
      "path": "src/main/java/com/example/Application.java",
      "content": "package com.example;..."
    }
  ]
}

Ensure all file contents are properly escaped for JSON. Include comprehensive test methods that cover positive, negative, and edge cases based on the acceptance criteria.`
      }
    }

    const prompt = buildEnhancedPrompt()

    console.log("[v0] Generating tests with OpenAI...")

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      maxOutputTokens: 8000,
      temperature: 0.3,
    })

    console.log("[v0] OpenAI response received, length:", text.length)

    if (aiConfig.downloadFormat === "single-file") {
      // Return the Java file content directly
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="ApiTest-${Date.now()}.java"`,
        },
      })
    } else {
      // Parse JSON and create ZIP file
      console.log("[v0] Parsing JSON response...")

      // Extract JSON from response
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No valid JSON found in response")
      }

      const jsonContent = text.substring(jsonStart, jsonEnd)
      console.log("[v0] Extracted JSON, length:", jsonContent.length)

      const parsedResponse = JSON.parse(jsonContent)

      if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
        throw new Error("Invalid response format: missing files array")
      }

      console.log("[v0] Creating ZIP file with", parsedResponse.files.length, "files")

      // Create ZIP file
      const zip = new JSZip()

      parsedResponse.files.forEach((file: any) => {
        if (file.path && file.content) {
          console.log("[v0] Adding file to ZIP:", file.path)
          zip.file(file.path, file.content)
        }
      })

      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

      console.log("[v0] ZIP file created, size:", zipBuffer.byteLength)

      return new Response(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="spring-boot-tests-${Date.now()}.zip"`,
        },
      })
    }
  } catch (error) {
    console.error("[v0] Test generation error:", error)
    return Response.json(
      {
        success: false,
        error: `Test generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
