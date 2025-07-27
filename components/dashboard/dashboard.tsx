"use client"

import { Card } from "@/components/ui/card"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useProjects } from "@/hooks/use-projects"
import { useProfile } from "@/hooks/use-profile"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProjectCard } from "./project-card"
import { CreateProjectDialog } from "./create-project-dialog"
import { EditProjectDialog } from "./edit-project-dialog"
import { DeleteConfirmationDialog } from "../ui/delete-confirmation-dialog"
import { UserMenu } from "../ui/user-menu"
import { ThemeToggle } from "../ui/theme-toggle"
import { ProgressBar } from "../ui/progress-bar"
import type { User } from "@supabase/supabase-js"
import type { ProjectWithStats } from "@/lib/types"

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null)
  const [deletingProject, setDeletingProject] = useState(false)

  const { signOut } = useAuth()
  const { projects, loading, createProject, updateProject, deleteProject, refetch } = useProjects(user.id)
  const { profile } = useProfile(user.id)
  const router = useRouter()

  const handleCreateProject = async (title: string, description?: string) => {
    await createProject(title, description)
    setShowCreateDialog(false)
    await refetch()
  }

  const handleEditProject = (project: ProjectWithStats) => {
    setSelectedProject(project)
    setShowEditDialog(true)
  }

  const handleUpdateProject = async (title: string, description?: string) => {
    if (!selectedProject) return
    await updateProject(selectedProject.id, { title, description })
    setShowEditDialog(false)
    setSelectedProject(null)
    await refetch()
  }

  const handleDeleteProject = (project: ProjectWithStats) => {
    setSelectedProject(project)
    setShowDeleteDialog(true)
  }

  const confirmDeleteProject = async () => {
    if (!selectedProject) return

    setDeletingProject(true)
    try {
      await deleteProject(selectedProject.id)
      setShowDeleteDialog(false)
      setSelectedProject(null)
      await refetch()
    } finally {
      setDeletingProject(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  // Calculate overall stats
  const totalTasks = projects.reduce((sum, project) => sum + project.total_tasks, 0)
  const completedTasks = projects.reduce((sum, project) => sum + project.completed_tasks, 0)
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ToDo App
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.username || user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu
              profile={profile}
              onSettingsClick={handleSettingsClick}
              onSignOut={async () => {
                await signOut()
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        {projects.length > 0 && (
          <div className="mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Overall Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed across {projects.length} projects
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{Math.round(overallProgress)}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
              <ProgressBar value={completedTasks} max={totalTasks} />
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">My Projects</h2>
            <p className="text-muted-foreground">Manage your todo lists and collaborate with others</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="btn-scale focus-ring">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No projects yet</h3>
              <p className="text-muted-foreground">
                Get started by creating your first project to organize your tasks and collaborate with others.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} size="lg" className="btn-scale focus-ring">
                <Plus className="w-4 h-4 mr-2" />
                Create your first project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                onEdit={() => handleEditProject(project)}
                onDelete={() => handleDeleteProject(project)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSubmit={handleCreateProject} />

      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={selectedProject}
        onSubmit={handleUpdateProject}
      />

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will delete all tasks and members."
        loading={deletingProject}
      />
    </div>
  )
}
