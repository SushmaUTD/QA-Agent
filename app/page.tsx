"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormField } from "@/components/ui/form-field"
import { ToastContainer } from "@/components/ui/toast"
import { Plus, Edit, Trash2, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"
import type { Project } from "@/lib/data-store"
import { validateProjectForm, getFieldError, type ValidationError, type ProjectFormData } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    startDate: "",
    endDate: "",
  })

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
        success("Projects loaded successfully")
      } else {
        error("Failed to load projects", data.error)
      }
    } catch (err) {
      error("Failed to load projects", "Please check your connection and try again")
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async () => {
    const errors = validateProjectForm(formData)
    setValidationErrors(errors)

    if (errors.length > 0) {
      warning("Please fix the form errors", "Check the highlighted fields and try again")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setProjects([...projects, data.data])
        setIsAddDialogOpen(false)
        resetForm()
        success("Project created successfully", `"${data.data.name}" has been added to your projects`)
      } else {
        error("Failed to create project", data.error)
      }
    } catch (err) {
      error("Failed to create project", "Please check your connection and try again")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProject = async () => {
    if (!editingProject) return

    const errors = validateProjectForm(formData)
    setValidationErrors(errors)

    if (errors.length > 0) {
      warning("Please fix the form errors", "Check the highlighted fields and try again")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setProjects(projects.map((p) => (p.id === editingProject.id ? data.data : p)))
        setIsEditDialogOpen(false)
        setEditingProject(null)
        resetForm()
        success("Project updated successfully", `"${data.data.name}" has been updated`)
      } else {
        error("Failed to update project", data.error)
      }
    } catch (err) {
      error("Failed to update project", "Please check your connection and try again")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        setProjects(projects.filter((p) => p.id !== id))
        success("Project deleted successfully", `"${name}" has been removed from your projects`)
      } else {
        error("Failed to delete project", data.error)
      }
    } catch (err) {
      error("Failed to delete project", "Please check your connection and try again")
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
    setValidationErrors([])
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate || "",
    })
    setValidationErrors([])
    setIsEditDialogOpen(true)
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
            <p className="text-muted-foreground mt-2">Manage your projects with full CRUD operations</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>Create a new project with all the necessary details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField label="Name" htmlFor="name" required error={getFieldError(validationErrors, "name")}>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    className={getFieldError(validationErrors, "name") ? "border-destructive" : ""}
                  />
                </FormField>

                <FormField
                  label="Description"
                  htmlFor="description"
                  required
                  error={getFieldError(validationErrors, "description")}
                >
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter project description"
                    rows={3}
                    className={getFieldError(validationErrors, "description") ? "border-destructive" : ""}
                  />
                </FormField>

                <FormField label="Status" htmlFor="status" required error={getFieldError(validationErrors, "status")}>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Project["status"]) => setFormData({ ...formData, status: value })}
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
                </FormField>

                <FormField
                  label="Priority"
                  htmlFor="priority"
                  required
                  error={getFieldError(validationErrors, "priority")}
                >
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Project["priority"]) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Start Date"
                  htmlFor="startDate"
                  required
                  error={getFieldError(validationErrors, "startDate")}
                >
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={getFieldError(validationErrors, "startDate") ? "border-destructive" : ""}
                  />
                </FormField>

                <FormField label="End Date" htmlFor="endDate" error={getFieldError(validationErrors, "endDate")}>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={getFieldError(validationErrors, "endDate") ? "border-destructive" : ""}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddProject} disabled={submitting} className="bg-primary text-primary-foreground">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
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
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={project.description}>
                        {project.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(project.status)}
                          {project.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                      </TableCell>
                      <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(project)}>
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
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{project.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProject(project.id, project.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No projects found.{" "}
                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Add your first project to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update the project details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField label="Name" htmlFor="edit-name" required error={getFieldError(validationErrors, "name")}>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={getFieldError(validationErrors, "name") ? "border-destructive" : ""}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="edit-description"
                required
                error={getFieldError(validationErrors, "description")}
              >
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={getFieldError(validationErrors, "description") ? "border-destructive" : ""}
                />
              </FormField>

              <FormField
                label="Status"
                htmlFor="edit-status"
                required
                error={getFieldError(validationErrors, "status")}
              >
                <Select
                  value={formData.status}
                  onValueChange={(value: Project["status"]) => setFormData({ ...formData, status: value })}
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
              </FormField>

              <FormField
                label="Priority"
                htmlFor="edit-priority"
                required
                error={getFieldError(validationErrors, "priority")}
              >
                <Select
                  value={formData.priority}
                  onValueChange={(value: Project["priority"]) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Start Date"
                htmlFor="edit-startDate"
                required
                error={getFieldError(validationErrors, "startDate")}
              >
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={getFieldError(validationErrors, "startDate") ? "border-destructive" : ""}
                />
              </FormField>

              <FormField label="End Date" htmlFor="edit-endDate" error={getFieldError(validationErrors, "endDate")}>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={getFieldError(validationErrors, "endDate") ? "border-destructive" : ""}
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleEditProject} disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
