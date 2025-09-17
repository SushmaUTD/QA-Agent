export const testProjects = {
  valid: {
    name: "Test E-commerce Platform",
    description: "A comprehensive e-commerce platform built with React and Node.js for testing purposes",
    status: "active" as const,
    priority: "high" as const,
    startDate: "2024-01-15",
    endDate: "2024-06-30",
  },
  minimal: {
    name: "Minimal Test Project",
    description: "A minimal project for testing basic functionality",
    status: "active" as const,
    priority: "medium" as const,
    startDate: "2024-02-01",
    endDate: "",
  },
  invalid: {
    shortName: {
      name: "AB",
      description: "This project has a name that is too short",
      status: "active" as const,
      priority: "low" as const,
      startDate: "2024-01-01",
      endDate: "",
    },
    shortDescription: {
      name: "Valid Project Name",
      description: "Too short",
      status: "active" as const,
      priority: "medium" as const,
      startDate: "2024-01-01",
      endDate: "",
    },
    invalidDateRange: {
      name: "Invalid Date Project",
      description: "This project has an invalid date range where end date is before start date",
      status: "active" as const,
      priority: "high" as const,
      startDate: "2024-06-01",
      endDate: "2024-01-01",
    },
  },
}

export const searchTerms = {
  existing: "E-commerce",
  nonExisting: "NonExistentProject",
  partial: "Platform",
}

export const filterOptions = {
  status: {
    all: "all",
    active: "active",
    completed: "completed",
    onHold: "on-hold",
    cancelled: "cancelled",
  },
  priority: {
    all: "all",
    high: "high",
    medium: "medium",
    low: "low",
  },
}
