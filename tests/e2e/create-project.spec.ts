import { test, expect } from "@playwright/test"
import { ProjectManagementPage } from "./pages/project-management.page"
import { testProjects } from "./fixtures/test-data"

test.describe("Create New Project (PROJ-103)", () => {
  let projectPage: ProjectManagementPage

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectManagementPage(page)
    await projectPage.goto()
    await projectPage.waitForPageLoad()
  })

  test("should successfully create a new project", async () => {
    const initialCount = await projectPage.getProjectCount()

    // Open add project modal
    await projectPage.openAddProjectModal()

    // Fill form with valid data
    await projectPage.fillProjectForm(testProjects.valid)

    // Submit form
    await projectPage.submitForm()

    // Verify success
    await projectPage.waitForToast("success")
    await expect(projectPage.addProjectModal).not.toBeVisible()

    // Verify project appears in list
    const newCount = await projectPage.getProjectCount()
    expect(newCount).toBe(initialCount + 1)

    const projectRow = await projectPage.getProjectRowByName(testProjects.valid.name)
    await expect(projectRow).toBeVisible()
  })

  test("should create project with minimal required fields", async () => {
    await projectPage.openAddProjectModal()

    // Fill only required fields
    await projectPage.fillProjectForm(testProjects.minimal)

    await projectPage.submitForm()

    // Should succeed
    await projectPage.waitForToast("success")

    // Verify project in list
    const projectRow = await projectPage.getProjectRowByName(testProjects.minimal.name)
    await expect(projectRow).toBeVisible()
  })

  test("should show validation error for empty name", async () => {
    await projectPage.openAddProjectModal()

    // Try to submit without name
    await projectPage.descriptionInput.fill("Valid description")
    await projectPage.submitForm()

    // Should show validation error
    const hasError = await projectPage.hasValidationError("name")
    expect(hasError).toBe(true)

    // Modal should remain open
    await expect(projectPage.addProjectModal).toBeVisible()
  })

  test("should show validation error for short name", async () => {
    await projectPage.openAddProjectModal()

    await projectPage.fillProjectForm(testProjects.invalid.shortName)
    await projectPage.submitForm()

    // Should show validation error
    const error = await projectPage.getValidationError("name")
    expect(error).toContain("at least 3 characters")
  })

  test("should show validation error for short description", async () => {
    await projectPage.openAddProjectModal()

    await projectPage.fillProjectForm(testProjects.invalid.shortDescription)
    await projectPage.submitForm()

    // Should show validation error
    const error = await projectPage.getValidationError("description")
    expect(error).toContain("at least 10 characters")
  })

  test("should show validation error for invalid date range", async () => {
    await projectPage.openAddProjectModal()

    await projectPage.fillProjectForm(testProjects.invalid.invalidDateRange)
    await projectPage.submitForm()

    // Should show validation error
    const error = await projectPage.getValidationError("endDate")
    expect(error).toContain("after start date")
  })

  test("should show required field indicators", async () => {
    await projectPage.openAddProjectModal()

    // Check for asterisks on required fields
    const nameLabel = projectPage.page.getByText("Name *")
    const descriptionLabel = projectPage.page.getByText("Description *")
    const startDateLabel = projectPage.page.getByText("Start Date *")

    await expect(nameLabel).toBeVisible()
    await expect(descriptionLabel).toBeVisible()
    await expect(startDateLabel).toBeVisible()
  })

  test("should reset form after successful submission", async () => {
    await projectPage.openAddProjectModal()

    // Fill and submit form
    await projectPage.fillProjectForm(testProjects.valid)
    await projectPage.submitForm()

    // Wait for success and modal to close
    await projectPage.waitForToast("success")
    await expect(projectPage.addProjectModal).not.toBeVisible()

    // Open modal again
    await projectPage.openAddProjectModal()

    // Form should be empty
    await expect(projectPage.nameInput).toHaveValue("")
    await expect(projectPage.descriptionInput).toHaveValue("")
  })

  test("should cancel form without saving", async () => {
    const initialCount = await projectPage.getProjectCount()

    await projectPage.openAddProjectModal()

    // Fill form
    await projectPage.fillProjectForm(testProjects.valid)

    // Cancel instead of submit
    await projectPage.cancelButton.click()

    // Modal should close
    await expect(projectPage.addProjectModal).not.toBeVisible()

    // No new project should be created
    const finalCount = await projectPage.getProjectCount()
    expect(finalCount).toBe(initialCount)
  })

  test("should show loading state during submission", async () => {
    // Intercept API call to delay response
    await projectPage.page.route("/api/projects", async (route) => {
      if (route.request().method() === "POST") {
        await projectPage.page.waitForTimeout(1000)
        await route.continue()
      } else {
        await route.continue()
      }
    })

    await projectPage.openAddProjectModal()
    await projectPage.fillProjectForm(testProjects.valid)

    // Submit form
    await projectPage.submitForm()

    // Should show loading state
    await expect(projectPage.submitButton).toBeDisabled()
    await expect(projectPage.page.getByRole("button", { name: /loading/i })).toBeVisible()
  })

  test("should handle API errors gracefully", async () => {
    // Mock API error
    await projectPage.page.route("/api/projects", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Server error" }),
        })
      } else {
        await route.continue()
      }
    })

    await projectPage.openAddProjectModal()
    await projectPage.fillProjectForm(testProjects.valid)
    await projectPage.submitForm()

    // Should show error toast
    await projectPage.waitForToast("error")

    // Modal should remain open
    await expect(projectPage.addProjectModal).toBeVisible()
  })
})
