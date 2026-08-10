import { Label } from "@/components/ui/label"

/**
 * Shared two-column (label / control) row used across the product editor tabs,
 * matching the StoreHippo form layout in the screenshots.
 */
export function EditorField({ label, htmlFor, required, hint, children }) {
  return (
    <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[180px_1fr] md:gap-6">
      <Label htmlFor={htmlFor} className="pt-2 text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="flex flex-col gap-1.5">
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
