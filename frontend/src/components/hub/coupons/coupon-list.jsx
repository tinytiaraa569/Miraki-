"use client"

import { BadgePercent, MoreVertical, Pencil, Power, PowerOff, RotateCcw, Trash2, Copy, TicketPercent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function formatAmount(coupon) {
  return coupon.discountType === "percentage" ? `${coupon.amount}% off` : `$${coupon.amount} off`
}

function formatUsage(coupon) {
  if (coupon.maxUsage == null) return `${coupon.currentUsage ?? 0} used`
  return `${coupon.currentUsage ?? 0} / ${coupon.maxUsage} used`
}

export function CouponList({ rows, isLoading, showDeleted, selectedId, handlers }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  console.log(rows)

  if (rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <BadgePercent className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {showDeleted ? "No deleted coupons." : "No coupons yet."}
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((coupon) => {
        const active = coupon._id === selectedId
        return (
          <li key={coupon._id}>
            <div
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2.5",
                showDeleted ? "opacity-70" : "cursor-pointer hover:bg-accent",
                active && "bg-accent",
              )}
              onClick={() => handlers.onSelect(coupon)}
              role="button"
              tabIndex={0}
            >
                 <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          <TicketPercent className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">

                  <span className="truncate font-mono text-sm font-semibold text-foreground">{coupon.code}</span>
                  {!coupon.enabled && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Disabled
                    </span>
                  )}
                  {coupon.isPrivate && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {formatAmount(coupon)} · {formatUsage(coupon)}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Actions for ${coupon.code}`}
                  >
                    <MoreVertical className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {showDeleted ? (
                    <>
                      <DropdownMenuItem onClick={() => handlers.onRestore(coupon)}>
                        <RotateCcw className="size-4" aria-hidden="true" /> Restore
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handlers.onDestroy(coupon)}>
                        <Trash2 className="size-4" aria-hidden="true" /> Delete permanently
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => handlers.onSelect(coupon)}>
                        <Pencil className="size-4" aria-hidden="true" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlers.onToggle(coupon)}>
                        {coupon.enabled ? (
                          <><PowerOff className="size-4" aria-hidden="true" /> Disable</>
                        ) : (
                          <><Power className="size-4" aria-hidden="true" /> Enable</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlers.onDuplicate(coupon)}>
                        <Copy className="size-4" aria-hidden="true" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(coupon)}>
                        <Trash2 className="size-4" aria-hidden="true" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        )
      })}
    </ul>
  )
}