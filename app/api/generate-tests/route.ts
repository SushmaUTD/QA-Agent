import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  let ticket = {}
  let settings = {}

  try {
    const requestBody = await request.json()
    ticket = requestBody.ticket || {}
    settings = requestBody.settings || {}

    console.log("[v0] Environment check:")
    console.log("[v0] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
    console.log("[v0] OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0)
    console.log(
      "[v0] All env keys:",
      Object.keys(process.env).filter((key) => key.includes("OPENAI")),
    )

    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ""

    if (!hasApiKey) {
      console.log("[v0] OpenAI API key not found, using fallback test generation")
      return NextResponse.json({
        success: true,
        testCases: generateFallbackTests(ticket, settings),
        metadata: {
          ticketKey: ticket.key,
          generatedAt: new Date().toISOString(),
          settings,
          totalTests: generateFallbackTests(ticket, settings).length,
          usingFallback: true,
        },
      })
    }

    console.log("[v0] OpenAI API key found, using AI generation")

    const safeSettings = {
      coverageLevel: settings.coverageLevel || "Basic",
      testTypes: Array.isArray(settings.testTypes) ? settings.testTypes : ["Functional"],
      framework: settings.framework || "Selenium",
      ...settings,
    }

    const prompt = `You are an expert API testing engineer. Analyze this JIRA ticket and extract specific API contract details to generate comprehensive API test cases:

**Ticket:** ${ticket.summary}
**Description:** ${ticket.description}
**Acceptance Criteria:** ${ticket.acceptanceCriteria}
**Priority:** ${ticket.priority}
**Type:** ${ticket.type}

**IMPORTANT: Extract the following API contract details from the Acceptance Criteria:**
1. API Endpoints (URLs/paths)
2. HTTP Methods (GET, POST, PUT, DELETE)
3. Request body structure and required fields
4. Expected response format and status codes
5. Authentication requirements
6. Validation rules and error scenarios

**Test Generation Settings:**
- Coverage Level: ${safeSettings.coverageLevel}
- Test Types: ${safeSettings.testTypes.join(", ")}
- Framework: ${safeSettings.framework}

Generate ${safeSettings.coverageLevel === "Basic" ? "5-7" : safeSettings.coverageLevel === "Comprehensive" ? "10-15" : "15-20"} detailed API test cases that cover:
1. Happy path API calls with valid data
2. Validation scenarios with invalid/missing data
3. Authentication and authorization tests
4. Error handling and edge cases
5. Response format validation

For each test case, provide:
- Test Case ID (format: TC_${ticket.key}_001)
- Title (clear, descriptive)
- Priority (High/Medium/Low)
- Type (${safeSettings.testTypes.join("/")})
- API Endpoint (exact URL from acceptance criteria)
- HTTP Method (GET/POST/PUT/DELETE)
- Request Body (JSON structure if applicable)
- Expected Status Code (200, 201, 400, 404, etc.)
- Expected Response (structure/content)
- Preconditions
- Test Steps (API call sequence)
- Validation Points

**CRITICAL: Use the EXACT API endpoints, request formats, and response structures mentioned in the Acceptance Criteria. Do not use generic or placeholder values.**

Return the response as a JSON array of test case objects with these additional API-specific fields:
- endpoint: string
- httpMethod: string  
- requestBody: object or null
- expectedStatusCode: number
- expectedResponse: object or string`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    })

    // Parse the AI response and structure it
    let testCases
    try {
      let cleanedText = text.trim()

      // Remove markdown code blocks more thoroughly
      cleanedText = cleanedText.replace(/```json\s*/gi, "")
      cleanedText = cleanedText.replace(/```\s*/g, "")

      // Remove any leading/trailing text that might not be JSON
      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]")

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      }

      console.log("[v0] Attempting to parse cleaned JSON:", cleanedText.substring(0, 200) + "...")

      const rawTestCases = JSON.parse(cleanedText)
      testCases = Array.isArray(rawTestCases) ? rawTestCases.map(normalizeTestCase) : [normalizeTestCase(rawTestCases)]

      console.log("[v0] Successfully parsed", testCases.length, "test cases from AI response")
    } catch (parseError) {
      console.log("[v0] JSON parsing failed:", parseError.message)
      console.log("[v0] Raw AI response:", text.substring(0, 500) + "...")

      testCases = parseTestCasesFromText(text, ticket.key)
      console.log("[v0] Fallback parsing generated", testCases.length, "test cases")
    }

    console.log("[v0] AI generation successful, generated", testCases.length, "test cases")

    return NextResponse.json({
      success: true,
      testCases,
      metadata: {
        ticketKey: ticket.key,
        generatedAt: new Date().toISOString(),
        settings: safeSettings,
        totalTests: testCases.length,
        usingFallback: false,
      },
    })
  } catch (error) {
    console.error("Test generation error:", error.message || error)
    console.error("Error stack:", error.stack)

    const safeSettings = {
      coverageLevel: settings?.coverageLevel || "Basic",
      testTypes: Array.isArray(settings?.testTypes) ? settings.testTypes : ["Functional"],
      framework: settings?.framework || "Selenium",
      ...settings,
    }

    const fallbackResponse = {
      success: true,
      testCases: generateFallbackTests(ticket, safeSettings),
      metadata: {
        ticketKey: ticket?.key || "ERROR",
        generatedAt: new Date().toISOString(),
        settings: safeSettings,
        totalTests: generateFallbackTests(ticket, safeSettings).length,
        usingFallback: true,
        error: `AI generation failed: ${error.message || "Unknown error"}`,
      },
    }

    console.log("[v0] Returning fallback response with", fallbackResponse.testCases.length, "test cases")
    return NextResponse.json(fallbackResponse)
  }
}

