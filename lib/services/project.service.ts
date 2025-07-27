import { supabase } from "../supabase"
import type { Project, ProjectWithStats, MemberWithProfile } from "../types"

export class ProjectService {
  async getUserProjects(userId: string): Promise<ProjectWithStats[]> {
    try {
      console.log("=== FETCHING PROJECTS FOR USER ===", userId)

      // Step 1: Get user's memberships first (simple query)
      const { data: memberships, error: memberError } = await supabase
        .from("project_members")
        .select("project_id, role")
        .eq("profile_id", userId)

      if (memberError) {
        console.error("Error fetching memberships:", memberError)
        throw memberError
      }

      console.log("User memberships:", memberships)

      if (!memberships || memberships.length === 0) {
        console.log("No memberships found")
        return []
      }

      // Step 2: Get project details for each membership
      const projectIds = memberships.map((m) => m.project_id)

      const { data: projects, error: projectsError } = await supabase.from("projects").select("*").in("id", projectIds)

      if (projectsError) {
        console.error("Error fetching projects:", projectsError)
        throw projectsError
      }

      console.log("Projects data:", projects)

      if (!projects || projects.length === 0) {
        console.log("No projects found")
        return []
      }

      // Step 3: Get stats for each project
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const membership = memberships.find((m) => m.project_id === project.id)

          if (!membership) {
            console.warn("No membership found for project:", project.id)
            return null
          }

          try {
            // Get member count
            const { count: memberCount, error: membersError } = await supabase
              .from("project_members")
              .select("*", { count: "exact", head: true })
              .eq("project_id", project.id)

            if (membersError) {
              console.error("Error fetching member count:", membersError)
            }

            // Get task stats
            const { data: tasks, error: tasksError } = await supabase
              .from("tasks")
              .select("id, completed")
              .eq("project_id", project.id)

            if (tasksError) {
              console.error("Error fetching tasks:", tasksError)
            }

            const totalTasks = tasks?.length || 0
            const completedTasks = tasks?.filter((t) => t.completed).length || 0

            return {
              id: project.id,
              title: project.title,
              description: project.description,
              owner_id: project.owner_id,
              created_at: project.created_at,
              member_count: memberCount || 0,
              completed_tasks: completedTasks,
              total_tasks: totalTasks,
              user_role: membership.role,
              is_owner: membership.role === "owner",
            }
          } catch (error) {
            console.error("Error processing project stats:", error)
            return null
          }
        }),
      )

      // Filter out null results and sort by creation date
      const validProjects = projectsWithStats
        .filter((project): project is ProjectWithStats => project !== null)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      console.log("Final projects with stats:", validProjects)
      return validProjects
    } catch (error: any) {
      console.error("Full error in getUserProjects:", error)
      throw error
    }
  }

  async getProject(projectId: string): Promise<Project> {
    const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single()

    if (error) throw error
    return data
  }

  async createProject(title: string, description?: string, ownerId?: string): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title,
        description,
        owner_id: ownerId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from("projects").update(updates).eq("id", projectId).select().single()

    if (error) throw error
    return data
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (error) throw error
  }

  async getProjectMembers(projectId: string): Promise<MemberWithProfile[]> {
    try {
      // Step 1: Get project details to identify owner
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single()

      if (projectError) throw projectError

      // Step 2: Get project members
      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true })

      if (membersError) throw membersError

      if (!members || members.length === 0) {
        return []
      }

      // Step 3: Get profile data for each member
      const profileIds = members.map((m) => m.profile_id)

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .in("id", profileIds)

      if (profilesError) throw profilesError

      // Step 4: Combine the data and ensure owner role is correct
      return members.map((member) => {
        const profile = profiles?.find((p) => p.id === member.profile_id)
        const isOwner = member.profile_id === project.owner_id

        return {
          ...member,
          role: isOwner ? "owner" : member.role, // Ensure owner role is set correctly
          username: profile?.username || "Unknown",
          email: profile?.email || "Unknown",
          avatar_url: profile?.avatar_url,
        }
      })
    } catch (error) {
      console.error("Error fetching project members:", error)
      throw error
    }
  }

  async addMember(projectId: string, profileId: string, role: string): Promise<void> {
    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      profile_id: profileId,
      role,
    })

    if (error) throw error
  }

  async removeMember(projectId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("profile_id", profileId)

    if (error) throw error
  }

  async updateMemberRole(projectId: string, profileId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("project_id", projectId)
      .eq("profile_id", profileId)

    if (error) throw error
  }

  async getUserRole(projectId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("profile_id", userId)
      .single()

    if (error) return null
    return data.role
  }
}

// Create and export the service instance
export const projectService = new ProjectService()
