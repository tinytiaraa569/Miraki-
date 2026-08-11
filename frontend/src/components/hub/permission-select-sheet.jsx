"use client"

import { useMemo, useState } from "react"
import { ChevronDown, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ACTION_LABELS, PERMISSION_HUB, permissionKey } from "@/lib/permissions-hub"
import { api } from "@/lib/api"


export function PermissionSelectSheet({ open, onOpenChange, existingKeys, onCreated }) {
  const [selected, setSelected] = useState(() => new Set())
  const [openCategories, setOpenCategories] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  function reset() {
    setSelected(new Set())
  }

  function toggleCategoryOpen(categoryId) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId)
      return next
    })
  }

  function toggleAction(key) {
    if (existingKeys.has(key)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function moduleSelectableKeys(mod) {
    return mod.actions.map((a) => permissionKey(mod.module, a)).filter((k) => !existingKeys.has(k))
  }

  function moduleState(mod) {
    const keys = moduleSelectableKeys(mod)
    if (keys.length === 0) return "all-existing"
    const selectedCount = keys.filter((k) => selected.has(k)).length
    if (selectedCount === 0) return "none"
    if (selectedCount === keys.length) return "all"
    return "some"
  }

  function toggleModule(mod) {
    const keys = moduleSelectableKeys(mod)
    const state = moduleState(mod)
    setSelected((prev) => {
      const next = new Set(prev)
      if (state === "all") {
        keys.forEach((k) => next.delete(k))
      } else {
        keys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  function categorySelectableKeys(cat) {
    return cat.modules.flatMap(moduleSelectableKeys)
  }

  function categoryState(cat) {
    const keys = categorySelectableKeys(cat)
    if (keys.length === 0) return "all-existing"
    const selectedCount = keys.filter((k) => selected.has(k)).length
    if (selectedCount === 0) return "none"
    if (selectedCount === keys.length) return "all"
    return "some"
  }

  function toggleCategory(cat) {
    const keys = categorySelectableKeys(cat)
    const state = categoryState(cat)
    setSelected((prev) => {
      const next = new Set(prev)
      if (state === "all") {
        keys.forEach((k) => next.delete(k))
      } else {
        keys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  const selectedCount = selected.size

  const payloads = useMemo(() => {
    const list = []
    for (const cat of PERMISSION_HUB) {
      for (const mod of cat.modules) {
        for (const action of mod.actions) {
          const key = permissionKey(mod.module, action)
          if (!selected.has(key)) continue
          list.push({
            key,
            module: mod.module,
            category: cat.category,
            action,
            label: `${ACTION_LABELS[action] ?? action} ${mod.label}`,
            description: "",
            isActive: true,
          })
        }
      }
    }
    return list
  }, [selected])

  async function handleCreate() {
    if (payloads.length === 0) return
    setSaving(true)
    try {
      await Promise.all(payloads.map((p) => api.post("/seller/permissions", p)))
      toast.success(`Created ${payloads.length} permission${payloads.length === 1 ? "" : "s"}`)
      reset()
      onOpenChange(false)
      onCreated?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add permissions</SheetTitle>
          <SheetDescription>
            Tick individual actions, or use "select all" on a module or category. Permissions that
            already exist are shown checked and can't be added again.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex flex-col divide-y divide-border">
            {PERMISSION_HUB.map((cat) => {
              const catState = categoryState(cat)
              const isOpen = openCategories.has(cat.category)
              return (
                <div key={cat.category} className="py-1">
                  <div className="flex items-center gap-2 py-1.5">
                    <Checkbox
                      checked={catState === "all" || catState === "all-existing" ? true : catState === "some" ? "indeterminate" : false}
                      disabled={catState === "all-existing"}
                      onCheckedChange={() => toggleCategory(cat)}
                      aria-label={`Select all permissions in ${cat.label}`}
                    />
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-between py-1 text-sm font-medium text-foreground"
                      onClick={() => toggleCategoryOpen(cat.category)}
                      aria-expanded={isOpen}
                    >
                      {cat.label}
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="flex flex-col gap-3 py-2 pl-7">
                      {cat.modules.map((mod) => {
                        const modState = moduleState(mod)
                        return (
                          <div key={mod.module} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={modState === "all" || modState === "all-existing" ? true : modState === "some" ? "indeterminate" : false}
                                disabled={modState === "all-existing"}
                                onCheckedChange={() => toggleModule(mod)}
                                aria-label={`Select all permissions for ${mod.label}`}
                              />
                              <span className="text-sm font-medium text-foreground">{mod.label}</span>
                            </div>
                            <div className="ml-6 flex flex-wrap gap-3">
                              {mod.actions.map((action) => {
                                const key = permissionKey(mod.module, action)
                                const exists = existingKeys.has(key)
                                return (
                                  <label
                                    key={key}
                                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                                      exists
                                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                                        : "cursor-pointer border-border hover:bg-muted/50"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={exists || selected.has(key)}
                                      disabled={exists}
                                      onCheckedChange={() => toggleAction(key)}
                                    />
                                    {ACTION_LABELS[action] ?? action}
                                    {/* {exists && (
                                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                                        Added
                                      </Badge>
                                    )} */}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <KeyRound className="size-3.5" aria-hidden="true" />
            {selectedCount} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || selectedCount === 0}>
              {saving ? "Creating…" : `Create ${selectedCount || ""}`.trim()}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}