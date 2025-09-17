import { test, expect } from "@playwright/test"
import { ProjectManagementPage } from "./pages/project-management.page"

test.describe("Edit Existing Project (PROJ-104)", () => {
  let projectPage: ProjectManagementPage

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectManagementPage(page)
    await projectPage.goto()
    await projectPage.waitForPageLoad()
  })

  test("should successfully edit an existing project", async () => {
    // Find first project to edit
    const visibleProjects = await projectPage.getVisibleProjectNames()
    expect(visibleProjects.length).toBeGreaterThan(0)

    const projectToEdit = visibleProjects[0]

    // Open edit modal
    await projectPage.editProject(projectToEdit)

    // Modify project data
    const updatedName = `${projectToEdit} - Updated`
    await projectPage.nameInput.fill(updatedName)
    await projectPage.descriptionInput.fill("Updated description for testing purposes")

    // Submit changes
    await projectPage.submitForm()

    // Verify success
    await projectPage.waitForToast("success")
    await expect(projectPage.editProjectModal).not.toBeVisible()

    // Verify changes in list
    const updatedRow = await projectPage.getProjectRowByName(updatedName)
    await expect(updatedRow).toBeVisible()
  })

  test("should pre-populate form with current project data", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    // Get current project data from table
    const projectRow = await projectPage.getProjectRowByName(projectToEdit)
    const currentDescription = await projectRow.locator("td").nth(1).textContent()

    // Open edit modal
    await projectPage.editProject(projectToEdit)

    // Verify form is pre-populated
    await expect(projectPage.nameInput).toHaveValue(projectToEdit)
    if (currentDescription) {
      await expect(projectPage.descriptionInput).toHaveValue(currentDescription.trim())
    }
  })

  test("should validate edited data", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    await projectPage.editProject(projectToEdit)

    // Clear name field (invalid)
    await projectPage.nameInput.fill("")
    await projectPage.submitForm()

    // Should show validation error
    const hasError = await projectPage.hasValidationError("name")
    expect(hasError).toBe(true)

    // Modal should remain open
    await expect(projectPage.editProjectModal).toBeVisible()
  })

  test("should cancel edit without saving changes", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    await projectPage.editProject(projectToEdit)

    // Make changes
    await projectPage.nameInput.fill("Changed Name")

    // Cancel
    await projectPage.cancelButton.click()

    // Modal should close
    await expect(projectPage.editProjectModal).not.toBeVisible()

    // Original project should still exist unchanged
    const originalRow = await projectPage.getProjectRowByName(projectToEdit)
    await expect(originalRow).toBeVisible()
  })

  test("should update project status and priority", async () => {
    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    await projectPage.editProject(projectToEdit)

    // Change status to completed
    await projectPage.statusSelect.click()
    await projectPage.page.getByRole("option", { name: "Completed" }).click()

    // Change priority to low
    await projectPage.prioritySelect.click()
    await projectPage.page.getByRole("option", { name: "Low" }).click()

    await projectPage.submitForm()

    // Verify success
    await projectPage.waitForToast("success")

    // Verify status and priority badges updated
    const updatedRow = await projectPage.getProjectRowByName(projectToEdit)
    const statusBadge = updatedRow.locator('[data-testid="status-badge"]')
    const priorityBadge = updatedRow.locator('[data-testid="priority-badge"]')

    await expect(statusBadge).toContainText("completed")
    await expect(priorityBadge).toContainText("low")
  })

  test("should handle API errors during update", async () => {
    // Mock API error for PUT requests
    await projectPage.page.route("/api/projects/*", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Update failed" }),
        })
      } else {
        await route.continue()
      }
    })

    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    await projectPage.editProject(projectToEdit)
    await projectPage.nameInput.fill("Updated Name")
    await projectPage.submitForm()

    // Should show error toast
    await projectPage.waitForToast("error")

    // Modal should remain open
    await expect(projectPage.editProjectModal).toBeVisible()
  })

  test("should show loading state during update", async () => {
    // Intercept API call to delay response
    await projectPage.page.route("/api/projects/*", async (route) => {
      if (route.request().method() === "PUT") {
        await projectPage.page.waitForTimeout(1000)
        await route.continue()
      } else {
        await route.continue()
      }
    })

    const visibleProjects = await projectPage.getVisibleProjectNames()
    const projectToEdit = visibleProjects[0]

    await projectPage.editProject(projectToEdit)
    await projectPage.nameInput.fill("Updated Name")
    await projectPage.submitForm()

    // Should show loading state
    await expect(projectPage.submitButton).toBeDisabled()
  })
})
