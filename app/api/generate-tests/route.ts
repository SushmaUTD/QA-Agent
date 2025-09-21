import { type NextRequest, NextResponse } from "next/server"

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

    const prompt = `Generate a complete Spring Boot Maven project for API testing based on these JIRA tickets.

**APPLICATION CONTEXT:**
- Base URL: ${appConfig?.baseUrl || "http://localhost:8080"}
- Environment: ${appConfig?.environment || "dev"}
- Auth Details: ${appConfig?.authDetails || "Basic Auth"}

**JIRA TICKETS:**
${ticketDetails}

**REQUIREMENTS:**
1. **Valid POM.XML** with Spring Boot 3.2.0, RestAssured 5.3.2, TestNG 7.8.0
2. **Comprehensive Test Cases** - Both positive and negative tests for each acceptance criteria
3. **Complete Project Structure** - Ready to execute with "mvn test"

**OUTPUT FORMAT:**
Provide the complete project structure with all files. Start each file with:
\`\`\`filename: path/to/file.java\`\`\`
[file content]
\`\`\`

Generate ALL necessary files including pom.xml, test classes, configuration files, and README.md.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig?.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Spring Boot test automation expert. Generate complete, production-ready test projects as text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: aiConfig?.temperature || 0.1,
        max_tokens: aiConfig?.maxTokens || 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const generatedContent = data.choices[0].message.content

    return NextResponse.json({
      success: true,
      content: generatedContent,
      projectName: `spring-boot-tests-${Date.now()}`,
    })
  } catch (error) {
    console.error("Test generation error:", error.message || error)
    return NextResponse.json({
      success: false,
      error: `Test generation failed: ${error.message || "Unknown error"}`,
    })
  }
}
