"use client"

import { useState, useEffect } from "react"
import { projectService } from "@/lib/services/project.service"
import { useToast } from "@/hooks/use-toast"
import type { MemberWithProfile } from "@/lib/types"

export function useMembers(projectId?: string) {
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMembers = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await projectService.getProjectMembers(projectId)
      setMembers(data)
    } catch (err: any) {
      console.error("Error fetching members:", err)
      setError(err.message)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const addMember = async (profileId: string, role: string) => {
    if (!projectId) return

    try {
      await projectService.addMember(projectId, profileId, role)
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const removeMember = async (profileId: string) => {
    if (!projectId) return

    try {
      await projectService.removeMember(projectId, profileId)
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateMemberRole = async (profileId: string, role: string) => {
    if (!projectId) return

    try {
      await projectService.updateMemberRole(projectId, profileId, role)
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    updateMemberRole,
    refetch: fetchMembers,
  }
}
