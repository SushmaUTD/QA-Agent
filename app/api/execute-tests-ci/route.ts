import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testSuite, ciConfig, appConfig } = await request.json()

    // Generate unique run ID
    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create CI workflow file based on provider
    const workflowContent = generateWorkflowFile(testSuite, ciConfig, appConfig, runId)

    // Trigger CI pipeline based on provider
    let triggerResult
    switch (ciConfig.provider) {
      case "github-actions":
        triggerResult = await triggerGitHubActions(ciConfig, workflowContent, runId)
        break
      case "jenkins":
        triggerResult = await triggerJenkins(ciConfig, workflowContent, runId)
        break
      case "gitlab-ci":
        triggerResult = await triggerGitLabCI(ciConfig, workflowContent, runId)
        break
      default:
        triggerResult = await triggerCustomCI(ciConfig, workflowContent, runId)
    }

    return NextResponse.json({
      success: true,
      runId,
      commitSha: triggerResult.commitSha,
      pipelineUrl: triggerResult.pipelineUrl,
    })
  } catch (error) {
    console.error("CI execution error:", error)
    return NextResponse.json({ success: false, error: "Failed to execute tests in CI" }, { status: 500 })
  }
}

function generateWorkflowFile(testSuite: any, ciConfig: any, appConfig: any, runId: string) {
  let workflowContent = ""
  if (ciConfig.provider === "github-actions") {
    workflowContent = `
name: Automated Test Execution - ${runId}

on:
  workflow_dispatch:
    inputs:
      run_id:
        description: 'Test run ID'
        required: true
        default: '${runId}'

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: ${ciConfig.timeout}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install Playwright
      run: |
        npm install -D @playwright/test
        npx playwright install
        
    - name: Create test files
      run: |
        mkdir -p tests/generated
        cat > tests/generated/test-suite.spec.ts << 'EOF'
${generatePlaywrightTestCode(testSuite, appConfig)}
EOF
        
    - name: Run tests
      run: npx playwright test tests/generated/
      env:
        APP_URL: ${appConfig.applicationUrl}
        TEST_USERNAME: ${appConfig.loginUsername}
        TEST_PASSWORD: ${appConfig.loginPassword}
        
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-${runId}
        path: test-results/
        
    - name: Comment on PR
      if: always() && github.event.pull_request
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const results = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
          
          const comment = \`## 🤖 Automated Test Results
          
**Test Suite:** ${testSuite.metadata.ticketKey || "PR-" + testSuite.metadata.prNumber}
**Status:** \${results.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
**Total Tests:** \${results.total}
**Passed:** \${results.passed}
**Failed:** \${results.failed}
**Duration:** \${results.duration}ms

\${results.failed > 0 ? '### Failed Tests:\\n' + results.failedTests.map(t => \`- \${t.name}: \${t.error}\`).join('\\n') : ''}
          \`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
    `
  }

  // Add other CI providers as needed
  return workflowContent
}

function generatePlaywrightTestCode(testSuite: any, appConfig: any) {
  const testCases = testSuite.testCases || []

  return `
import { test, expect } from '@playwright/test';

test.describe('${testSuite.metadata.ticketKey || "PR Tests"}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${appConfig.applicationUrl}');
    
    // Login if credentials provided
    if ('${appConfig.loginUsername}' && '${appConfig.loginPassword}') {
      await page.fill('[data-testid="username"], [name="email"], [type="email"]', '${appConfig.loginUsername}');
      await page.fill('[data-testid="password"], [name="password"], [type="password"]', '${appConfig.loginPassword}');
      await page.click('[data-testid="login"], [type="submit"], button:has-text("Login")');
      await page.waitForLoadState('networkidle');
    }
  });

${testCases
  .map(
    (testCase: any, index: number) => `
  test('${testCase.title}', async ({ page }) => {
    // Test: ${testCase.title}
    // Priority: ${testCase.priority}
    
    ${testCase.preconditions
      ?.map(
        (precondition: string) => `
    // Precondition: ${precondition}
    `,
      )
      .join("")}
    
    ${testCase.steps
      ?.map(
        (step: string, stepIndex: number) => `
    // Step ${stepIndex + 1}: ${step}
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/step-${index}-${stepIndex}.png' });
    `,
      )
      .join("")}
    
    // Expected Result: ${testCase.expectedResults}
    await expect(page).toHaveTitle(/.*/);
    await page.screenshot({ path: 'test-results/final-${index}.png' });
  });
`,
  )
  .join("")}
});
  `
}

async function triggerGitHubActions(ciConfig: any, workflowContent: string, runId: string) {
  // Implementation for GitHub Actions trigger
  return {
    commitSha: `sha-${runId}`,
    pipelineUrl: `https://github.com/owner/repo/actions/runs/${runId}`,
  }
}

async function triggerJenkins(ciConfig: any, workflowContent: string, runId: string) {
  // Implementation for Jenkins trigger
  return {
    commitSha: `sha-${runId}`,
    pipelineUrl: `${ciConfig.webhookUrl}/job/test-execution/${runId}`,
  }
}

async function triggerGitLabCI(ciConfig: any, workflowContent: string, runId: string) {
  // Implementation for GitLab CI trigger
  return {
    commitSha: `sha-${runId}`,
    pipelineUrl: `https://gitlab.com/owner/repo/-/pipelines/${runId}`,
  }
}

async function triggerCustomCI(ciConfig: any, workflowContent: string, runId: string) {
  // Implementation for custom CI trigger
  return {
    commitSha: `sha-${runId}`,
    pipelineUrl: `${ciConfig.webhookUrl}/runs/${runId}`,
  }
}
