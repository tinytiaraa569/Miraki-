"use client"

import { useEffect, useMemo, useState } from "react"
import { KeyRound, Search } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ACTION_LABELS, PERMISSION_HUB, permissionKey } from "@/lib/permissions-hub"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

const ACTION_STYLES = {
  read: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  write: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  update: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delete: "bg-destructive/10 text-destructive",
  manage: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  export: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
}

export function PermissionSelectSheet({ open, onOpenChange, onCreated }) {
  const [selected, setSelected] = useState(() => new Set())
  const [openCategories, setOpenCategories] = useState([])
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)

  const debouncedQuery = useDebouncedValue(query, 200)

  // The sheet resolves its own "already exists" set from a lightweight keys
  // endpoint, so it never depends on the (now paginated) page having every row.
  const { data: keysData, mutate: mutateKeys } = useSWR(
    open ? "/seller/permissions/keys" : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  const existingKeys = useMemo(() => new Set(keysData?.keys ?? []), [keysData])

  function reset() {
    setSelected(new Set())
    setQuery("")
  }

  // Filter the catalog by label / module / action as the user types.
  const catalog = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase()
    if (!term) return PERMISSION_HUB
    return PERMISSION_HUB.map((cat) => {
      const catMatch =
        cat.label.toLowerCase().includes(term) || cat.category.includes(term)
      const modules = cat.modules.filter(
        (m) =>
          catMatch ||
          m.label.toLowerCase().includes(term) ||
          m.module.includes(term) ||
          m.actions.some((a) => a.includes(term)),
      )
      return { ...cat, modules }
    }).filter((cat) => cat.modules.length > 0)
  }, [debouncedQuery])

  // Auto-expand matching categories while searching.
  useEffect(() => {
    if (debouncedQuery.trim()) setOpenCategories(catalog.map((c) => c.category))
  }, [debouncedQuery, catalog])

  function toggleAction(key) {
    if (existingKeys.has(key)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function moduleSelectableKeys(mod) {
    return mod.actions
      .map((a) => permissionKey(mod.module, a))
      .filter((k) => !existingKeys.has(k))
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
      if (state === "all") keys.forEach((k) => next.delete(k))
      else keys.forEach((k) => next.add(k))
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
      if (state === "all") keys.forEach((k) => next.delete(k))
      else keys.forEach((k) => next.add(k))
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
      toast.success(
        `Created ${payloads.length} permission${payloads.length === 1 ? "" : "s"}`,
      )
      reset()
      onOpenChange(false)
      await mutateKeys()
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
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
      >
        <SheetHeader className="gap-2 border-b border-border px-5 py-4">
          <SheetTitle>Add permissions</SheetTitle>
          <SheetDescription>
            Tick individual actions, or use the module / category checkbox to
            select a whole group. Entries that already exist are checked and
            locked.
          </SheetDescription>
          <div className="relative mt-1">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules or actions…"
              className="h-9 pl-8"
              aria-label="Search permission catalog"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-3">
            {catalog.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <KeyRound className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Nothing matches "{debouncedQuery}".
                </p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={openCategories}
                onValueChange={setOpenCategories}
                className="flex flex-col gap-1"
              >
                {catalog.map((cat) => {
                  const catState = categoryState(cat)
                  return (
                    <AccordionItem
                      key={cat.category}
                      value={cat.category}
                      className="rounded-lg border border-border px-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={
                            catState === "all" || catState === "all-existing"
                              ? true
                              : catState === "some"
                                ? "indeterminate"
                                : false
                          }
                          disabled={catState === "all-existing"}
                          onCheckedChange={() => toggleCategory(cat)}
                          aria-label={`Select all permissions in ${cat.label}`}
                        />
                        <AccordionTrigger className="flex-1 hover:no-underline">
                          <span className="text-sm font-medium text-foreground">
                            {cat.label}
                          </span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pb-3">
                        <div className="flex flex-col gap-3 pl-7">
                          {cat.modules.map((mod) => {
                            const modState = moduleState(mod)
                            return (
                              <div key={mod.module} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={
                                      modState === "all" || modState === "all-existing"
                                        ? true
                                        : modState === "some"
                                          ? "indeterminate"
                                          : false
                                    }
                                    disabled={modState === "all-existing"}
                                    onCheckedChange={() => toggleModule(mod)}
                                    aria-label={`Select all permissions for ${mod.label}`}
                                  />
                                  <span className="text-sm font-medium text-foreground">
                                    {mod.label}
                                  </span>
                                </div>
                                <div className="ml-6 flex flex-wrap gap-1.5">
                                  {mod.actions.map((action) => {
                                    const key = permissionKey(mod.module, action)
                                    const exists = existingKeys.has(key)
                                    const isSelected = selected.has(key)
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        disabled={exists}
                                        onClick={() => toggleAction(key)}
                                        className={cn(
                                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors",
                                          exists
                                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                                            : isSelected
                                              ? cn(
                                                  "border-transparent",
                                                  ACTION_STYLES[action] ??
                                                    "bg-primary/15 text-primary",
                                                )
                                              : "border-border hover:bg-muted/60",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "size-1.5 rounded-full",
                                            exists
                                              ? "bg-muted-foreground/40"
                                              : isSelected
                                                ? "bg-current"
                                                : "bg-border",
                                          )}
                                        />
                                        {ACTION_LABELS[action] ?? action}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {selectedCount}
            </Badge>
            selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
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
