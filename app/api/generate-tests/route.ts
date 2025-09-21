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
1. **Valid POM.XML** with Spring Boot 3.2.0, RestAssured 5.3.2, TestNG 7.8.0, JUnit 5.10.0
2. **Comprehensive Test Cases** - Both positive and negative tests for each acceptance criteria
3. **Complete Project Structure** - Ready to execute with "mvn test"
4. **Proper Maven Directory Structure** - src/main/java, src/test/java, src/main/resources

**OUTPUT FORMAT:**
For each file, use this exact format:

**File: pom.xml**
\`\`\`xml
[pom.xml content here]
\`\`\`

**File: src/main/java/com/example/Application.java**
\`\`\`java
[Application.java content here]
\`\`\`

**File: src/test/java/com/example/ApiTest.java**
\`\`\`java
[test content here]
\`\`\`

Generate ALL necessary files including pom.xml, main application class, test classes, and README.md.`

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

    console.log("[v0] Full OpenAI response:", generatedContent)

    const zip = new JSZip()

    const filePatterns = [
      // Pattern for **File: filename** format
      /\*\*File:\s*([^*\n]+)\*\*\s*```(?:\w+)?\s*\n([\s\S]*?)```/g,
      // Pattern for **filename.ext** format
      /\*\*([^*\n]+\.(java|xml|properties|md))\*\*\s*```(?:\w+)?\s*\n([\s\S]*?)```/g,
      // Pattern for filename: format
      /```filename:\s*([^\n]+)\n([\s\S]*?)```/g,
      // Pattern for file extension detection
      /```(\w+)\n([\s\S]*?)```/g,
    ]

    let filesFound = 0

    for (const pattern of filePatterns) {
      console.log("[v0] Trying pattern:", pattern.source)
      let match
      while ((match = pattern.exec(generatedContent)) !== null) {
        let filePath, fileContent

        if (pattern.source.includes("File:")) {
          // **File: filename** format
          filePath = match[1].trim()
          fileContent = match[2].trim()
        } else if (pattern.source.includes("java|xml")) {
          // **filename.ext** format
          filePath = match[1].trim()
          fileContent = match[3].trim()
        } else if (pattern.source.includes("filename:")) {
          // filename: format
          filePath = match[1].trim()
          fileContent = match[2].trim()
        } else {
          // Extension-based detection
          const extension = match[1]
          fileContent = match[2].trim()

          // Try to determine filename from content
          if (extension === "xml" && fileContent.includes("<modelVersion>")) {
            filePath = "pom.xml"
          } else if (extension === "java" && fileContent.includes("@SpringBootApplication")) {
            filePath = "src/main/java/com/example/Application.java"
          } else if (extension === "java" && fileContent.includes("@Test")) {
            filePath = "src/test/java/com/example/ApiTest.java"
          } else if (extension === "md" || fileContent.includes("# ")) {
            filePath = "README.md"
          } else {
            filePath = `generated-file-${filesFound}.${extension}`
          }
        }

        // Clean up file path
        filePath = filePath.replace(/[<>:"|?*]/g, "_").replace(/\\/g, "/")
        filePath = filePath.replace(/\*\*/g, "").replace(/`/g, "")

        console.log("[v0] Adding file to zip:", filePath, "Content length:", fileContent.length)
        console.log("[v0] File content preview:", fileContent.substring(0, 200))

        zip.file(filePath, fileContent)
        filesFound++
      }

      if (filesFound > 0) {
        console.log("[v0] Found", filesFound, "files using pattern:", pattern.source)
        break
      }
    }

    console.log("[v0] Total files added to zip:", filesFound)

    if (filesFound === 0) {
      return NextResponse.json({
        success: false,
        error: "No files were extracted from OpenAI response",
      })
    }

    console.log("[v0] Generating zip buffer...")
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    console.log("[v0] Zip buffer generated, size:", zipBuffer.length, "bytes")

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="spring-boot-tests-${Date.now()}.zip"`,
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
