export interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  title: string
  description?: string
  owner_id: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  profile_id: string
  role: "owner" | "admin" | "editor" | "viewer"
  joined_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  completed: boolean
  created_at: string
}

export interface ProjectWithStats extends Project {
  member_count: number
  completed_tasks: number
  total_tasks: number
  user_role: string
  is_owner: boolean
}

export interface MemberWithProfile extends ProjectMember {
  username: string
  email: string
  avatar_url?: string
}

export type UserRole = "owner" | "admin" | "editor" | "viewer"

// Permissions helper
export const PERMISSIONS = {
  VIEW_PROJECT: ["owner", "admin", "editor", "viewer"],
  EDIT_PROJECT: ["owner"],
  DELETE_PROJECT: ["owner"],
  VIEW_TASKS: ["owner", "admin", "editor", "viewer"],
  CREATE_TASK: ["owner", "admin", "editor"],
  EDIT_TASK: ["owner", "admin", "editor"],
  DELETE_TASK: ["owner", "admin", "editor"],
  VIEW_MEMBERS: ["owner", "admin", "editor", "viewer"],
  INVITE_MEMBER: ["owner", "admin"],
  REMOVE_MEMBER: ["owner", "admin"],
  MANAGE_ADMINS: ["owner"],
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole)
}
