"use client"

import { useState, useEffect } from "react"
import { projectService } from "@/lib/services/project.service"
import { useToast } from "@/hooks/use-toast"
import type { ProjectWithStats } from "@/lib/types"

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProjects = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await projectService.getUserProjects(userId)
      setProjects(data)
    } catch (err: any) {
      console.error("Error in useProjects:", err)
      setError(err.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [userId])

  const createProject = async (title: string, description?: string) => {
    if (!userId) return

    try {
      await projectService.createProject(title, description, userId)
      await fetchProjects()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateProject = async (projectId: string, updates: { title?: string; description?: string }) => {
    try {
      await projectService.updateProject(projectId, updates)
      await fetchProjects()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId)
      await fetchProjects()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
