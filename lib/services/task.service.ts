import { supabase } from "../supabase"
import type { Task } from "../types"

export class TaskService {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  }

  async createTask(projectId: string, title: string, description?: string): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title,
        description,
      })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error("Failed to create task - permission denied")

    return data
  }

  async updateTask(taskId: string, updates: Partial<Pick<Task, "title" | "description" | "completed">>): Promise<Task> {
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).select().single()

    if (error) throw error
    if (!data) throw new Error("Failed to update task - permission denied")

    return data
  }

  async deleteTask(taskId: string): Promise<void> {
    const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select("id")

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error("Failed to delete task - permission denied")
    }
  }

  async toggleTaskCompletion(taskId: string, completed: boolean): Promise<Task> {
    const { data, error } = await supabase.from("tasks").update({ completed }).eq("id", taskId).select().single()

    if (error) throw error
    if (!data) throw new Error("Failed to update task - permission denied")

    return data
  }
}

// Create and export the service instance
export const taskService = new TaskService()
