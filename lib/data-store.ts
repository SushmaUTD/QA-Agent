export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// In-memory storage
let projects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "Build a modern e-commerce platform with React and Node.js",
    status: "active",
    priority: "high",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Create a cross-platform mobile application using React Native",
    status: "active",
    priority: "medium",
    startDate: "2024-02-01",
    endDate: "2024-08-15",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
  },
  {
    id: "3",
    name: "Data Analytics Dashboard",
    description: "Develop a comprehensive analytics dashboard for business intelligence",
    status: "completed",
    priority: "high",
    startDate: "2023-10-01",
    endDate: "2024-01-31",
    createdAt: "2023-10-01T08:00:00Z",
    updatedAt: "2024-01-31T17:00:00Z",
  },
  {
    id: "4",
    name: "API Documentation Portal",
    description: "Create an interactive API documentation portal for developers",
    status: "on-hold",
    priority: "low",
    startDate: "2024-03-01",
    createdAt: "2024-03-01T11:00:00Z",
    updatedAt: "2024-03-15T14:00:00Z",
  },
]

let nextId = 5

export const dataStore = {
  // GET all projects
  getAllProjects: (): Project[] => {
    return [...projects]
  },

  // GET project by ID
  getProjectById: (id: string): Project | undefined => {
    return projects.find((project) => project.id === id)
  },

  // POST create new project
  createProject: (projectData: Omit<Project, "id" | "createdAt" | "updatedAt">): Project => {
    const newProject: Project = {
      ...projectData,
      id: nextId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    projects.push(newProject)
    nextId++
    return newProject
  },

  // PUT update existing project
  updateProject: (id: string, updates: Partial<Omit<Project, "id" | "createdAt">>): Project | null => {
    const projectIndex = projects.findIndex((project) => project.id === id)

    if (projectIndex === -1) {
      return null
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return projects[projectIndex]
  },

  // DELETE project
  deleteProject: (id: string): boolean => {
    const projectIndex = projects.findIndex((project) => project.id === id)

    if (projectIndex === -1) {
      return false
    }

    projects.splice(projectIndex, 1)
    return true
  },

  // Utility function to reset data (for testing)
  resetData: (): void => {
    projects = []
    nextId = 1
  },
}
