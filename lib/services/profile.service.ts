import { supabase } from "../supabase"
import type { Profile } from "../types"

export class ProfileService {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) throw error
    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    // Update the profiles table
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

    if (error) throw error

    // If username is being updated, also update the auth metadata
    if (updates.username) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: updates.username },
      })

      if (authError) {
        console.warn("Failed to update auth metadata:", authError)
        // Don't throw here as the profile was updated successfully
      }
    }

    return data
  }

  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", userId)

    if (error) throw error
  }

  async searchProfiles(query: string): Promise<Profile[]> {
    console.log("Searching profiles with query:", query)

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url, created_at")
      .or(`email.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("Search profiles error:", error)
      throw error
    }

    console.log("Search results:", data)
    return data || []
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("email", email.toLowerCase()).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      throw error
    }

    return data
  }
}

// Create and export the service instance
export const profileService = new ProfileService()
