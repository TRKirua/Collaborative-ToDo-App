"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Search, AlertCircle } from "lucide-react"
import { profileService } from "@/lib/services/profile.service"
import { projectService } from "@/lib/services/project.service"
import type { Profile } from "@/lib/types"

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberInvited: () => void
  projectId: string
  currentUserId: string
  currentUserRole: "owner" | "admin"
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onMemberInvited,
  projectId,
  currentUserId,
  currentUserRole,
}: InviteMemberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [role, setRole] = useState("viewer")
  const [email, setEmail] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  // Available roles based on current user role
  const availableRoles =
    currentUserRole === "owner"
      ? [
          { value: "viewer", label: "Viewer", description: "Can view tasks" },
          { value: "editor", label: "Editor", description: "Can add/edit tasks" },
          { value: "admin", label: "Admin", description: "Full access except ownership" },
        ]
      : [
          { value: "viewer", label: "Viewer", description: "Can view tasks" },
          { value: "editor", label: "Editor", description: "Can add/edit tasks" },
        ]

  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setSearching(true)
    try {
      const results = await profileService.searchProfiles(query)
      setSearchResults(results)
      setShowResults(true)
    } catch (error: any) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "Failed to search for users",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const selectUser = (user: Profile) => {
    setSelectedUser(user)
    setEmail(user.email)
    setShowResults(false)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setSelectedUser(null)

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      let userToInvite: Profile | null = selectedUser

      // If no user selected from search, try to find by email
      if (!userToInvite) {
        const searchResults = await profileService.searchProfiles(email.trim())
        userToInvite = searchResults.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) || null
      }

      if (!userToInvite) {
        toast({
          title: "User Not Found",
          description: `No user found with email "${email}". They need to create an account first.`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Check if user is trying to invite themselves
      if (userToInvite.id === currentUserId) {
        toast({
          title: "Error",
          description: "You cannot invite yourself",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Check if user is already a member
      const members = await projectService.getProjectMembers(projectId)
      const existingMember = members.find((member) => member.profile_id === userToInvite!.id)

      if (existingMember) {
        toast({
          title: "Already a Member",
          description: `${userToInvite.username} is already a member of this project`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Add the member
      await projectService.addMember(projectId, userToInvite.id, role)

      toast({
        title: "Success",
        description: `${userToInvite.username} has been invited successfully`,
      })

      onMemberInvited()

      // Reset form
      setEmail("")
      setRole("viewer")
      setSelectedUser(null)
      setSearchResults([])
      setShowResults(false)
    } catch (error: any) {
      console.error("Error inviting member:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to invite member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>Invite someone to collaborate on this project.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email or Username</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address or username"
                required
                value={email}
                onChange={handleEmailChange}
                className="focus-ring pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {searching ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0 flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && email.length >= 3 && !searching && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-md p-2 text-xs text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                No users found. They need to create an account first.
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserPlus className="w-3 h-3" />
              <span>User must have an account already.</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="focus-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    <div>
                      <div className="font-medium">{roleOption.label}</div>
                      <div className="text-xs text-muted-foreground">{roleOption.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {currentUserRole === "admin"
                ? "As an admin, you can only assign viewer and editor roles."
                : "As the owner, you can assign any role."}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-scale focus-ring">
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
