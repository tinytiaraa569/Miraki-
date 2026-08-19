"use client"

import { ArchiveRestore, BadgePercent, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Compact "$500" / "10%" amount label for a row (BOGO has no amount).
function amountLabel(node) {
  if (node.ruleType === "bogo_auto_add") return "Free gift"
  const v = node.amountValue ?? 0
  return node.amountType === "percentage" ? `${v}%` : `$${v}`
}

// Short rule-type badge label.
function ruleLabel(node) {
  if (node.ruleType === "bogo_auto_add") return "BOGO"
  return node.ruleType === "order" ? "Order" : "Product"
}


function DiscountRow({ node, showDeleted, selected, handlers }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
        selected ? "bg-muted" : "hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        onClick={() => handlers.onSelect(node)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          <BadgePercent className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className={cn("truncate text-sm text-foreground", selected ? "font-semibold" : "font-medium")}>
            {node.name}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {amountLabel(node)}
            </span>
            <span className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-medium capitalize">
              {ruleLabel(node)}
            </span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {!showDeleted && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              node.enabled ? "bg-primary/10 text-primary" : "bg-muted-foreground/15 text-muted-foreground",
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", node.enabled ? "bg-primary" : "bg-muted-foreground")}
              aria-hidden="true"
            />
            {node.enabled ? "Enabled" : "Disabled"}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${node.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showDeleted ? (
              <>
                <DropdownMenuItem onClick={() => handlers.onRestore(node)}>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(node)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handlers.onSelect(node)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(node)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


export function DiscountList({ rows, isLoading, showDeleted, selectedId, handlers }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <BadgePercent className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No Records Found</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {showDeleted ? "There are no deleted discounts." : "Add a discount to get started."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((node) => (
        <DiscountRow
          key={node._id}
          node={node}
          showDeleted={showDeleted}
          selected={selectedId === node._id}
          handlers={handlers}
        />
      ))}
    </div>
  )
}
