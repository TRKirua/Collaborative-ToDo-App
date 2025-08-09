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

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  completed: boolean
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  profile_id: string
  role: "owner" | "admin" | "editor" | "viewer"
  joined_at: string
}

export interface ProjectWithStats extends Project {
  total_tasks: number
  completed_tasks: number
  member_count: number
}
