"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Settings } from "@/components/settings/settings"
import { isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isSupabaseConfigured()) {
      setConfigError(true)
    }
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user && !configError) {
      router.push("/")
    }
  }, [user, loading, router, mounted, configError])

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
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <Settings user={user} />
}
