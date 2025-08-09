import type { Profile, Project, Task, ProjectMember, ProjectWithStats } from "./types"
import { getSupabaseClient } from "./supabase"

// Authentication functions
export async function signIn(email: string, password: string): Promise<Profile | null> {
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error.message); // Log specific error message
      return null
    }

    if (data.user) {
      const { data: profile } = await getSupabaseClient().from("profiles").select("*").eq("id", data.user.id).single()
      return profile
    }

    return null
  } catch (error) {
    console.error("Sign in error (catch block):", error); // Log generic error
    return null
  }
}

export async function signUp(username: string, email: string, password: string): Promise<Profile | null> {
  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Sign up error:", error.message); // Log specific error message
      return null
    }

    if (data.user) {
      // Create user profile
      const { data: profile, error: profileError } = await getSupabaseClient()
        .from("profiles")
        .insert([
          {
            id: data.user.id,
            username,
            email,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return null
      }

      return profile
    }

    return null
  } catch (error) {
    console.error("Sign up error (catch block):", error); // Log generic error
    return null
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      console.error("Google sign in error:", error.message) // Log specific error message
      return { success: false, error: error.message }
    }

    // The redirect will happen automatically, so we return success
    return { success: true }
  } catch (error) {
    console.error("Google sign in error (catch block):", error) // Log generic error
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) {
      console.error("Sign out error:", error.message) // Log specific error message
    }
  } catch (error) {
    console.error("Sign out error (catch block):", error) // Log generic error
  }
}

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const { data: { user } } = await getSupabaseClient().auth.getUser()
    
    if (!user) return null

    // Check if profile exists, if not create one (for Google OAuth users)
    let { data: profile, error } = await getSupabaseClient()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const { data: newProfile, error: createError } = await getSupabaseClient()
        .from("profiles")
        .insert([
          {
            id: user.id,
            username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error("Error creating profile:", createError)
        return null
      }

      profile = newProfile
    } else if (error) {
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
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const { error } = await getSupabaseClient()
    .from("profiles")
    .update(updates)
    .eq("id", userId)

  if (error) {
    console.error("Error updating profile:", error)
    throw error
  }

  return true
}

export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseClient().auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("Change password error:", error.message) // Log specific error message
      return false
    }

    return true
  } catch (error) {
    console.error("Change password error (catch block):", error) // Log generic error
    return false
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    // Note: This requires RLS policies and potentially server-side function
    // to properly delete user data and account
    const {
      data: { user },
    } = await getSupabaseClient().auth.getUser()

    if (!user) return false

    // Delete user profile and related data
    const { error } = await getSupabaseClient().from("profiles").delete().eq("id", user.id)

    if (error) {
      console.error("Delete account error:", error.message) // Log specific error message
      return false
    }

    // Sign out after deletion
    await getSupabaseClient().auth.signOut()
    return true
  } catch (error) {
    console.error("Delete account error (catch block):", error) // Log generic error
    return false
  }
}

// Project functions
export async function getUserProjects(userId: string): Promise<ProjectWithStats[]> {
  try {
    // First get projects where user is owner
    const { data: ownedProjects, error: ownedError } = await getSupabaseClient()
      .from("projects")
      .select(`
        *,
        tasks(id, completed),
        project_members(id)
      `)
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })

    // Also get projects where user is a member
    const { data: memberProjects, error: memberError } = await getSupabaseClient()
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

    // Remove duplicates and sort by creation date (oldest first, newest last)
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
    const {
      data: { user },
    } = await getSupabaseClient().auth.getUser()

    if (!user) return null

    const { data, error } = await getSupabaseClient()
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
      console.error("Create project error:", error.message) // Log specific error message
      throw new Error("You don't have permission to create projects")
    }

    // Add owner as project member
    await getSupabaseClient().from("project_members").insert([
      {
        project_id: data.id,
        profile_id: user.id,
        role: "owner",
        joined_at: new Date().toISOString(),
      },
    ])

    return data
  } catch (error) {
    console.error("Create project error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create project")
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return data
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").update(updates).eq("id", projectId).select().single()

    if (error || !data) {
      console.error("Update project error:", error.message) // Log specific error message
      throw new Error("You don't have permission to edit this project")
    }

    return data
  } catch (error) {
    console.error("Update project error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update project")
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").delete().eq("id", projectId).select()

    if (error) {
      console.error("Delete project error:", error.message) // Log specific error message
      throw new Error("You don't have permission to delete this project")
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      throw new Error("You don't have permission to delete this project")
    }

    return true
  } catch (error) {
    console.error("Delete project error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete project")
  }
}

