import { type NextRequest, NextResponse } from "next/server"
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

    console.log("[v0] OpenAI response length:", generatedContent.length)
    console.log("[v0] OpenAI response preview:", generatedContent.substring(0, 500))

    const zip = new JSZip()

    const filePatterns = [
      /```filename:\s*([^\\n]+)\\n([\\s\\S]*?)```/g,
      /```([^\\n]+\\.(?:java|xml|properties|md))\\n([\\s\\S]*?)```/g,
      /```\\w*\\n\/\/ File: ([^\\n]+)\\n([\\s\\S]*?)```/g,
      /```\\w*\\n# ([^\\n]+)\\n([\\s\\S]*?)```/g,
    ]

    let filesFound = 0

    for (const pattern of filePatterns) {
      let match
      while ((match = pattern.exec(generatedContent)) !== null) {
        let filePath = match[1].trim()
        const fileContent = match[2].trim()

        filePath = filePath.replace(/[<>:"|?*]/g, "_").replace(/\\\\/g, "/")

        console.log("[v0] Adding file to zip:", filePath, "Content length:", fileContent.length)
        zip.file(filePath, fileContent)
        filesFound++
      }

      if (filesFound > 0) {
        console.log("[v0] Found", filesFound, "files using pattern:", pattern.source)
        break
      }
    }

    if (filesFound === 0) {
      console.log("[v0] No files found with patterns, extracting all code blocks")
      const codeBlockRegex = /```(?:\\w+)?\\n([\\s\\S]*?)```/g
      let match
      let blockIndex = 0

      while ((match = codeBlockRegex.exec(generatedContent)) !== null) {
        const content = match[1].trim()
        if (content.length > 50) {
          // Only include substantial content
          const extension = content.includes("<?xml")
            ? "xml"
            : content.includes("package ")
              ? "java"
              : content.includes("# ")
                ? "md"
                : "txt"
          const fileName = `generated-file-${blockIndex}.${extension}`
          console.log("[v0] Adding code block as file:", fileName)
          zip.file(fileName, content)
          filesFound++
          blockIndex++
        }
      }
    }

    console.log("[v0] Total files added to zip:", filesFound)

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return zip file as download
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="spring-boot-tests-${Date.now()}.zip"`,
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
