"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus } from 'lucide-react'
import { AuthGuard } from "@/components/auth-guard"
import { HeaderNav } from "@/components/header-nav"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { getUserProjects, getCurrentUser } from "@/lib/database"
import type { ProjectWithStats, Profile } from "@/lib/types"
import { useToast } from "@/components/toast"

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    loadUserAndProjects()
  }, [])

  const loadUserAndProjects = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/auth/signin")
        return
      }

      setUser(currentUser)
      const userProjects = await getUserProjects(currentUser.id)
      setProjects(userProjects)
    } catch (error) {
      console.error("Failed to load data:", error)
      addToast({
        title: "Error",
        description: "Failed to load projects. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProjectUpdate = () => {
    loadUserAndProjects()
  }

  const totalTasks = projects.reduce((sum, project) => sum + project.total_tasks, 0)
  const completedTasks = projects.reduce((sum, project) => sum + project.completed_tasks, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <HeaderNav title="Dashboard" subtitle="Loading your projects..." />
          <main className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-32 bg-muted rounded"></div>
              <div className="flex items-center justify-between">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded w-32"></div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <HeaderNav title="ToDo App" subtitle={`Welcome back, ${user?.username || "User"}`} />

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overall Progress</CardTitle>
                    <CardDescription>
                      {completedTasks} of {totalTasks} tasks completed across {projects.length} projects
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{overallProgress}%</div>
                    <div className="text-sm text-muted-foreground">Complete</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={overallProgress} className="w-full" />
              </CardContent>
            </Card>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                <p className="text-muted-foreground">
                  {projects.length === 0 
                    ? "Create your first project to get started" 
                    : `You have ${projects.length} project${projects.length === 1 ? '' : 's'}`
                  }
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdate={handleProjectUpdate}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground mb-4">
                    <Plus className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-sm">Create your first project to start organizing your tasks</p>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            loadUserAndProjects()
            setShowCreateDialog(false)
          }}
        />
      </div>
    </AuthGuard>
  )
}
