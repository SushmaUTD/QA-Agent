export interface ValidationError {
  field: string
  message: string
}

export interface ProjectFormData {
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate: string
  endDate: string
}

export const validateProjectForm = (data: ProjectFormData): ValidationError[] => {
  const errors: ValidationError[] = []

  // Name validation
  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Project name is required" })
  } else if (data.name.trim().length < 3) {
    errors.push({ field: "name", message: "Project name must be at least 3 characters long" })
  } else if (data.name.trim().length > 100) {
    errors.push({ field: "name", message: "Project name must be less than 100 characters" })
  }

  // Description validation
  if (!data.description.trim()) {
    errors.push({ field: "description", message: "Project description is required" })
  } else if (data.description.trim().length < 10) {
    errors.push({ field: "description", message: "Description must be at least 10 characters long" })
  } else if (data.description.trim().length > 500) {
    errors.push({ field: "description", message: "Description must be less than 500 characters" })
  }

  // Start date validation
  if (!data.startDate) {
    errors.push({ field: "startDate", message: "Start date is required" })
  } else {
    const startDate = new Date(data.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < new Date("2020-01-01")) {
      errors.push({ field: "startDate", message: "Start date cannot be before 2020" })
    }
  }

  // End date validation
  if (data.endDate) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      errors.push({ field: "endDate", message: "End date must be after start date" })
    }

    const maxEndDate = new Date()
    maxEndDate.setFullYear(maxEndDate.getFullYear() + 10)

    if (endDate > maxEndDate) {
      errors.push({ field: "endDate", message: "End date cannot be more than 10 years in the future" })
    }
  }

  // Status validation
  const validStatuses = ["active", "completed", "on-hold", "cancelled"]
  if (!validStatuses.includes(data.status)) {
    errors.push({ field: "status", message: "Invalid status selected" })
  }

  // Priority validation
  const validPriorities = ["low", "medium", "high"]
  if (!validPriorities.includes(data.priority)) {
    errors.push({ field: "priority", message: "Invalid priority selected" })
  }

  return errors
}

export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find((err) => err.field === fieldName)
  return error?.message
}
