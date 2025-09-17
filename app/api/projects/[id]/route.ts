import { type NextRequest, NextResponse } from "next/server"

interface Project {
  id: string
  name: string
  description: string
  status: "Active" | "Completed" | "On-hold" | "Cancelled"
  priority: "High" | "Medium" | "Low"
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// This would normally be imported from a shared location
const projects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern design and improved user experience",
    status: "Active",
    priority: "High",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Develop a cross-platform mobile application for iOS and Android",
    status: "Active",
    priority: "High",
    startDate: "2024-02-01",
    endDate: "2024-08-31",
    createdAt: "2024-01-25T14:30:00Z",
    updatedAt: "2024-01-25T14:30:00Z",
  },
  {
    id: "3",
    name: "Database Migration",
    description: "Migrate legacy database to modern cloud infrastructure",
    status: "Completed",
    priority: "Medium",
    startDate: "2023-11-01",
    endDate: "2023-12-15",
    createdAt: "2023-10-20T09:15:00Z",
    updatedAt: "2023-12-15T16:45:00Z",
  },
  {
    id: "4",
    name: "Security Audit",
    description: "Comprehensive security assessment and vulnerability testing",
    status: "On-hold",
    priority: "High",
    startDate: "2024-03-01",
    createdAt: "2024-02-15T11:20:00Z",
    updatedAt: "2024-02-15T11:20:00Z",
  },
  {
    id: "5",
    name: "Marketing Campaign",
    description: "Q2 digital marketing campaign for product launch",
    status: "Active",
    priority: "Medium",
    startDate: "2024-04-01",
    endDate: "2024-06-30",
    createdAt: "2024-03-20T13:10:00Z",
    updatedAt: "2024-03-20T13:10:00Z",
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id)

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, status, priority, startDate, endDate } = body

    const projectIndex = projects.findIndex((p) => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Validation (same as POST)
    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json({ error: "Name must be between 3 and 100 characters" }, { status: 400 })
    }

    if (!description || description.length < 10 || description.length > 500) {
      return NextResponse.json({ error: "Description must be between 10 and 500 characters" }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 })
    }

    const startYear = new Date(startDate).getFullYear()
    if (startYear < 2020) {
      return NextResponse.json({ error: "Start date cannot be before 2020" }, { status: 400 })
    }

    if (endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const tenYearsFromNow = new Date()
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)

      if (end <= start) {
        return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
      }

      if (end > tenYearsFromNow) {
        return NextResponse.json({ error: "End date cannot be more than 10 years in the future" }, { status: 400 })
      }
    }

    const updatedProject: Project = {
      ...projects[projectIndex],
      name,
      description,
      status,
      priority,
      startDate,
      endDate: endDate || undefined,
      updatedAt: new Date().toISOString(),
    }

    projects[projectIndex] = updatedProject
    return NextResponse.json(updatedProject)
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const projectIndex = projects.findIndex((p) => p.id === params.id)

  if (projectIndex === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  projects.splice(projectIndex, 1)
  return NextResponse.json({ message: "Project deleted successfully" })
}
