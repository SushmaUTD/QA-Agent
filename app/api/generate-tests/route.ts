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

**JIRA TICKETS:**
${ticketDetails}

**REQUIREMENTS:**
1. Complete Spring Boot 3.2.0 project with RestAssured 5.3.2, TestNG 7.8.0
2. Analyze acceptance criteria to extract exact API endpoints and test scenarios
3. Generate realistic test data and comprehensive test methods
4. Include pom.xml, main Application.java, test classes, properties files, README.md
5. Make it immediately executable with "mvn test"
6. Return ONLY the JSON object, no markdown or explanations`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.1,
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
