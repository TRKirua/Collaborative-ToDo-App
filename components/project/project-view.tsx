"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, UserPlus, Edit, ArrowLeft, Crown } from "lucide-react"
import { useMembers } from "@/hooks/use-members"
import { useTasks } from "@/hooks/use-tasks"
import { useToast } from "@/hooks/use-toast"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import { RemoveMemberDialog } from "@/components/remove-member-dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { UserMenu } from "@/components/ui/user-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { projectService } from "@/lib/services/project.service"
import { useProfile } from "@/hooks/use-profile"
import { hasPermission } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import type { Project, MemberWithProfile, Task, UserRole } from "@/lib/types"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useAuth } from "@/hooks/use-auth"

interface ProjectViewProps {
  projectId: string
  user: User
}

export function ProjectView({ projectId, user }: ProjectViewProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)
  const [showRemoveMember, setShowRemoveMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const { members, loading: membersLoading, removeMember, refetch: refetchMembers } = useMembers(projectId)
  const { tasks, loading: tasksLoading, toggleTask, deleteTask, refetch: refetchTasks } = useTasks(projectId)
  const { profile } = useProfile(user.id)
  const { toast } = useToast()
  const router = useRouter()
  const { signOut } = useAuth()

  // Get current user's role and permissions
  const currentMember = members.find((m) => m.profile_id === user.id)
  const userRole = (currentMember?.role || "viewer") as UserRole
  const isOwner = project?.owner_id === user.id

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setProjectLoading(true)
      const projectData = await projectService.getProject(projectId)
      setProject(projectData)
    } catch (error: any) {
      console.error("Error fetching project:", error)
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      })
    } finally {
      setProjectLoading(false)
    }
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await toggleTask(taskId, completed)
      // Task list will be automatically refreshed by the hook
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return

    try {
      await deleteTask(deletingTask.id)
      setDeletingTask(null)
      // Task list will be automatically refreshed by the hook
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    try {
      await removeMember(selectedMember.profile_id)
      setShowRemoveMember(false)
      setSelectedMember(null)
      // Member list will be automatically refreshed by the hook
      toast({
        title: "Success",
        description: "Member removed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const openRemoveMemberDialog = (member: MemberWithProfile) => {
    setSelectedMember(member)
    setShowRemoveMember(true)
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-4">Project not found</div>
          <Button onClick={() => router.push("/")} className="btn-scale focus-ring">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="focus-ring">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                {isOwner && <Crown className="w-5 h-5 text-warning" />}
                {!isOwner && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {userRole}
                  </Badge>
                )}
              </div>
              {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu
              profile={profile}
              onSettingsClick={() => router.push("/settings")}
              onSignOut={async () => {
                await signOut()
                router.push("/")
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Progress Overview */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Project Progress</h2>
                <p className="text-sm text-muted-foreground">Track completion across all tasks in this project</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            <ProgressBar value={completedTasks} max={totalTasks} />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{completedTasks} completed</span>
              <span>{totalTasks} total tasks</span>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Tasks ({totalTasks})
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Tasks</h2>
              {hasPermission(userRole, "CREATE_TASK") && (
                <Button onClick={() => setShowCreateTask(true)} className="btn-scale focus-ring">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>

            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted-foreground text-lg mb-4">No tasks yet</p>
                {hasPermission(userRole, "CREATE_TASK") && (
                  <Button onClick={() => setShowCreateTask(true)} className="btn-scale focus-ring">
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                            className="mt-1"
                            disabled={!hasPermission(userRole, "EDIT_TASK")}
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-medium ${
                                task.completed ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p
                                className={`text-sm mt-1 ${
                                  task.completed ? "line-through text-muted-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {task.description}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Created {new Date(task.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {hasPermission(userRole, "EDIT_TASK") && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="focus-ring"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingTask(task)}
                              className="text-destructive hover:text-destructive focus-ring"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Members</h2>
              {hasPermission(userRole, "INVITE_MEMBER") && (
                <Button onClick={() => setShowInviteMember(true)} className="btn-scale focus-ring">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>

            {membersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground mt-2">Loading members...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members
                  .sort((a, b) => {
                    // Sort by role priority: owner > admin > editor > viewer
                    const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3 }
                    return roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder]
                  })
                  .map((member) => (
                    <Card key={member.profile_id} className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <span className="text-sm font-medium">{member.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{member.username}</p>
                                {member.role === "owner" && <Crown className="w-4 h-4 text-warning" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={member.role === "owner" ? "default" : "secondary"}
                              className={
                                member.role === "owner"
                                  ? "bg-warning text-warning-foreground"
                                  : member.role === "admin"
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                              }
                            >
                              {member.role}
                            </Badge>
                            {hasPermission(userRole, "REMOVE_MEMBER") &&
                              member.role !== "owner" &&
                              member.profile_id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRemoveMemberDialog(member)}
                                  className="text-destructive hover:text-destructive focus-ring"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onTaskCreated={() => {
          setShowCreateTask(false)
          refetchTasks() // Refresh tasks immediately
        }}
        projectId={projectId}
        userId={user.id}
      />

      {editingTask && (
        <EditTaskDialog
          open={!!editingTask}
          onOpenChange={() => setEditingTask(null)}
          onTaskUpdated={() => {
            setEditingTask(null)
            refetchTasks() // Refresh tasks immediately
          }}
          task={editingTask}
        />
      )}

      <DeleteConfirmationDialog
        open={!!deletingTask}
        onOpenChange={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
      />

      <InviteMemberDialog
        open={showInviteMember}
        onOpenChange={setShowInviteMember}
        onMemberInvited={() => {
          setShowInviteMember(false)
          refetchMembers() // Refresh members immediately
        }}
        projectId={projectId}
        currentUserId={user.id}
        currentUserRole={userRole as "owner" | "admin"}
      />

      <RemoveMemberDialog
        open={showRemoveMember}
        onOpenChange={setShowRemoveMember}
        member={selectedMember}
        onConfirm={handleRemoveMember}
      />
    </div>
  )
}
