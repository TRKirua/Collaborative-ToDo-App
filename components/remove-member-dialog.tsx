"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MemberWithProfile } from "@/lib/types"

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberWithProfile | null
  onConfirm: () => void
}

export function RemoveMemberDialog({ open, onOpenChange, member, onConfirm }: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{member?.username}</strong> from this project? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive" className="btn-scale focus-ring">
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
