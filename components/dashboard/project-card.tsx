"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Calendar, MoreVertical, Edit, Trash2, Crown } from "lucide-react"
import { ProgressBar } from "../ui/progress-bar"
import type { ProjectWithStats } from "@/lib/types"

interface ProjectCardProps {
  project: ProjectWithStats
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const progressPercentage = project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks) * 100 : 0

  return (
    <Card
      className="card-hover cursor-pointer transition-all duration-200 border-2 hover:border-primary/20"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg truncate">{project.title}</CardTitle>
              {project.is_owner && <Crown className="w-4 h-4 text-warning flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description || "No description"}</p>
            <div className="flex items-center gap-2">
              <Badge variant={project.is_owner ? "default" : "secondary"} className="text-xs">
                {project.user_role}
              </Badge>
            </div>
          </div>
          {project.is_owner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 ml-2 focus-ring"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {project.completed_tasks}/{project.total_tasks} tasks
            </span>
          </div>
          <ProgressBar value={project.completed_tasks} max={project.total_tasks} />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{project.member_count} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
