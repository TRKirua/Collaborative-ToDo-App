"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAccountDialog({ open, onOpenChange, onConfirm }: DeleteAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          <DialogDescription>
            This action will permanently delete your account and all associated data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/20 border border-destructive/50 rounded-md p-4 mb-4">
          <h4 className="font-medium text-destructive mb-2">This will delete:</h4>
          <ul className="text-sm text-destructive space-y-1">
            <li>• Your user profile</li>
            <li>• All your projects and tasks</li>
            <li>• Your membership in other projects</li>
            <li>• All associated data</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive" className="btn-scale focus-ring">
            Delete Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
