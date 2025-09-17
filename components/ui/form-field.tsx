import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("grid grid-cols-4 items-start gap-4", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(
          "text-right pt-2",
          error && "text-destructive",
          required && "after:content-['*'] after:ml-0.5 after:text-destructive",
        )}
      >
        {label}
      </Label>
      <div className="col-span-3 space-y-1">
        {children}
        {error && (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
