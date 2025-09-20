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
        ? `You are an expert Java API testing engineer. Based on the following JIRA ticket acceptance criteria, generate a complete, executable Java test class using Spring Boot, RestAssured, and TestNG.

**JIRA Ticket:** ${ticketKey} - ${summary}
**Acceptance Criteria:**
${description}

**Requirements:**
1. Generate a complete Java test class that can be compiled and run immediately
2. Use RestAssured for API calls, TestNG for test framework, Spring Boot for dependency injection
3. Extract EXACT API endpoints, HTTP methods, request bodies, and expected responses from the acceptance criteria
4. Include all necessary imports
5. Create realistic test data based on the acceptance criteria
6. Handle both positive and negative test scenarios
7. Use proper assertions and error handling
8. Make the class name: ${ticketKey.replace(/-/g, "_")}_ApiTests

Generate ONLY the Java code, no explanations or markdown formatting.`
        : `You are an expert Python API testing engineer. Based on the following JIRA ticket acceptance criteria, generate a complete, executable Python test file using pytest and requests.

**JIRA Ticket:** ${ticketKey} - ${summary}
**Acceptance Criteria:**
${description}

**Requirements:**
1. Generate a complete Python test file that can be run immediately with pytest
2. Use requests library for API calls, pytest for test framework
3. Extract EXACT API endpoints, HTTP methods, request bodies, and expected responses from the acceptance criteria
4. Include all necessary imports
5. Create realistic test data based on the acceptance criteria
6. Handle both positive and negative test scenarios
7. Use proper assertions and error handling
8. Include setup and teardown methods if needed

Generate ONLY the Python code, no explanations or markdown formatting.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent code generation
    })

    console.log("[v0] Generated code length:", text.length)

    return NextResponse.json({
      success: true,
      code: text.trim(),
    })
  } catch (error) {
    console.error("Test generation error:", error.message || error)

    return NextResponse.json({
      success: false,
      error: `Test generation failed: ${error.message || "Unknown error"}`,
    })
  }
}
