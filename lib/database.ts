import type { Profile, Project, Task, ProjectMember, ProjectWithStats } from "./types"
import { createClient } from "./supabase/client"

// Authentication functions
export async function signIn(email: string, password: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error.message)
      return null
    }

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
      return profile
    }

    return null
  } catch (error) {
    console.error("Sign in error (catch block):", error)
    return null
  }
}

export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<{ success: boolean; needsConfirmation: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    })

    if (error) {
      console.error("Sign up error:", error.message)
      return { success: false, needsConfirmation: false, error: error.message }
    }

    if (data.user) {
      if (data.user && !data.user.email_confirmed_at) {
        return { success: true, needsConfirmation: true }
      }

      return { success: true, needsConfirmation: false }
    }

    return { success: true, needsConfirmation: true }
  } catch (error) {
    console.error("Sign up error (catch block):", error)
    return { success: false, needsConfirmation: false, error: "An unexpected error occurred" }
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    if (typeof window !== "undefined") {
      localStorage.setItem("google-oauth-pending", "true")
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      console.error("Google sign in error:", error.message)
      if (typeof window !== "undefined") {
        localStorage.removeItem("google-oauth-pending")
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Google sign in error (catch block):", error)
    if (typeof window !== "undefined") {
      localStorage.removeItem("google-oauth-pending")
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error.message)
    }
  } catch (error) {
    console.error("Sign out error (catch block):", error)
  }
}

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return profile
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

  if (error) {
    console.error("Error updating profile:", error)
    throw error
  }

  return true
}

export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("Change password error:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Change password error (catch block):", error)
    return false
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc("delete_user_account")

    if (error) {
      console.error("Delete account error:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Delete account error (catch block):", error)
    return false
  }
}

// Project functions
export async function getUserProjects(userId: string): Promise<ProjectWithStats[]> {
  try {
    const supabase = createClient()
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("projects")
      .select(`
        *,
        tasks(id, completed),
        project_members(id)
      `)
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })

    const { data: memberProjects, error: memberError } = await supabase
      .from("project_members")
      .select(`
        project:projects(
          *,
          tasks(id, completed),
          project_members(id)
        )
      `)
      .eq("profile_id", userId)

    if (ownedError) {
      console.error("Get owned projects error:", ownedError)
    }

    if (memberError) {
      console.error("Get member projects error:", memberError)
    }

    const allProjects = [...(ownedProjects || []), ...(memberProjects?.map((mp) => mp.project).filter(Boolean) || [])]

    const uniqueProjects = allProjects
      .filter((project, index, self) => index === self.findIndex((p) => p.id === project.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return uniqueProjects.map((project) => ({
      ...project,
      total_tasks: project.tasks?.length || 0,
      completed_tasks: project.tasks?.filter((task: any) => task.completed).length || 0,
      member_count: project.project_members?.length || 0,
    }))
  } catch (error) {
    console.error("Get user projects error:", error)
    return []
  }
}

export async function createProject(title: string, description?: string): Promise<Project | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          title,
          description,
          owner_id: user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error || !data) {
      console.error("Create project error:", error.message)
      throw new Error("You don't have permission to create projects")
    }

    await supabase.from("project_members").insert([
      {
        project_id: data.id,
        profile_id: user.id,
        role: "owner",
        joined_at: new Date().toISOString(),
      },
    ])

    return data
  } catch (error) {
    console.error("Create project error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create project")
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return data
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").update(updates).eq("id", projectId).select().single()

    if (error || !data) {
      console.error("Update project error:", error.message)
      throw new Error("You don't have permission to edit this project")
    }

    return data
  } catch (error) {
    console.error("Update project error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update project")
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").delete().eq("id", projectId).select()

    if (error) {
      console.error("Delete project error:", error.message)
      throw new Error("You don't have permission to delete this project")
    }

    if (!data || data.length === 0) {
      throw new Error("You don't have permission to delete this project")
    }

    return true
  } catch (error) {
    console.error("Delete project error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete project")
  }
}

// Task functions
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }

  return data || []
}

