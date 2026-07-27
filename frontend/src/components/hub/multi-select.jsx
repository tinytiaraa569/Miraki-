"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Searchable multi-select with removable chips.
 * `options`: [{ value, label }] — `value` strings are stored in `selected`.
 */
export function MultiSelect({ options, selected = [], onChange, placeholder = "Select options", emptyText = "No results" }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, query])

  const labelByValue = useMemo(() => Object.fromEntries(options.map((o) => [o.value, o.label])), [options])

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="mb-2 h-8"
            autoFocus
          />
          <div className="max-h-52 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filtered.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => toggle(option.value)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input",
                            isSelected && "border-primary bg-primary text-primary-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="size-3" />}
                        </span>
                        <span className="truncate">{option.label}</span>
                        <span className="ml-auto text-xs uppercase text-muted-foreground">{option.value}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 rounded-md pr-1 font-normal">
              {labelByValue[value] ?? value}
              <button
                type="button"
                onClick={() => toggle(value)}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${labelByValue[value] ?? value}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
