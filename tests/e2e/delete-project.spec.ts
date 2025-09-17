import { test, expect } from "@playwright/test"
import { ProjectManagementPage } from "./pages/project-management.page"

test.describe("Delete Project (PROJ-105)", () => {
  let projectPage: ProjectManagementPage

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectManagementPage(page)
    await projectPage.goto()
    await projectPage.waitForPageLoad()
  })

  test("should successfully delete a project", async () => {
    const initialCount = await projectPage.getProjectCount()
    const visibleProjects = await projectPage.getVisibleProjectNames()
    expect(visibleProjects.length).toBeGreaterThan(0)

    const projectToDelete = visibleProjects[0]

    // Delete project
    await projectPage.deleteProject(projectToDelete)
    await projectPage.confirmDelete()

    // Verify success
    await projectPage.waitForToast("success")
    await expect(projectPage.deleteConfirmDialog).not.toBeVisible()

    // Verify project removed from list
    const newCount = await projectPage.getProjectCount()
    expect(newCount).toBe(initialCount - 1)

    // Verify project no longer exists
    const projectRow = projectPage.page.locator(`tr:has-text("${projectToDelete}")`)
    await expect(projectRow).not.toBeVisible()
  })

  test("should show confirmation dialog with project name", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToDelete = visibleProjects[0]

    await projectPage.deleteProject(projectToDelete)

    // Verify confirmation dialog shows project name
    await expect(projectPage.deleteConfirmDialog).toBeVisible()
    await expect(projectPage.deleteConfirmDialog).toContainText(projectToDelete)
    await expect(projectPage.deleteConfirmDialog).toContainText("cannot be undone")
  })

  test("should cancel deletion", async () => {
    const initialCount = await projectPage.getProjectCount()
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToDelete = visibleProjects[0]

    await projectPage.deleteProject(projectToDelete)

    // Cancel deletion
    await projectPage.cancelButton.click()

    // Dialog should close
    await expect(projectPage.deleteConfirmDialog).not.toBeVisible()

    // Project should still exist
    const finalCount = await projectPage.getProjectCount()
    expect(finalCount).toBe(initialCount)

    const projectRow = await projectPage.getProjectRowByName(projectToDelete)
    await expect(projectRow).toBeVisible()
  })

  test("should handle API errors during deletion", async () => {
    // Mock API error for DELETE requests
    await projectPage.page.route("/api/projects/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Deletion failed" }),
        })
      } else {
        await route.continue()
      }
    })

    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToDelete = visibleProjects[0]

    await projectPage.deleteProject(projectToDelete)
    await projectPage.confirmDelete()

    // Should show error toast
    await projectPage.waitForToast("error")

    // Project should still exist
    const projectRow = await projectPage.getProjectRowByName(projectToDelete)
    await expect(projectRow).toBeVisible()
  })

  test("should show proper accessibility attributes", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToDelete = visibleProjects[0]

    await projectPage.deleteProject(projectToDelete)

    // Verify dialog has proper ARIA attributes
    await expect(projectPage.deleteConfirmDialog).toHaveAttribute("role", "dialog")
    await expect(projectPage.deleteConfirmDialog).toHaveAttribute("aria-labelledby")
    await expect(projectPage.deleteConfirmDialog).toHaveAttribute("aria-describedby")
  })

  test("should focus management in confirmation dialog", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToDelete = visibleProjects[0]

    await projectPage.deleteProject(projectToDelete)

    // Cancel button should be focused by default (safer option)
    await expect(projectPage.cancelButton).toBeFocused()
  })
})