function parseTestCasesFromText(text: string, ticketKey: string) {
  console.log("[v0] Attempting to parse test cases from text response")

  try {
    const lines = text.split("\n").filter((line) => line.trim())
    const testCases = []
    let currentTestCase = null

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Look for test case IDs or titles
      if (trimmedLine.match(/^(TC_|Test Case|Title:|ID:)/i)) {
        if (currentTestCase) {
          testCases.push(normalizeTestCase(currentTestCase))
        }
        currentTestCase = {
          id: `TC_${ticketKey}_${String(testCases.length + 1).padStart(3, "0")}`,
          title: trimmedLine.replace(/^(TC_.*?:|Test Case.*?:|Title:|ID:)/i, "").trim(),
          priority: "Medium",
          type: "Functional",
          endpoint: "",
          httpMethod: "",
          requestBody: null,
          expectedStatusCode: 200,
          expectedResponse: "",
          preconditions: [],
          steps: [],
          validationPoints: [],
        }
      } else if (currentTestCase) {
        // Add content to current test case
        if (trimmedLine.match(/^(Priority:|Type:|Endpoint:|HTTP Method:|Expected Status Code:)/i)) {
          const value = trimmedLine.split(":")[1]?.trim()
          if (trimmedLine.toLowerCase().includes("priority")) {
            currentTestCase.priority = value || "Medium"
          } else if (trimmedLine.toLowerCase().includes("type")) {
            currentTestCase.type = value || "Functional"
          } else if (trimmedLine.toLowerCase().includes("endpoint")) {
            currentTestCase.endpoint = value || ""
          } else if (trimmedLine.toLowerCase().includes("http method")) {
            currentTestCase.httpMethod = value || ""
          } else if (trimmedLine.toLowerCase().includes("expected status code")) {
            currentTestCase.expectedStatusCode = Number.parseInt(value || "200", 10) || 200
          }
        } else if (
          trimmedLine.match(/^(Steps?:|Preconditions?:|Validation Points?:|Expected Response?:|Request Body?:)/i)
        ) {
          // Handle steps, preconditions, validation points, expected response, request body
          if (trimmedLine.toLowerCase().includes("step")) {
            currentTestCase.steps.push(trimmedLine.replace(/^Steps?:/i, "").trim())
          } else if (trimmedLine.toLowerCase().includes("precondition")) {
            currentTestCase.preconditions.push(trimmedLine.replace(/^Preconditions?:/i, "").trim())
          } else if (trimmedLine.toLowerCase().includes("validation points")) {
            currentTestCase.validationPoints.push(trimmedLine.replace(/^Validation Points?:/i, "").trim())
          } else if (trimmedLine.toLowerCase().includes("expected response")) {
            currentTestCase.expectedResponse = trimmedLine.replace(/^Expected Response.*?:/i, "").trim()
          } else if (trimmedLine.toLowerCase().includes("request body")) {
            try {
              currentTestCase.requestBody = JSON.parse(trimmedLine.replace(/^Request Body.*?:/i, "").trim())
            } catch (e) {
              currentTestCase.requestBody = null
            }
          }
        }
      }
    }

    // Add the last test case
    if (currentTestCase) {
      testCases.push(normalizeTestCase(currentTestCase))
    }

    if (testCases.length > 0) {
      console.log("[v0] Successfully parsed", testCases.length, "test cases from text")
      return testCases
    }
  } catch (textParseError) {
    console.log("[v0] Text parsing also failed:", textParseError.message)
  }

  // If all parsing fails, use fallback with proper ticket context
  console.log("[v0] Using fallback tests for ticket:", ticketKey)
  return generateFallbackTests({ key: ticketKey }, {})
}