export async function createTask(projectId: string, title: string, description?: string): Promise<Task | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          project_id: projectId,
          title,
          description,
          completed: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error || !data) {
      console.error("Create task error:", error.message)
      throw new Error("You don't have permission to add tasks to this project")
    }

    return data
  } catch (error) {
    console.error("Create task error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create task")
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).select().single()

    if (error || !data) {
      console.error("Update task error:", error.message)
      throw new Error("You don't have permission to edit this task")
    }

    return data
  } catch (error) {
    console.error("Update task error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update task")
  }
}

export async function toggleTaskCompletion(taskId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: task, error: getError } = await supabase.from("tasks").select("completed").eq("id", taskId).single()

    if (getError || !task) {
      console.error("Get task error:", getError)
      throw new Error("You don't have permission to update this task")
    }

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", taskId)
      .select()

    if (updateError) {
      console.error("Toggle task completion error:", updateError.message)
      throw new Error("You don't have permission to update this task")
    }

    if (!data || data.length === 0) {
      throw new Error("You don't have permission to update this task")
    }

    return true
  } catch (error) {
    console.error("Toggle task completion error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to toggle task completion")
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select()

    if (error) {
      console.error("Delete task error:", error.message)
      throw new Error("You don't have permission to delete this task")
    }

    if (!data || data.length === 0) {
      throw new Error("You don't have permission to delete this task")
    }

    return true
  } catch (error) {
    console.error("Delete task error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete task")
  }
}

// Member functions
export async function getProjectMembers(projectId: string): Promise<(ProjectMember & { profile: Profile })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("project_members")
    .select(`
      *,
      profile:profiles (
        id,
        username,
        email,
        avatar_url
      )
    `)
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true })

  if (error) {
    console.error("Error fetching project members:", error)
    throw error
  }

  return data || []
}

export async function inviteMember(projectId: string, email: string, role = "viewer"): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      console.error("User not found:", profileError)
      throw new Error("User not found with this email address")
    }

    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("profile_id", profile.id)
      .single()

    if (existingMember) {
      throw new Error("User is already a member of this project")
    }

    const { data, error } = await supabase
      .from("project_members")
      .insert([
        {
          project_id: projectId,
          profile_id: profile.id,
          role,
          joined_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Invite member error:", error.message)
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error(
          "You don't have permission to invite members to this project. Only owners and admins can add members.",
        )
      }
      throw new Error("Failed to invite member")
    }

    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to invite members to this project. Only owners and admins can add members.",
      )
    }

    return true
  } catch (error) {
    console.error("Invite member error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to invite member")
  }
}

export async function removeMember(projectId: string, memberId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId)
      .select()

    if (error) {
      console.error("Remove member error:", error.message)
      if (error.message.includes("Cannot remove the last owner")) {
        throw new Error("Cannot remove the last owner of a project. Transfer ownership first.")
      }
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error(
          "You don't have permission to remove members from this project. Only owners and admins can remove members.",
        )
      }
      throw new Error("Failed to remove member")
    }

    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to remove members from this project. Only owners and admins can remove members.",
      )
    }

    return true
  } catch (error) {
    console.error("Remove member error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to remove member")
  }
}

export async function updateMemberRole(projectId: string, memberId: string, role: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId)
      .select()

    if (error) {
      console.error("Update member role error:", error.message)
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error(
          "You don't have permission to update member roles in this project. Only owners and admins can modify roles.",
        )
      }
      throw new Error("Failed to update member role")
    }

    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to update member roles in this project. Only owners and admins can modify roles.",
      )
    }

    return true
  } catch (error) {
    console.error("Update member role error (catch block):", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update member role")
  }
}

// Helper function to get current user's role in a project
export async function getCurrentUserRole(projectId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("profile_id", user.id)
      .single()

    if (error) {
      console.error("Get user role error:", error)
      return null
    }

    return data?.role || null
  } catch (error) {
    console.error("Get user role error (catch block):", error)
    return null
  }
}

// Helper function to check if the user came from Google OAuth
export function checkAndClearGoogleOAuthSuccess(): boolean {
  if (typeof window !== "undefined") {
    const pending = localStorage.getItem("google-oauth-pending")
    if (pending === "true") {
      localStorage.removeItem("google-oauth-pending")
      return true
    }
  }
  return false
}
