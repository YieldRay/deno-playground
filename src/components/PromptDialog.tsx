import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Props for the PromptDialog component
 */
interface PromptDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Title displayed in the dialog header */
  title: string
  /** Optional description text */
  description?: string
  /** Default value for the input field */
  defaultValue?: string
  /** Placeholder text for the input */
  placeholder?: string
  /** Callback when user confirms with the entered value */
  onConfirm: (value: string) => void
  /** Callback when user cancels the dialog */
  onCancel: () => void
}

/**
 * A customizable prompt dialog component that replaces browser's native prompt()
 * Provides a modern UI with proper keyboard navigation and accessibility
 */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValue = "",
  placeholder,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  // Local state to manage input value
  const [value, setValue] = useState(defaultValue)

  /**
   * Handles confirmation action
   * Calls onConfirm with current value and resets input
   */
  const handleConfirm = () => {
    onConfirm(value)
    setValue(defaultValue)
  }

  /**
   * Handles cancel action
   * Calls onCancel and resets input to default value
   */
  const handleCancel = () => {
    onCancel()
    setValue(defaultValue)
  }

  /**
   * Handles dialog open state changes
   * Automatically triggers cancel when dialog is closed
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm()
              } else if (e.key === "Escape") {
                handleCancel()
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}