function generateFallbackTests(ticket?: any, settings?: any) {
  const ticketKey = ticket?.key || "DEMO"
  const ticketSummary = ticket?.summary || "Add New Trading Instrument"

  // Generate realistic test cases for trading instrument functionality
  const tradingInstrumentTests = [
    {
      id: `TC_${ticketKey}_001`,
      title: "Verify user can add a new stock trading instrument",
      priority: "High",
      type: "Functional",
      endpoint: "/api/instruments",
      httpMethod: "POST",
      requestBody: {
        symbol: "AAPL",
        name: "Apple Inc.",
        type: "Stock",
        tradingHours: "9:30-16:00 EST",
      },
      expectedStatusCode: 201,
      expectedResponse: "New trading instrument added successfully",
      preconditions: [
        "User is logged into the trading platform",
        "User has admin privileges to add instruments",
        "Trading instrument database is accessible",
      ],
      steps: [
        "Send POST request to /api/instruments with stock details",
        "Check response status code",
        "Verify new instrument is added to the database",
      ],
      validationPoints: ["Response status code should be 201", "New instrument should be present in the database"],
    },
    {
      id: `TC_${ticketKey}_002`,
      title: "Verify validation for duplicate trading instrument symbols",
      priority: "High",
      type: "Negative",
      endpoint: "/api/instruments",
      httpMethod: "POST",
      requestBody: {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        type: "Stock",
      },
      expectedStatusCode: 400,
      expectedResponse: "Trading instrument with this symbol already exists",
      preconditions: [
        "User is on the 'Add Trading Instrument' page",
        "A trading instrument with symbol 'MSFT' already exists",
      ],
      steps: [
        "Send POST request to /api/instruments with existing stock symbol",
        "Check response status code",
        "Verify error message is returned",
      ],
      validationPoints: ["Response status code should be 400", "Error message should indicate duplicate symbol"],
    },
    {
      id: `TC_${ticketKey}_003`,
      title: "Verify required field validation for trading instrument",
      priority: "Medium",
      type: "Validation",
      endpoint: "/api/instruments",
      httpMethod: "POST",
      requestBody: null,
      expectedStatusCode: 400,
      expectedResponse: "Validation failed for required fields",
      preconditions: ["User is on the 'Add Trading Instrument' page"],
      steps: [
        "Send POST request to /api/instruments with empty required fields",
        "Check response status code",
        "Verify validation messages are returned",
      ],
      validationPoints: [
        "Response status code should be 400",
        "Validation messages should be returned for empty fields",
      ],
    },
    {
      id: `TC_${ticketKey}_004`,
      title: "Verify adding cryptocurrency trading instrument",
      priority: "Medium",
      type: "Functional",
      endpoint: "/api/instruments",
      httpMethod: "POST",
      requestBody: {
        symbol: "BTC",
        name: "Bitcoin",
        type: "Cryptocurrency",
        tradingHours: "24/7",
      },
      expectedStatusCode: 201,
      expectedResponse: "Cryptocurrency trading instrument added successfully",
      preconditions: [
        "User has access to add cryptocurrency instruments",
        "Cryptocurrency trading is enabled on the platform",
      ],
      steps: [
        "Send POST request to /api/instruments with cryptocurrency details",
        "Check response status code",
        "Verify new cryptocurrency instrument is added",
      ],
      validationPoints: [
        "Response status code should be 201",
        "New cryptocurrency instrument should be present in the database",
      ],
    },
    {
      id: `TC_${ticketKey}_005`,
      title: "Verify trading instrument list updates after adding new instrument",
      priority: "Medium",
      type: "Integration",
      endpoint: "/api/instruments",
      httpMethod: "GET",
      requestBody: null,
      expectedStatusCode: 200,
      expectedResponse: "List of trading instruments",
      preconditions: [
        "User has successfully added a new trading instrument",
        "Trading instruments list page is accessible",
      ],
      steps: [
        "Send GET request to /api/instruments to retrieve the list",
        "Search for the newly added instrument in the response",
        "Verify instrument appears in the list with correct details",
      ],
      validationPoints: ["Response status code should be 200", "Newly added instrument should be present in the list"],
    },
  ]

  return tradingInstrumentTests
}

