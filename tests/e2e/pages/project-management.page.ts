import { type Page, type Locator, expect } from "@playwright/test"

export class ProjectManagementPage {
  readonly page: Page
  readonly addProjectButton: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly priorityFilter: Locator
  readonly projectsTable: Locator
  readonly projectRows: Locator
  readonly emptyStateMessage: Locator
  readonly loadingSpinner: Locator

  // Modal elements
  readonly addProjectModal: Locator
  readonly editProjectModal: Locator
  readonly deleteConfirmDialog: Locator
  readonly nameInput: Locator
  readonly descriptionInput: Locator
  readonly statusSelect: Locator
  readonly prioritySelect: Locator
  readonly startDateInput: Locator
  readonly endDateInput: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly confirmDeleteButton: Locator

  // Toast notifications
  readonly toastContainer: Locator
  readonly successToast: Locator
  readonly errorToast: Locator

  constructor(page: Page) {
    this.page = page

    // Main page elements
    this.addProjectButton = page.getByRole("button", { name: "Add Project" })
    this.searchInput = page.getByPlaceholder("Search projects...")
    this.statusFilter = page.locator('[data-testid="status-filter"]').first()
    this.priorityFilter = page.locator('[data-testid="priority-filter"]').first()
    this.projectsTable = page.getByRole("table")
    this.projectRows = page.locator("tbody tr")
    this.emptyStateMessage = page.getByText("No projects found")
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')

    // Modal elements
    this.addProjectModal = page.getByRole("dialog", { name: /add new project/i })
    this.editProjectModal = page.getByRole("dialog", { name: /edit project/i })
    this.deleteConfirmDialog = page.getByRole("dialog", { name: /delete project/i })
    this.nameInput = page.getByLabel(/name/i)
    this.descriptionInput = page.getByLabel(/description/i)
    this.statusSelect = page.getByLabel(/status/i)
    this.prioritySelect = page.getByLabel(/priority/i)
    this.startDateInput = page.getByLabel(/start date/i)
    this.endDateInput = page.getByLabel(/end date/i)
    this.submitButton = page.getByRole("button", { name: /add project|update project/i })
    this.cancelButton = page.getByRole("button", { name: "Cancel" })
    this.confirmDeleteButton = page.getByRole("button", { name: "Delete" })

    // Toast notifications
    this.toastContainer = page.locator('[data-testid="toast-container"]')
    this.successToast = page.locator(".toast-success")
    this.errorToast = page.locator(".toast-error")
  }

  async goto() {
    await this.page.goto("/")
  }

  async waitForPageLoad() {
    await expect(this.page.getByText("Project Management")).toBeVisible()
    await this.page.waitForLoadState("networkidle")
  }

  async openAddProjectModal() {
    await this.addProjectButton.click()
    await expect(this.addProjectModal).toBeVisible()
  }

  async fillProjectForm(project: {
    name: string
    description: string
    status: string
    priority: string
    startDate: string
    endDate?: string
  }) {
    await this.nameInput.fill(project.name)
    await this.descriptionInput.fill(project.description)

    // Handle select dropdowns
    await this.statusSelect.click()
    await this.page.getByRole("option", { name: project.status }).click()

    await this.prioritySelect.click()
    await this.page.getByRole("option", { name: project.priority }).click()

    await this.startDateInput.fill(project.startDate)

    if (project.endDate) {
      await this.endDateInput.fill(project.endDate)
    }
  }

  async submitForm() {
    await this.submitButton.click()
  }

  async searchProjects(searchTerm: string) {
    await this.searchInput.fill(searchTerm)
    // Wait for search to complete
    await this.page.waitForTimeout(500)
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click()
    await this.page.getByRole("option", { name: status }).click()
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.click()
    await this.page.getByRole("option", { name: priority }).click()
  }

  async getProjectRowByName(projectName: string) {
    return this.page.locator(`tr:has-text("${projectName}")`)
  }

  async editProject(projectName: string) {
    const row = await this.getProjectRowByName(projectName)
    await row.getByRole("button", { name: "Edit" }).click()
    await expect(this.editProjectModal).toBeVisible()
  }

  async deleteProject(projectName: string) {
    const row = await this.getProjectRowByName(projectName)
    await row.getByRole("button", { name: "Delete" }).click()
    await expect(this.deleteConfirmDialog).toBeVisible()
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click()
  }

  async getProjectCount() {
    const countText = await this.page.locator('h3:has-text("Projects")').textContent()
    const match = countText?.match(/$$(\d+)$$/)
    return match ? Number.parseInt(match[1]) : 0
  }

  async getVisibleProjectNames() {
    const rows = await this.projectRows.all()
    const names = []
    for (const row of rows) {
      const nameCell = row.locator("td").first()
      const name = await nameCell.textContent()
      if (name) names.push(name.trim())
    }
    return names
  }

  async waitForToast(type: "success" | "error" = "success") {
    const toast = type === "success" ? this.successToast : this.errorToast
    await expect(toast).toBeVisible()
  }

  async getValidationError(fieldName: string) {
    const errorLocator = this.page.locator(`[data-testid="${fieldName}-error"]`)
    return await errorLocator.textContent()
  }

  async hasValidationError(fieldName: string) {
    const errorLocator = this.page.locator(`[data-testid="${fieldName}-error"]`)
    return await errorLocator.isVisible()
  }
}
