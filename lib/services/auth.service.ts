import { supabase, isSupabaseConfigured } from "@/lib/supabase"

class AuthService {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async signUp(email: string, password: string, username: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) throw error
    return data
  }

  async signOut() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }

  async getCurrentUser() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async getSession() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured")
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    if (!isSupabaseConfigured()) {
      // Return a mock subscription that does nothing
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    }

    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
export { AuthService }
