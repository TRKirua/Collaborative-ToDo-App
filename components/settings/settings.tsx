"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, UserIcon, LockIcon, Trash2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { authService } from "@/lib/services/auth.service"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface SettingsProps {
  user: User
}

export function Settings({ user }: SettingsProps) {
  const { signOut } = useAuth()
  const { profile, loading, updateProfile, deleteProfile } = useProfile(user.id)
  const { toast } = useToast()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "")
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await updateProfile({ username })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      })
      setChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      setChangingPassword(false)
      return
    }

    try {
      await authService.updatePassword(newPassword)
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({
        title: "Password Change Failed",
        description: err.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteProfile()
      await signOut()
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4 max-w-4xl mx-auto px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="focus-ring">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="focus-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                </div>
                <Button type="submit" disabled={saving} className="btn-scale focus-ring">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password for better security</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10 focus-ring"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="focus-ring"
                  />
                </div>
                <Button type="submit" disabled={changingPassword} className="btn-scale focus-ring">
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2Icon className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <Trash2Icon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Deleting your account will permanently remove all your data, including
                    projects, tasks, and collaborations. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="btn-scale focus-ring"
                >
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Delete Account Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={handleDeleteAccount} />
    </div>
  )
}
