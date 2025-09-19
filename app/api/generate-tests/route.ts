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

    const prompt = `You are an expert QA engineer. Generate comprehensive test cases for this JIRA ticket:

**Ticket:** ${ticket.summary}
**Description:** ${ticket.description}
**Acceptance Criteria:** ${ticket.acceptanceCriteria}
**Priority:** ${ticket.priority}
**Type:** ${ticket.type}

**Test Generation Settings:**
- Coverage Level: ${settings.coverageLevel}
- Test Types: ${settings.testTypes.join(", ")}
- Framework: ${settings.framework}

Generate ${settings.coverageLevel === "Basic" ? "5-7" : settings.coverageLevel === "Comprehensive" ? "10-15" : "15-20"} detailed test cases that cover:
1. Happy path scenarios
2. Edge cases and boundary conditions
3. Error handling and validation
4. User experience flows
5. Integration points

For each test case, provide:
- Test Case ID (format: TC_${ticket.key}_001)
- Title (clear, descriptive)
- Priority (High/Medium/Low)
- Type (${settings.testTypes.join("/")})
- Preconditions
- Test Steps (numbered, detailed)
- Expected Results
- Test Data (if applicable)

Return the response as a JSON array of test case objects.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    })

    // Parse the AI response and structure it
    let testCases
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      testCases = JSON.parse(cleanedText)
    } catch (parseError) {
      console.log("[v0] JSON parsing failed, using text parsing fallback")
      // If AI doesn't return valid JSON, create structured response
      const lines = text.split("\n").filter((line) => line.trim())
      testCases = parseTestCasesFromText(lines, ticket.key)
    }

    console.log("[v0] AI generation successful, generated", testCases.length, "test cases")

    return NextResponse.json({
      success: true,
      testCases,
      metadata: {
        ticketKey: ticket.key,
        generatedAt: new Date().toISOString(),
        settings,
        totalTests: testCases.length,
        usingFallback: false,
      },
    })
  } catch (error) {
    console.error("Test generation error:", error)
    return NextResponse.json({
      success: true,
      testCases: generateFallbackTests(ticket, settings),
      metadata: {
        ticketKey: ticket.key || "ERROR",
        generatedAt: new Date().toISOString(),
        settings,
        totalTests: generateFallbackTests(ticket, settings).length,
        usingFallback: true,
        error: "AI generation failed, using fallback",
      },
    })
  }
}

function parseTestCasesFromText(lines: string[], ticketKey: string) {
  const testCases = []
  let currentTest = null
  let testCounter = 1

  for (const line of lines) {
    if (line.includes("Test Case") || line.includes("TC_")) {
      if (currentTest) testCases.push(currentTest)
      currentTest = {
        id: `TC_${ticketKey}_${String(testCounter).padStart(3, "0")}`,
        title: line
          .replace(/Test Case \d+:?/i, "")
          .replace(/TC_\w+_\d+:?/i, "")
          .trim(),
        priority: "Medium",
        type: "Functional",
        preconditions: [],
        steps: [],
        expectedResults: "",
        testData: "",
      }
      testCounter++
    } else if (currentTest) {
      if (line.toLowerCase().includes("priority:")) {
        currentTest.priority = line.split(":")[1]?.trim() || "Medium"
      } else if (line.toLowerCase().includes("type:")) {
        currentTest.type = line.split(":")[1]?.trim() || "Functional"
      } else if (line.toLowerCase().includes("precondition")) {
        currentTest.preconditions.push(line.replace(/precondition:?/i, "").trim())
      } else if (line.toLowerCase().includes("step") || /^\d+\./.test(line)) {
        currentTest.steps.push(
          line
            .replace(/step \d+:?/i, "")
            .replace(/^\d+\./, "")
            .trim(),
        )
      } else if (line.toLowerCase().includes("expected")) {
        currentTest.expectedResults = line.replace(/expected:?/i, "").trim()
      }
    }
  }

  if (currentTest) testCases.push(currentTest)
  return testCases.length > 0 ? testCases : generateFallbackTests()
}

function generateFallbackTests(ticket?: any, settings?: any) {
  const ticketKey = ticket?.key || "DEMO"
  const testTypes = settings?.testTypes || ["Functional"]
  const coverageLevel = settings?.coverageLevel || "Basic"

  const baseTests = [
    {
      id: `TC_${ticketKey}_001`,
      title: `Verify ${ticket?.summary || "basic functionality"} works as expected`,
      priority: "High",
      type: testTypes[0] || "Functional",
      preconditions: ["User has valid access", "System is available"],
      steps: [
        "Navigate to the feature",
        "Perform the main action",
        "Verify the expected behavior",
        "Check for any error conditions",
      ],
      expectedResults: `${ticket?.summary || "Feature"} should work correctly without errors`,
      testData: "Valid test data as per requirements",
    },
    {
      id: `TC_${ticketKey}_002`,
      title: `Test error handling for ${ticket?.summary || "the feature"}`,
      priority: "Medium",
      type: "Negative",
      preconditions: ["System is accessible"],
      steps: [
        "Navigate to the feature",
        "Enter invalid data",
        "Submit the form/action",
        "Verify error message is displayed",
      ],
      expectedResults: "Appropriate error message should be displayed",
      testData: "Invalid test data",
    },
    {
      id: `TC_${ticketKey}_003`,
      title: `Verify UI elements for ${ticket?.summary || "the feature"}`,
      priority: "Medium",
      type: "UI",
      preconditions: ["User has access to the interface"],
      steps: [
        "Navigate to the page",
        "Verify all UI elements are present",
        "Check element alignment and styling",
        "Test responsive behavior",
      ],
      expectedResults: "All UI elements should be properly displayed and functional",
      testData: "N/A",
    },
  ]

  // Add more tests based on coverage level
  if (coverageLevel === "Comprehensive" || coverageLevel === "Extensive") {
    baseTests.push(
      {
        id: `TC_${ticketKey}_004`,
        title: `Performance test for ${ticket?.summary || "the feature"}`,
        priority: "Low",
        type: "Performance",
        preconditions: ["System is under normal load"],
        steps: [
          "Execute the main functionality",
          "Measure response time",
          "Check system resource usage",
          "Verify performance meets requirements",
        ],
        expectedResults: "Feature should perform within acceptable time limits",
        testData: "Performance benchmarks",
      },
      {
        id: `TC_${ticketKey}_005`,
        title: `Security validation for ${ticket?.summary || "the feature"}`,
        priority: "High",
        type: "Security",
        preconditions: ["Security testing environment is set up"],
        steps: [
          "Attempt unauthorized access",
          "Test input validation",
          "Check for data exposure",
          "Verify access controls",
        ],
        expectedResults: "Feature should be secure against common vulnerabilities",
        testData: "Security test vectors",
      },
    )
  }

  return baseTests
}
