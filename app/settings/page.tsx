"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { AuthGuard } from "@/components/auth-guard"
import { updateProfile, changePassword, deleteAccount, getCurrentUser } from "@/lib/database"
import type { Profile } from "@/lib/types"
import { HeaderNav } from "@/components/header-nav"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/components/toast"

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setProfile(user)
        setUsername(user.username || "")
        setEmail(user.email || "")
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
      addToast({
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const updatedProfile = await updateProfile(profile.id, {
        username: username.trim(),
        email: email.trim(),
      })
      if (updatedProfile) {
        addToast({
          title: "Success!",
          description: "Profile updated successfully.",
          variant: "success",
        })
      } else {
        addToast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      addToast({
        title: "Error",
        description: "An unexpected error occurred while updating your profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      addToast({
        title: "Error",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      addToast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)
    try {
      const success = await changePassword(newPassword)
      if (success) {
        setNewPassword("")
        setConfirmPassword("")
        addToast({
          title: "Success!",
          description: "Password changed successfully.",
          variant: "success",
        })
      } else {
        addToast({
          title: "Error",
          description: "Failed to change password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to change password:", error)
      addToast({
        title: "Error",
        description: "An unexpected error occurred while changing your password.",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const success = await deleteAccount()
      if (success) {
        addToast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
          variant: "success",
        })
        router.push("/auth/signin")
      } else {
        addToast({
          title: "Error",
          description: "Failed to delete account. Please try again or contact support.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
      addToast({
        title: "Error",
        description: "An unexpected error occurred while deleting your account.",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <HeaderNav
          title="Settings"
          subtitle="Manage your account preferences"
          showBackButton={true}
          backUrl="/dashboard"
        />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Profile Information</CardTitle>
                <CardDescription>Update your personal information and account details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Change Password</CardTitle>
                <CardDescription>Update your account password for better security</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Changing Password..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive">Warning:</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deleting your account will permanently remove all your data, including projects, tasks, and
                        collaborations. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    Delete Account Permanently
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Account"
          description='This action cannot be undone. This will permanently delete your account and remove all your data from our servers.'
          confirmText="Delete Account"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteAccount}
        />
      </div>
    </AuthGuard>
  )
}
