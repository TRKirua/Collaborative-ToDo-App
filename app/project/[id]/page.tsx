"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProjectView } from "@/components/project/project-view"
import { projectService } from "@/lib/services/project.service"
import { isSupabaseConfigured } from "@/lib/supabase"
import type { Project } from "@/lib/types"

export const dynamic = "force-dynamic"

export default function ProjectPage() {
  const { user, loading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [configError, setConfigError] = useState(false)
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  useEffect(() => {
    setMounted(true)
    if (!isSupabaseConfigured()) {
      setConfigError(true)
    }
  }, [])

  useEffect(() => {
    if (!mounted || configError) return

    if (!authLoading && !user) {
      router.push("/")
      return
    }

    if (user && projectId) {
      fetchProject()
    }
  }, [user, authLoading, projectId, router, mounted, configError])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const projectData = await projectService.getProject(projectId)
      setProject(projectData)
    } catch (err: any) {
      console.error("Error fetching project:", err)
      setError(err.message || "Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-xl font-semibold">Configuration Error</div>
          <p className="text-muted-foreground">
            Supabase environment variables are not configured. Please check your deployment settings.
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-xl mb-4">Error Loading Project</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-xl mb-4">Project Not Found</div>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <ProjectView projectId={projectId} user={user} />
}
