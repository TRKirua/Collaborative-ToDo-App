"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { ProjectWithStats } from "@/lib/types"

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectWithStats | null
  onSubmit: (title: string, description?: string) => Promise<void>
}

export function EditProjectDialog({ open, onOpenChange, project, onSubmit }: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description || "")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!project) return

    setLoading(true)

    try {
      await onSubmit(title, description || undefined)
      toast({
        title: "Success",
        description: "Project updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-modern-card border-modern text-white shadow-modern">
        <DialogHeader>
          <DialogTitle className="gradient-text">Edit List</DialogTitle>
          <DialogDescription className="text-modern-muted">Update your todo list information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list title"
              required
              className="bg-modern-card border-modern text-white placeholder:text-modern-muted focus:border-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter list description (optional)"
              className="bg-modern-card border-modern text-white placeholder:text-modern-muted min-h-[100px] focus:border-purple-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-modern-muted hover:bg-modern-card hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-modern-primary hover:opacity-90 text-white shadow-modern-sm"
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
