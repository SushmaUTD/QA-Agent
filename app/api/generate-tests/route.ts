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

**IMPORTANT: Respond with ONLY a JSON object in this exact format:**
{
  "files": [
    {
      "path": "pom.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<project xmlns=\\"http://maven.apache.org/POM/4.0.0\\"...FULL CONTENT HERE..."
    },
    {
      "path": "src/main/java/com/example/Application.java",
      "content": "package com.example;\\n\\nimport org.springframework.boot.SpringApplication;...FULL CONTENT HERE..."
    },
    {
      "path": "src/test/java/com/example/ApiTest.java", 
      "content": "package com.example;\\n\\nimport org.testng.annotations.Test;...FULL CONTENT HERE..."
    },
    {
      "path": "README.md",
      "content": "# Spring Boot API Test Project\\n\\nThis project contains...FULL CONTENT HERE..."
    }
  ]
}

Generate ALL necessary files. Do NOT include any markdown formatting, explanations, or text outside the JSON object.`

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

    let parsedResponse
    try {
      const jsonStart = generatedContent.indexOf("{")
      const jsonEnd = generatedContent.lastIndexOf("}") + 1
      const jsonContent = generatedContent.slice(jsonStart, jsonEnd)

      console.log("[v0] Extracted JSON content:", jsonContent.substring(0, 200))

      parsedResponse = JSON.parse(jsonContent)
    } catch (error) {
      console.error("[v0] Failed to parse JSON response:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to parse OpenAI response as JSON",
      })
    }

    if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
      return NextResponse.json({
        success: false,
        error: "Invalid response format - missing files array",
      })
    }

    let filesFound = 0
    for (const file of parsedResponse.files) {
      if (!file.path || !file.content) {
        console.warn("[v0] Skipping invalid file:", file)
        continue
      }

      console.log("[v0] Adding file to zip:", file.path, "Content length:", file.content.length)
      console.log("[v0] File content preview:", file.content.substring(0, 200))

      zip.file(file.path, file.content)
      filesFound++
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
