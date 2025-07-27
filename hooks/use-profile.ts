"use client"

import { useState, useEffect } from "react"
import { profileService } from "@/lib/services/profile.service"
import type { Profile } from "@/lib/types"

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await profileService.getProfile(userId)
        setProfile(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return

    try {
      const updatedProfile = await profileService.updateProfile(userId, updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteProfile = async () => {
    if (!userId) return

    try {
      await profileService.deleteProfile(userId)
      setProfile(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    deleteProfile,
  }
}
