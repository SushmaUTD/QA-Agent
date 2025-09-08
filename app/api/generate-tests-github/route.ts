import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

interface GitHubPullRequest {
  id: string
  number: number
  title: string
  description: string
  status: string
  author: string
  reviewers: string[]
  files: GitHubFile[]
  commits: GitHubCommit[]
  created: string
  updated: string
  branch: string
  baseBranch: string
}

interface GitHubFile {
  filename: string
  status: "added" | "modified" | "removed"
  additions: number
  deletions: number
  changes: number
  patch?: string
}

interface GitHubCommit {
  sha: string
  message: string
  author: string
  date: string
}

interface TestCase {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  type: "Functional" | "UI" | "Integration" | "Edge Case" | "Performance" | "Security"
  preconditions: string[]
  steps: string[]
  expectedResults: string
  testData: string
}

export async function POST(request: NextRequest) {
  try {
    const { pullRequest, settings, appConfig } = await request.json()

    console.log("[v0] Environment check:")
    console.log("[v0] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
    console.log("[v0] OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0)
    console.log(
      "[v0] All env keys:",
      Object.keys(process.env).filter((key) => key.includes("OPENAI")),
    )

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log("[v0] OpenAI API key not found, using fallback test generation")
      return NextResponse.json({
        testCases: generateFallbackTestCases(pullRequest, settings),
        source: "fallback",
      })
    }

    console.log("[v0] OpenAI API key found, using AI generation")

    // Create comprehensive prompt for GitHub PR test generation
    const prompt = `
You are a QA engineer creating comprehensive test cases for a GitHub Pull Request.

Pull Request Details:
- Title: ${pullRequest.title}
- Description: ${pullRequest.description}
- Author: ${pullRequest.author}
- Files Changed: ${pullRequest.files.map((f) => `${f.filename} (${f.status})`).join(", ")}
- Commits: ${pullRequest.commits.map((c) => c.message).join(", ")}

Changed Files Analysis:
${pullRequest.files
  .map(
    (file) => `
- ${file.filename}: ${file.status} (+${file.additions}/-${file.deletions})
`,
  )
  .join("")}

Test Configuration:
- Coverage Level: ${settings.coverageLevel}%
- Include Edge Cases: ${settings.includeEdgeCases}
- Include Negative Tests: ${settings.includeNegativeTests}
- Include Performance Tests: ${settings.includePerformanceTests}
- Include Security Tests: ${settings.includeSecurityTests}

Application Context:
- URL: ${appConfig.applicationUrl}
- Environment: ${appConfig.environment}

Generate ${Math.ceil(settings.coverageLevel / 10)} comprehensive test cases that cover:
1. The functionality introduced/modified in this PR
2. Integration points with existing features
3. Edge cases and error scenarios
4. User workflows affected by the changes
5. Regression testing for related features

For each test case, provide:
- A descriptive title
- Priority (High/Medium/Low)
- Type (Functional/UI/Integration/Edge Case/Performance/Security)
- Preconditions (array of strings)
- Test steps (array of strings)
- Expected results (string)
- Test data (string with sample data if needed)

Return the response as a JSON array of test cases.
`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    })

    console.log("[v0] AI generation successful, parsing response")

    // Parse the AI response
    let testCases: TestCase[]
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        testCases = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON array found in response")
      }
    } catch (parseError) {
      console.log("[v0] Failed to parse AI response, using fallback")
      testCases = generateFallbackTestCases(pullRequest, settings)
    }

    // Ensure each test case has a unique ID
    testCases = testCases.map((testCase, index) => ({
      ...testCase,
      id: `pr-${pullRequest.number}-test-${index + 1}`,
    }))

    console.log("[v0] AI generation successful, generated", testCases.length, "test cases")

    return NextResponse.json({
      testCases,
      source: "ai",
    })
  } catch (error) {
    console.error("[v0] Error in GitHub test generation:", error)

    // Fallback to mock test generation
    const { pullRequest, settings } = await request.json()
    return NextResponse.json({
      testCases: generateFallbackTestCases(pullRequest, settings),
      source: "fallback",
    })
  }
}

