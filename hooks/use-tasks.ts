"use client"

import { useState, useEffect } from "react"
import { taskService } from "@/lib/services/task.service"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/lib/types"

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTasks = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await taskService.getProjectTasks(projectId)
      setTasks(data)
    } catch (err: any) {
      console.error("Error fetching tasks:", err)
      setError(err.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const createTask = async (title: string, description?: string) => {
    if (!projectId) return

    try {
      await taskService.createTask(projectId, title, description)
      await fetchTasks()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates)
      await fetchTasks()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId)
      await fetchTasks()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await taskService.toggleTaskCompletion(taskId, completed)
      await fetchTasks()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: fetchTasks,
  }
}
