import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { description, language, ticketKey, summary } = requestBody

    console.log("[v0] Generating test code for:", ticketKey)
    console.log("[v0] Language:", language)
    console.log("[v0] Description length:", description?.length || 0)

    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

    if (!hasApiKey) {
      console.log("[v0] OpenAI API key not found, using fallback")
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not configured",
      })
    }

    const prompt =
      language === "java"
        ? `You are an expert Java API testing engineer. Based on the following JIRA ticket acceptance criteria, generate a COMPLETE Spring Boot project with all files needed for execution.

**JIRA Ticket:** ${ticketKey} - ${summary}
**Acceptance Criteria:**
${description}

**Requirements:**
1. Generate a complete Spring Boot Maven project structure that can be compiled and run immediately
2. Include a complete pom.xml with ALL necessary dependencies (Spring Boot, RestAssured, TestNG, Jackson, etc.)
3. Use RestAssured for API calls, TestNG for test framework, Spring Boot for dependency injection
4. Extract EXACT API endpoints, HTTP methods, request bodies, and expected responses from the acceptance criteria
5. Create realistic test data based on the acceptance criteria
6. Handle both positive and negative test scenarios
7. Use proper assertions and error handling
8. Include application.properties if needed
9. Include a main Application class
10. Make the test class name: ${ticketKey.replace(/-/g, "_")}_ApiTests

**Project Structure Required:**
- pom.xml (with all dependencies)
- src/main/java/com/example/Application.java (main class)
- src/test/java/com/example/${ticketKey.replace(/-/g, "_")}_ApiTests.java (test class)
- src/main/resources/application.properties (if needed)

**Response Format:**
Return the response as a JSON object with this exact structure:
{
  "files": [
    {
      "path": "pom.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>..."
    },
    {
      "path": "src/main/java/com/example/Application.java",
      "content": "package com.example;..."
    },
    {
      "path": "src/test/java/com/example/${ticketKey.replace(/-/g, "_")}_ApiTests.java",
      "content": "package com.example;..."
    },
    {
      "path": "src/main/resources/application.properties",
      "content": "# Application properties..."
    }
  ]
}

Generate ONLY the JSON response, no explanations or markdown formatting.`
        : `You are an expert Python API testing engineer. Based on the following JIRA ticket acceptance criteria, generate a COMPLETE Python project with all files needed for execution.

**JIRA Ticket:** ${ticketKey} - ${summary}
**Acceptance Criteria:**
${description}

**Requirements:**
1. Generate a complete Python project structure that can be run immediately with pytest
2. Include requirements.txt with ALL necessary dependencies (pytest, requests, etc.)
3. Use requests library for API calls, pytest for test framework
4. Extract EXACT API endpoints, HTTP methods, request bodies, and expected responses from the acceptance criteria
5. Create realistic test data based on the acceptance criteria
6. Handle both positive and negative test scenarios
7. Use proper assertions and error handling
8. Include conftest.py if needed for setup
9. Make the test file name: test_${ticketKey.replace(/-/g, "_").toLowerCase()}_api.py

**Project Structure Required:**
- requirements.txt (with all dependencies)
- conftest.py (if needed for setup)
- test_${ticketKey.replace(/-/g, "_").toLowerCase()}_api.py (test file)
- README.md (with execution instructions)

**Response Format:**
Return the response as a JSON object with this exact structure:
{
  "files": [
    {
      "path": "requirements.txt",
      "content": "pytest==7.4.0\\nrequests==2.31.0..."
    },
    {
      "path": "test_${ticketKey.replace(/-/g, "_").toLowerCase()}_api.py",
      "content": "import pytest\\nimport requests..."
    },
    {
      "path": "conftest.py",
      "content": "import pytest..."
    },
    {
      "path": "README.md",
      "content": "# API Tests for ${ticketKey}..."
    }
  ]
}

Generate ONLY the JSON response, no explanations or markdown formatting.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent code generation
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
