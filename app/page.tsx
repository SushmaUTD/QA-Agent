"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Edit, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, X } from "lucide-react"

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

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active" as Project["status"],
    priority: "Medium" as Project["priority"],
    startDate: "",
    endDate: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Load projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Filter projects when search term or filters change
  useEffect(() => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    if (priorityFilter !== "All") {
      filtered = filtered.filter((project) => project.priority === priorityFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchTerm, statusFilter, priorityFilter])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 3 || formData.name.length > 100) {
      errors.name = "Name must be between 3 and 100 characters"
    }

    if (!formData.description || formData.description.length < 10 || formData.description.length > 500) {
      errors.description = "Description must be between 10 and 500 characters"
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required"
    } else {
      const startYear = new Date(formData.startDate).getFullYear()
      if (startYear < 2020) {
        errors.startDate = "Start date cannot be before 2020"
      }
    }

    if (formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const tenYearsFromNow = new Date()
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)

      if (endDate <= startDate) {
        errors.endDate = "End date must be after start date"
      }

      if (endDate > tenYearsFromNow) {
        errors.endDate = "End date cannot be more than 10 years in the future"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateProject = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create project")

      const newProject = await response.json()
      setProjects((prev) => [...prev, newProject])
      setIsCreateModalOpen(false)
      resetForm()
      toast({
        title: "Success",
        description: "Project created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProject = async () => {
    if (!editingProject || !validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to update project")

      const updatedProject = await response.json()
      setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? updatedProject : p)))
      setIsEditModalOpen(false)
      setEditingProject(null)
      resetForm()
      toast({
        title: "Success",
        description: "Project updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete project")

      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (project: Project) => {
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
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "Active",
      priority: "Medium",
      startDate: "",
      endDate: "",
    })
    setFormErrors({})
  }

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "Active":
        return <Clock className="h-4 w-4" />
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      case "On-hold":
        return <AlertCircle className="h-4 w-4" />
      case "Cancelled":
        return <X className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Project Management</h1>
          <p className="text-xl text-muted-foreground">Manage your projects with full CRUD operations</p>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On-hold">On-hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className={formErrors.name ? "border-destructive" : ""}
                        />
                        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                          className={formErrors.description ? "border-destructive" : ""}
                          rows={3}
                        />
                        {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: Project["status"]) =>
                              setFormData((prev) => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="On-hold">On-hold</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value: Project["priority"]) =>
                              setFormData((prev) => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                            className={formErrors.startDate ? "border-destructive" : ""}
                          />
                          {formErrors.startDate && <p className="text-sm text-destructive">{formErrors.startDate}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                            className={formErrors.endDate ? "border-destructive" : ""}
                          />
                          {formErrors.endDate && <p className="text-sm text-destructive">{formErrors.endDate}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateProject} disabled={isLoading} className="flex-1">
                          {isLoading ? "Creating..." : "Create Project"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projects ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg mb-2">No projects found</p>
                <p className="text-sm text-muted-foreground">
                  {projects.length === 0
                    ? "Create your first project to get started"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        <TableCell className="max-w-xs truncate">{project.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getStatusIcon(project.status)}
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                        </TableCell>
                        <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(project)}
                              disabled={isLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className={formErrors.description ? "border-destructive" : ""}
                  rows={3}
                />
                {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Project["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On-hold">On-hold</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Project["priority"]) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className={formErrors.startDate ? "border-destructive" : ""}
                  />
                  {formErrors.startDate && <p className="text-sm text-destructive">{formErrors.startDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className={formErrors.endDate ? "border-destructive" : ""}
                  />
                  {formErrors.endDate && <p className="text-sm text-destructive">{formErrors.endDate}</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditProject} disabled={isLoading} className="flex-1">
                  {isLoading ? "Updating..." : "Update Project"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
