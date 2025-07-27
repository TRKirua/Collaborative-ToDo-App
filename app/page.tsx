"use client"

import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "@/components/auth/auth-form"
import { Dashboard } from "@/components/dashboard/dashboard"
import { useEffect, useState } from "react"
import { isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default function Home() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isSupabaseConfigured()) {
      setConfigError(true)
    }
  }, [])

  if (!mounted || loading) {
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
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
            <p className="font-medium mb-2">Required environment variables:</p>
            <ul className="text-left space-y-1">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard user={user} />
}
