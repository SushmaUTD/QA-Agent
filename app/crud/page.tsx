"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ToastContainer } from "@/components/ui/toast"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import type { Project } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ProjectFormData {
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate: string
  endDate: string
}

export default function CrudApplication() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    startDate: "",
    endDate: "",
  })
  const [formErrors, setFormErrors] = useState<Partial<ProjectFormData>>({})
  const [submitting, setSubmitting] = useState(false)

  const { toasts, removeToast, success, error, warning } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")
      const data = await response.json()
      if (data.success) {
        setProjects(data.data)
      } else {
        error("Failed to load projects", data.error)
      }
    } catch (err) {
      error("Failed to load projects", "Please check your connection and try again")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (data: ProjectFormData): Partial<ProjectFormData> => {
    const errors: Partial<ProjectFormData> = {}

    if (!data.name.trim()) {
      errors.name = "Project name is required"
    } else if (data.name.length < 3) {
      errors.name = "Project name must be at least 3 characters"
    }

    if (!data.description.trim()) {
      errors.description = "Description is required"
    } else if (data.description.length < 10) {
      errors.description = "Description must be at least 10 characters"
    }

    if (!data.startDate) {
      errors.startDate = "Start date is required"
    }

    if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
      errors.endDate = "End date must be after start date"
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      warning("Please fix the form errors", "Check the highlighted fields")
      return
    }

    try {
      setSubmitting(true)

      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects"
      const method = editingProject ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          endDate: formData.endDate || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        success(
          editingProject ? "Project updated successfully" : "Project created successfully",
          `${formData.name} has been ${editingProject ? "updated" : "created"}`,
        )
        await fetchProjects()
        resetForm()
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
      } else {
        error("Operation failed", data.error)
      }
    } catch (err) {
      error("Operation failed", "Please try again")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate || "",
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        success("Project deleted", `${project.name} has been removed`)
        await fetchProjects()
      } else {
        error("Delete failed", data.error)
      }
    } catch (err) {
      error("Delete failed", "Please try again")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      priority: "medium",
      startDate: "",
      endDate: "",
    })
    setFormErrors({})
    setEditingProject(null)
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "on-hold":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "completed":
        return "bg-secondary text-secondary-foreground"
      case "on-hold":
        return "bg-muted text-muted-foreground"
      case "cancelled":
        return "bg-destructive text-destructive-foreground"
    }
  }

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to JIRA Generator
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
              <p className="text-muted-foreground mt-2">Manage your projects with full CRUD operations</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>Create a new project with all the necessary details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={formErrors.description ? "border-destructive" : ""}
                    rows={3}
                  />
                  {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={formErrors.startDate ? "border-destructive" : ""}
                    />
                    {formErrors.startDate && <p className="text-sm text-destructive">{formErrors.startDate}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={formErrors.endDate ? "border-destructive" : ""}
                  />
                  {formErrors.endDate && <p className="text-sm text-destructive">{formErrors.endDate}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projects ({filteredProjects.length})</CardTitle>
            <CardDescription>Manage all your projects in one place</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <div className="text-muted-foreground">Loading projects...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{project.description}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(project.status)}
                          {project.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.startDate).toLocaleDateString()}
                        </div>
                        {project.endDate && (
                          <div className="text-muted-foreground">
                            → {new Date(project.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                <AlertDescription>
                                  Are you sure you want to delete "{project.name}"? This action cannot be undone.
                                </AlertDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(project)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && filteredProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No projects found.{" "}
                {projects.length === 0 ? "Create your first project!" : "Try adjusting your filters."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update the project details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={formErrors.description ? "border-destructive" : ""}
                  rows={3}
                />
                {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={formErrors.startDate ? "border-destructive" : ""}
                  />
                  {formErrors.startDate && <p className="text-sm text-destructive">{formErrors.startDate}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={formErrors.endDate ? "border-destructive" : ""}
                />
                {formErrors.endDate && <p className="text-sm text-destructive">{formErrors.endDate}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
