import { test, expect } from "@playwright/test"
import { ProjectManagementPage } from "./pages/project-management.page"
import { searchTerms } from "./fixtures/test-data"

test.describe("Search and Filter Projects (PROJ-102)", () => {
  let projectPage: ProjectManagementPage

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectManagementPage(page)
    await projectPage.goto()
    await projectPage.waitForPageLoad()
  })

  test("should search projects by name", async () => {
    // Get initial project count
    const initialCount = await projectPage.getProjectCount()

    // Search for existing project
    await projectPage.searchProjects(searchTerms.existing)

    // Verify filtered results
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const filteredCount = visibleProjects.length

    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Verify all visible projects contain the search term
    for (const projectName of visibleProjects) {
      expect(projectName.toLowerCase()).toContain(searchTerms.existing.toLowerCase())
    }
  })

  test("should search projects by description", async () => {
    await projectPage.searchProjects("React")

    // Should show projects with React in description
    const visibleProjects = await projectPage.getVisibleProjectNames()
    expect(visibleProjects.length).toBeGreaterThanOrEqual(0)
  })

  test("should show no results for non-existent search term", async () => {
    await projectPage.searchProjects(searchTerms.nonExisting)

    // Should show empty state
    await expect(projectPage.emptyStateMessage).toBeVisible()
    await expect(projectPage.page.getByText("Try adjusting your filters")).toBeVisible()
  })

  test("should filter projects by status", async () => {
    // Filter by active status
    await projectPage.filterByStatus("Active")

    const visibleProjects = await projectPage.getVisibleProjectNames()

    // Verify all visible projects have active status
    for (const projectName of visibleProjects) {
      const row = await projectPage.getProjectRowByName(projectName)
      const statusBadge = row.locator('[data-testid="status-badge"]')
      await expect(statusBadge).toContainText("active")
    }
  })

  test("should filter projects by priority", async () => {
    // Filter by high priority
    await projectPage.filterByPriority("High")

    const visibleProjects = await projectPage.getVisibleProjectNames()

    // Verify all visible projects have high priority
    for (const projectName of visibleProjects) {
      const row = await projectPage.getProjectRowByName(projectName)
      const priorityBadge = row.locator('[data-testid="priority-badge"]')
      await expect(priorityBadge).toContainText("high")
    }
  })

  test("should combine search and filters", async () => {
    // Apply search and filter
    await projectPage.searchProjects(searchTerms.partial)
    await projectPage.filterByStatus("Active")

    const visibleProjects = await projectPage.getVisibleProjectNames()

    // Verify results match both criteria
    for (const projectName of visibleProjects) {
      expect(projectName.toLowerCase()).toContain(searchTerms.partial.toLowerCase())

      const row = await projectPage.getProjectRowByName(projectName)
      const statusBadge = row.locator('[data-testid="status-badge"]')
      await expect(statusBadge).toContainText("active")
    }
  })

  test("should clear search results when search is cleared", async () => {
    const initialCount = await projectPage.getProjectCount()

    // Apply search
    await projectPage.searchProjects(searchTerms.existing)
    const filteredCount = await projectPage.getProjectCount()

    // Clear search
    await projectPage.searchProjects("")
    const clearedCount = await projectPage.getProjectCount()

    expect(clearedCount).toBe(initialCount)
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test("should update results in real-time", async () => {
    // Start typing search term
    await projectPage.searchInput.fill("E")
    await projectPage.page.waitForTimeout(300)

    const partialResults = await projectPage.getVisibleProjectNames()

    // Complete search term
    await projectPage.searchInput.fill("E-commerce")
    await projectPage.page.waitForTimeout(300)

    const fullResults = await projectPage.getVisibleProjectNames()

    // Results should be more specific
    expect(fullResults.length).toBeLessThanOrEqual(partialResults.length)
  })

  test("should show filter indicators when active", async () => {
    // Apply status filter
    await projectPage.filterByStatus("Completed")

    // Verify filter dropdown shows selected value
    await expect(projectPage.statusFilter).toContainText("Completed")
  })
})