function normalizeTestCase(rawTestCase: any): any {
  return {
    id: rawTestCase.id || rawTestCase["Test Case ID"] || rawTestCase["testCaseId"] || `TC_${Date.now()}`,
    title: rawTestCase.title || rawTestCase["Title"] || rawTestCase["Test Title"] || "Untitled Test",
    priority: rawTestCase.priority || rawTestCase["Priority"] || "Medium",
    type: rawTestCase.type || rawTestCase["Type"] || rawTestCase["Test Type"] || "Functional",
    endpoint: rawTestCase.endpoint || "",
    httpMethod: rawTestCase.httpMethod || "",
    requestBody: typeof rawTestCase.requestBody === "object" ? rawTestCase.requestBody : null,
    expectedStatusCode: rawTestCase.expectedStatusCode || 200,
    expectedResponse: rawTestCase.expectedResponse || "",
    preconditions: Array.isArray(rawTestCase.preconditions)
      ? rawTestCase.preconditions
      : Array.isArray(rawTestCase["Preconditions"])
        ? rawTestCase["Preconditions"]
        : typeof rawTestCase.preconditions === "string"
          ? [rawTestCase.preconditions]
          : typeof rawTestCase["Preconditions"] === "string"
            ? [rawTestCase["Preconditions"]]
            : ["No preconditions specified"],
    steps: Array.isArray(rawTestCase.steps)
      ? rawTestCase.steps
      : Array.isArray(rawTestCase["Test Steps"])
        ? rawTestCase["Test Steps"]
        : Array.isArray(rawTestCase["Steps"])
          ? rawTestCase["Steps"]
          : ["No steps specified"],
    validationPoints: Array.isArray(rawTestCase.validationPoints)
      ? rawTestCase.validationPoints
      : Array.isArray(rawTestCase["Validation Points"])
        ? rawTestCase["Validation Points"]
        : typeof rawTestCase.validationPoints === "string"
          ? [rawTestCase.validationPoints]
          : typeof rawTestCase["Validation Points"] === "string"
            ? [rawTestCase["Validation Points"]]
            : ["No validation points specified"],
  }
}
