"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Calendar, CheckCircle2, Circle, Edit, Trash2, UserPlus } from 'lucide-react'
import { AuthGuard } from "@/components/auth-guard"
import { HeaderNav } from "@/components/header-nav"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/components/toast"
import {
  getProject,
  getProjectTasks,
  getProjectMembers,
  toggleTaskCompletion,
  deleteTask,
  removeMember,
  getCurrentUserRole,
} from "@/lib/database"
import type { Project, Task, ProjectMember, Profile } from "@/lib/types"

// This is now a client component that handles all interactive logic and data fetching.
export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { addToast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<(ProjectMember & { profile: Profile })[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<(ProjectMember & { profile: Profile }) | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const [projectData, tasksData, membersData, roleData] = await Promise.all([
        getProject(projectId),
        getProjectTasks(projectId),
        getProjectMembers(projectId),
        getCurrentUserRole(projectId),
      ])

      if (!projectData) {
        addToast({
          title: "Error",
          description: "Project not found or you don't have access to it",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setProject(projectData)
      setTasks(tasksData)
      setMembers(membersData)
      setUserRole(roleData)
    } catch (error) {
      console.error("Failed to load project data:", error)
      addToast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    const originalTasks = [...tasks]
    
    // Optimistic update
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ))

    try {
      await toggleTaskCompletion(taskId)
      const task = tasks.find(t => t.id === taskId)
      addToast({
        title: "Success",
        description: `Task "${task?.title}" marked as ${task?.completed ? "incomplete" : "complete"}.`,
        variant: "success",
      })
    } catch (error) {
      // Revert optimistic update
      setTasks(originalTasks)
      const errorMessage = error instanceof Error ? error.message : "Failed to update task"
      addToast({
        title: "Unauthorized",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      await deleteTask(taskToDelete.id)
      setTasks(tasks.filter(t => t.id !== taskToDelete.id))
      addToast({
        title: "Success",
        description: `Task "${taskToDelete.title}" deleted successfully.`,
        variant: "success",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task"
      addToast({
        title: "Unauthorized",
        description: errorMessage,
        variant: "destructive",
      })
    }
    setTaskToDelete(null)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await removeMember(projectId, memberToRemove.id)
      setMembers(members.filter(m => m.id !== memberToRemove.id))
      addToast({
        title: "Success",
        description: `Member "${memberToRemove.profile.username}" removed successfully.`,
        variant: "success",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove member"
      addToast({
        title: "Unauthorized",
        description: errorMessage,
        variant: "destructive",
      })
    }
    setMemberToRemove(null)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setShowEditTask(true)
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const canEdit = userRole === "owner" || userRole === "admin" || userRole === "editor"
  const canManageMembers = userRole === "owner" || userRole === "admin"
  const canManageProject = userRole === "owner" || userRole === "admin"

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <HeaderNav title="Loading..." subtitle="Please wait..." />
          <main className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (!project) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <HeaderNav title="Project Not Found" subtitle="The project you're looking for doesn't exist" />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Project not found</h1>
              <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <HeaderNav 
          title={project.title} 
          subtitle={project.description || "No description"}
          showBackButton={true}
          backUrl="/dashboard"
        />

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Project Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Progress</CardTitle>
                    <CardDescription>Track completion across all tasks in this project</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{progress}%</div>
                    <div className="text-sm text-muted-foreground">Complete</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full mb-4" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{completedTasks} completed</span>
                  <span>{totalTasks} total tasks</span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList>
                <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Tasks</h2>
                  {canEdit && (
                    <Button onClick={() => setShowCreateTask(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            checked={task.completed} 
                            onCheckedChange={() => handleToggleTask(task.id)}
                            disabled={!canEdit}
                          />
                          <div className={task.completed ? "line-through text-muted-foreground" : ""}>
                            <h3 className="font-medium">{task.title}</h3>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(task.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setTaskToDelete(task)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {tasks.length === 0 && (
                    <Card className="text-center py-12">
                      <CardContent>
                        <div className="text-muted-foreground mb-4">
                          <Plus className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>No tasks yet</p>
                          <p className="text-sm">Create your first task to get started</p>
                        </div>
                        {canEdit && (
                          <Button onClick={() => setShowCreateTask(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Task
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Members</h2>
                  {canManageMembers && (
                    <Button onClick={() => setShowInviteMember(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.profile.avatar_url || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback>{member.profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{member.profile.username}</h3>
                            <p className="text-sm text-muted-foreground">{member.profile.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>
                          {member.role !== "owner" && canManageMembers && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Dialogs */}
        <CreateTaskDialog
          projectId={projectId}
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          onSuccess={() => {
            loadProjectData()
            setShowCreateTask(false)
          }}
        />

        {selectedTask && (
          <EditTaskDialog
            task={selectedTask}
            open={showEditTask}
            onOpenChange={(open) => {
              setShowEditTask(open)
              if (!open) setSelectedTask(null)
            }}
            onSuccess={() => {
              loadProjectData()
              setShowEditTask(false)
              setSelectedTask(null)
            }}
          />
        )}

        {project && (
          <EditProjectDialog
            project={project}
            open={showEditProject}
            onOpenChange={setShowEditProject}
            onSuccess={() => {
              loadProjectData()
              setShowEditProject(false)
            }}
          />
        )}

        <InviteMemberDialog
          projectId={projectId}
          open={showInviteMember}
          onOpenChange={setShowInviteMember}
          onSuccess={() => {
            loadProjectData()
            setShowInviteMember(false)
          }}
        />

        <ConfirmDialog
          open={!!taskToDelete}
          onOpenChange={(open) => !open && setTaskToDelete(null)}
          title="Delete Task"
          description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete Task"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteTask}
        />

        <ConfirmDialog
          open={!!memberToRemove}
          onOpenChange={(open) => !open && setMemberToRemove(null)}
          title="Remove Member"
          description={`Are you sure you want to remove "${memberToRemove?.profile.username}" from this project? They will lose access to all project data.`}
          confirmText="Remove Member"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleRemoveMember}
        />
      </div>
    </AuthGuard>
  )
}