// Task functions
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await getSupabaseClient()
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
    const { data, error } = await getSupabaseClient()
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
      console.error("Create task error:", error.message) // Log specific error message
      throw new Error("You don't have permission to add tasks to this project")
    }

    return data
  } catch (error) {
    console.error("Create task error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create task")
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").update(updates).eq("id", taskId).select().single()

    if (error || !data) {
      console.error("Update task error:", error.message) // Log specific error message
      throw new Error("You don't have permission to edit this task")
    }

    return data
  } catch (error) {
    console.error("Update task error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update task")
  }
}

export async function toggleTaskCompletion(taskId: string): Promise<boolean> {
  try {
    // First get the current task
    const { data: task, error: getError } = await getSupabaseClient().from("tasks").select("completed").eq("id", taskId).single()

    if (getError || !task) {
      console.error("Get task error:", getError)
      throw new Error("You don't have permission to update this task")
    }

    // Toggle the completion status
    const { data, error: updateError } = await getSupabaseClient()
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", taskId)
      .select()

    if (updateError) {
      console.error("Toggle task completion error:", updateError.message) // Log specific error message
      throw new Error("You don't have permission to update this task")
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      throw new Error("You don't have permission to update this task")
    }

    return true
  } catch (error) {
    console.error("Toggle task completion error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to toggle task completion")
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").delete().eq("id", taskId).select()

    if (error) {
      console.error("Delete task error:", error.message) // Log specific error message
      throw new Error("You don't have permission to delete this task")
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      throw new Error("You don't have permission to delete this task")
    }

    return true
  } catch (error) {
    console.error("Delete task error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete task")
  }
}

// Member functions
export async function getProjectMembers(projectId: string): Promise<(ProjectMember & { profile: Profile })[]> {
  const { data, error } = await getSupabaseClient()
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

export async function inviteMember(projectId: string, email: string, role: string = "viewer"): Promise<boolean> {
  try {
    // First, find the user by email
    const { data: profile, error: profileError } = await getSupabaseClient()
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      console.error("User not found:", profileError)
      throw new Error("User not found with this email address")
    }

    // Check if user is already a member
    const { data: existingMember } = await getSupabaseClient()
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("profile_id", profile.id)
      .single()

    if (existingMember) {
      throw new Error("User is already a member of this project")
    }

    // Add user as project member
    const { data, error } = await getSupabaseClient()
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
      console.error("Invite member error:", error.message) // Log specific error message
      // Check if it's a permission error
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error(
          "You don't have permission to invite members to this project. Only owners and admins can add members.",
        )
      }
      throw new Error("Failed to invite member")
    }

    // Check if any rows were actually inserted
    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to invite members to this project. Only owners and admins can add members.",
      )
    }

    return true
  } catch (error) {
    console.error("Invite member error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to invite member")
  }
}

export async function removeMember(projectId: string, memberId: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId)
      .select()

    if (error) {
      console.error("Remove member error:", error.message) // Log specific error message
      // Check for specific error messages
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

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to remove members from this project. Only owners and admins can remove members.",
      )
    }

    return true
  } catch (error) {
    console.error("Remove member error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to remove member")
  }
}

export async function updateMemberRole(projectId: string, memberId: string, role: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId)
      .select()

    if (error) {
      console.error("Update member role error:", error.message) // Log specific error message
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error(
          "You don't have permission to update member roles in this project. Only owners and admins can modify roles.",
        )
      }
      throw new Error("Failed to update member role")
    }

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      throw new Error(
        "You don't have permission to update member roles in this project. Only owners and admins can modify roles.",
      )
    }

    return true
  } catch (error) {
    console.error("Update member role error (catch block):", error) // Log generic error
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update member role")
  }
}

// Helper function to get current user's role in a project
export async function getCurrentUserRole(projectId: string): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await getSupabaseClient().auth.getUser()

    if (!user) return null

    const { data, error } = await getSupabaseClient()
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
    console.error("Get user role error (catch block):", error) // Log generic error
    return null
  }
}
