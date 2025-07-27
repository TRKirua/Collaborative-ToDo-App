"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/services/auth.service"
import { isSupabaseConfigured } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Supabase is not configured, don't try to authenticate
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const session = await authService.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error getting session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }
    return authService.signIn(email, password)
  }

  const signUp = async (email: string, password: string, username?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }
    return authService.signUp(email, password, username)
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }
    return authService.signOut()
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
