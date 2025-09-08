import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
  try {
    const { runId } = params

    // Mock pipeline status for demo - in real implementation,
    // this would query the actual CI provider's API
    const mockStatus = generateMockPipelineStatus(runId)

    return NextResponse.json(mockStatus)
  } catch (error) {
    console.error("Pipeline status error:", error)
    return NextResponse.json({ error: "Failed to get pipeline status" }, { status: 500 })
  }
}

function generateMockPipelineStatus(runId: string) {
  // Simulate different pipeline states based on time
  const elapsed = Date.now() - Number.parseInt(runId.split("-")[1])
  const minutes = elapsed / (1000 * 60)

  if (minutes < 1) {
    return {
      status: "pending",
      logs: ["Pipeline queued...", "Initializing runner..."],
    }
  } else if (minutes < 3) {
    return {
      status: "running",
      logs: [
        "Pipeline queued...",
        "Initializing runner...",
        "Setting up Node.js...",
        "Installing dependencies...",
        "Running tests...",
      ],
    }
  } else {
    // Simulate random success/failure
    const success = Math.random() > 0.3 // 70% success rate

    return {
      status: success ? "success" : "failed",
      completedAt: new Date().toISOString(),
      results: {
        total: 8,
        passed: success ? 8 : 6,
        failed: success ? 0 : 2,
        skipped: 0,
        duration: 45000 + Math.random() * 30000,
        failedTests: success
          ? []
          : [
              {
                name: "User Login Authentication",
                error: "Expected element to be visible, but it was hidden",
              },
              {
                name: "Shopping Cart Functionality",
                error: "Timeout waiting for element to appear",
              },
            ],
      },
      logs: [
        "Pipeline queued...",
        "Initializing runner...",
        "Setting up Node.js...",
        "Installing dependencies...",
        "Running tests...",
        success ? "All tests passed!" : "Some tests failed",
        "Uploading artifacts...",
        "Pipeline completed",
      ],
    }
  }
}