function generateFallbackTestCases(pullRequest: GitHubPullRequest, settings: any): TestCase[] {
  const testCases: TestCase[] = []
  const testCount = Math.ceil(settings.coverageLevel / 10)

  // Generate test cases based on PR content
  const changedFiles = pullRequest.files
  const hasUIChanges = changedFiles.some(
    (f) => f.filename.includes(".tsx") || f.filename.includes(".jsx") || f.filename.includes(".vue"),
  )
  const hasAPIChanges = changedFiles.some((f) => f.filename.includes("api") || f.filename.includes("route"))
  const hasAuthChanges = changedFiles.some((f) => f.filename.includes("auth") || f.filename.includes("login"))

  for (let i = 0; i < testCount; i++) {
    let testCase: TestCase

    if (i === 0) {
      // Main functionality test
      testCase = {
        id: `pr-${pullRequest.number}-test-${i + 1}`,
        title: `Verify ${pullRequest.title} - Main Functionality`,
        priority: "High",
        type: "Functional",
        preconditions: [
          "Application is running and accessible",
          "User has appropriate permissions",
          "Test environment is properly configured",
        ],
        steps: [
          "Navigate to the affected feature area",
          "Perform the main action introduced in this PR",
          "Verify the expected behavior occurs",
          "Check for any error messages or unexpected behavior",
        ],
        expectedResults: "The new functionality works as described in the PR description",
        testData: "Use test data appropriate for the feature being tested",
      }
    } else if (i === 1 && hasUIChanges) {
      // UI test
      testCase = {
        id: `pr-${pullRequest.number}-test-${i + 1}`,
        title: `UI/UX Validation for ${pullRequest.title}`,
        priority: "Medium",
        type: "UI",
        preconditions: [
          "Application is loaded in supported browser",
          "Screen resolution is set to standard desktop size",
        ],
        steps: [
          "Navigate to the updated UI components",
          "Verify visual elements are displayed correctly",
          "Test responsive behavior on different screen sizes",
          "Validate accessibility features",
        ],
        expectedResults: "UI elements are properly styled and accessible",
        testData: "Test on Chrome, Firefox, and Safari browsers",
      }
    } else if (i === 2 && hasAPIChanges) {
      // API test
      testCase = {
        id: `pr-${pullRequest.number}-test-${i + 1}`,
        title: `API Integration Test for ${pullRequest.title}`,
        priority: "High",
        type: "Integration",
        preconditions: ["API endpoints are deployed and accessible", "Valid authentication tokens are available"],
        steps: [
          "Send requests to the modified API endpoints",
          "Verify response status codes and data structure",
          "Test error handling for invalid requests",
          "Validate data persistence if applicable",
        ],
        expectedResults: "API endpoints respond correctly with expected data format",
        testData: "Valid and invalid request payloads for testing",
      }
    } else if (settings.includeEdgeCases && i === testCount - 1) {
      // Edge case test
      testCase = {
        id: `pr-${pullRequest.number}-test-${i + 1}`,
        title: `Edge Case Testing for ${pullRequest.title}`,
        priority: "Medium",
        type: "Edge Case",
        preconditions: ["System is in a stable state", "Edge case scenarios are identified"],
        steps: [
          "Test with boundary values and limits",
          "Verify behavior with empty or null inputs",
          "Test concurrent user scenarios if applicable",
          "Validate error handling for unexpected inputs",
        ],
        expectedResults: "System handles edge cases gracefully without crashes",
        testData: "Boundary values, empty strings, null values, special characters",
      }
    } else {
      // Generic functional test
      testCase = {
        id: `pr-${pullRequest.number}-test-${i + 1}`,
        title: `Functional Test ${i + 1} for ${pullRequest.title}`,
        priority: i < 2 ? "High" : "Medium",
        type: "Functional",
        preconditions: ["Application is in a clean state", "Required test data is available"],
        steps: [
          "Set up test environment",
          "Execute the test scenario",
          "Verify expected outcomes",
          "Clean up test data",
        ],
        expectedResults: "Feature works as expected without side effects",
        testData: "Standard test dataset for the feature",
      }
    }

    testCases.push(testCase)
  }

  return testCases
}
