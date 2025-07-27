"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, User } from "lucide-react"
import type { Profile } from "@/lib/types"

interface UserMenuProps {
  profile: Profile | null
  onSettingsClick: () => void
  onSignOut: () => Promise<void>
}

export function UserMenu({ profile, onSettingsClick, onSignOut }: UserMenuProps) {
  const handleSignOut = async () => {
    try {
      await onSignOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full focus-ring">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.username || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile?.username || "User"}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
