import { test, expect } from "@playwright/test"
import { ProjectManagementPage } from "./pages/project-management.page"

test.describe("Project List (PROJ-101)", () => {
  let projectPage: ProjectManagementPage

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectManagementPage(page)
    await projectPage.goto()
    await projectPage.waitForPageLoad()
  })

  test("should display projects in table format", async () => {
    // Verify table is visible
    await expect(projectPage.projectsTable).toBeVisible()

    // Verify table headers
    await expect(projectPage.page.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "Description" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "Status" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "Priority" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "Start Date" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "End Date" })).toBeVisible()
    await expect(projectPage.page.getByRole("columnheader", { name: "Actions" })).toBeVisible()
  })

  test("should show project count in header", async () => {
    const count = await projectPage.getProjectCount()
    expect(count).toBeGreaterThanOrEqual(0)

    // Verify the count matches the number of visible rows
    const visibleProjects = await projectPage.getVisibleProjectNames()
    expect(visibleProjects.length).toBe(count)
  })

  test("should display status badges with correct icons and colors", async () => {
    const rows = await projectPage.projectRows.all()

    for (const row of rows) {
      const statusBadge = row.locator('[data-testid="status-badge"]')
      if (await statusBadge.isVisible()) {
        // Verify badge has appropriate styling
        await expect(statusBadge).toHaveClass(/bg-/)

        // Verify icon is present
        const icon = statusBadge.locator("svg")
        await expect(icon).toBeVisible()
      }
    }
  })

  test("should display priority badges with correct colors", async () => {
    const rows = await projectPage.projectRows.all()

    for (const row of rows) {
      const priorityBadge = row.locator('[data-testid="priority-badge"]')
      if (await priorityBadge.isVisible()) {
        // Verify badge has appropriate styling
        await expect(priorityBadge).toHaveClass(/bg-/)
      }
    }
  })

  test("should show loading state initially", async ({ page }) => {
    // Intercept API call to delay response
    await page.route("/api/projects", async (route) => {
      await page.waitForTimeout(1000)
      await route.continue()
    })

    const newProjectPage = new ProjectManagementPage(page)
    await newProjectPage.goto()

    // Should show loading spinner
    await expect(newProjectPage.loadingSpinner).toBeVisible()
  })

  test("should handle empty state gracefully", async ({ page }) => {
    // Mock empty response
    await page.route("/api/projects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    const newProjectPage = new ProjectManagementPage(page)
    await newProjectPage.goto()
    await newProjectPage.waitForPageLoad()

    // Should show empty state message
    await expect(newProjectPage.emptyStateMessage).toBeVisible()
    await expect(newProjectPage.page.getByText("Add your first project to get started")).toBeVisible()
  })

  test("should handle API error gracefully", async ({ page }) => {
    // Mock error response
    await page.route("/api/projects", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Internal server error" }),
      })
    })

    const newProjectPage = new ProjectManagementPage(page)
    await newProjectPage.goto()
    await newProjectPage.waitForPageLoad()

    // Should show error toast
    await expect(newProjectPage.errorToast).toBeVisible()
  })

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await projectPage.goto()
    await projectPage.waitForPageLoad()

    // Table should be scrollable
    await expect(projectPage.projectsTable).toBeVisible()

    // Add button should be visible and accessible
    await expect(projectPage.addProjectButton).toBeVisible()
  })
})
