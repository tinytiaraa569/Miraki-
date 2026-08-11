"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Store,
  UserCog,
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MultiSelect } from "@/components/hub/multi-select"
import { api, fetcher } from "@/lib/api"

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  twoFactorRequired: true,
  roleId: "",
  substoreIds: [],
  revokePermissionIds: [],
  status: "active",
}

const MODULE_ICONS = {
  products: Package,
  orders: ShoppingCart,
  stores: Store,
  staff: UserCog,
}

function moduleIcon(module) {
  return MODULE_ICONS[module] ?? KeyRound
}

function docToForm(doc) {
  if (!doc) return { ...EMPTY_FORM }
  return {
    name: doc.name ?? "",
    email: doc.email ?? "",
    password: "",
    twoFactorRequired: Boolean(doc.twoFactorRequired),
    roleId: doc.roleId?._id ?? doc.roleId ?? "",
    substoreIds: (doc.substoreIds ?? []).map((s) => s._id ?? s),
    revokePermissionIds: (doc.overridePermissions?.revoke ?? []).map((p) => p._id ?? p),
    status: doc.status ?? "active",
  }
}

function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}


function OverrideCell({ revoked, onClick, label }) {
  const base =
    "flex size-6 items-center justify-center rounded-md border text-[10px] font-semibold transition"
  const styles = revoked
    ? "border-red-500/40 bg-red-500/10 text-red-500 line-through"
    : "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${styles}`}
      aria-label={label}
      aria-pressed={!revoked}
      title={revoked ? "Revoked from role — click to restore" : "Granted by role — click to revoke"}
    >
      {revoked ? "" : "✓"}
    </button>
  )
}

export function StoreAdminFormSheet({ open, onOpenChange, adminId, onSaved }) {
  const isEdit = Boolean(adminId)
  const [tab, setTab] = useState("general")
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { data: rolesData } = useSWR(open ? "/seller/roles?limit=10&status=active" : null, fetcher)
  const { data: substoresData } = useSWR(open ? "/seller/substores?limit=20" : null, fetcher)


  const { data: roleDetailData, isLoading: roleDetailLoading } = useSWR(
    open && form.roleId ? `/seller/roles/${form.roleId}` : null,
    fetcher,
  )

  const roles = rolesData?.rows ?? []
  const substoresList = substoresData?.rows ?? []

  const selectedRole = roles.find((r) => r._id === form.roleId)
  const dataAccess = selectedRole?.dataAccess
  const isSingleSubstore = dataAccess === "own_substore"
  const isAllSubstores = dataAccess === "all_substores"
  const needsSubstores = !isAllSubstores


  const rolePermissions = useMemo(() => {
    const perms = roleDetailData?.role?.permissions ?? []
    return perms
      .filter((p) => p && typeof p === "object" && p.module && p.action)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [roleDetailData])

  const rolePermissionIds = useMemo(
    () => new Set(rolePermissions.map((p) => p._id)),
    [rolePermissions],
  )

  const roleSubstoreIds = useMemo(() => {
    const ids = roleDetailData?.role?.substoreIds ?? []
    return new Set(ids.map((s) => (typeof s === "string" ? s : s._id)))
  }, [roleDetailData])

  const allowedSubstoresList = useMemo(() => {
    if (isAllSubstores || roleSubstoreIds.size === 0) return substoresList
    return substoresList.filter((s) => roleSubstoreIds.has(String(s._id)))
  }, [substoresList, roleSubstoreIds, isAllSubstores])

  const substoreOptions = allowedSubstoresList.map((s) => ({ value: s.name, label: s.name }))
  const selectedSubstoreNames = allowedSubstoresList
    .filter((s) => form.substoreIds?.includes(String(s._id)))
    .map((s) => s.name)

  const { modules, actions, cellMap } = useMemo(() => {
    const moduleSet = new Set()
    const actionSet = new Set()
    const map = new Map()
    for (const p of rolePermissions) {
      moduleSet.add(p.module)
      actionSet.add(p.action)
      map.set(`${p.module}:${p.action}`, p)
    }
    return { modules: Array.from(moduleSet).sort(), actions: Array.from(actionSet).sort(), cellMap: map }
  }, [rolePermissions])

  const permissionsByModule = useMemo(() => {
    const map = new Map()
    for (const m of modules) {
      map.set(m, actions.map((a) => cellMap.get(`${m}:${a}`)).filter(Boolean))
    }
    return map
  }, [modules, actions, cellMap])

  const revokeSet = useMemo(() => new Set(form.revokePermissionIds), [form.revokePermissionIds])

  function isRevoked(id) {
    return revokeSet.has(id)
  }

  function toggleCell(permission) {
    if (!permission) return
    const id = permission._id
    setForm((f) => {
      const revoke = new Set(f.revokePermissionIds)
      revoke.has(id) ? revoke.delete(id) : revoke.add(id)
      return { ...f, revokePermissionIds: Array.from(revoke) }
    })
  }

  function resetRowToRoleDefault(module) {
    const items = permissionsByModule.get(module) ?? []
    const ids = new Set(items.map((p) => p._id))
    setForm((f) => ({
      ...f,
      revokePermissionIds: f.revokePermissionIds.filter((id) => !ids.has(id)),
    }))
  }

  function resetAllToRoleDefault() {
    setForm((f) => ({ ...f, revokePermissionIds: [] }))
  }

  useEffect(() => {
    if (!open) return
    setTab("general")
    if (!adminId) {
      setForm({ ...EMPTY_FORM })
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/seller/store-admins/${adminId}`)
      .then(({ admin }) => !cancelled && setForm(docToForm(admin)))
      .catch((err) => toast.error(err.message || "Failed to load store admin"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, adminId])

  useEffect(() => {
    if (isSingleSubstore && form.substoreIds.length > 1) {
      setForm((f) => ({ ...f, substoreIds: f.substoreIds.slice(0, 1) }))
    }
  }, [isSingleSubstore])


  useEffect(() => {
    if (isAllSubstores || roleSubstoreIds.size === 0) return
    setForm((f) => {
      const filtered = f.substoreIds.filter((id) => roleSubstoreIds.has(id))
      if (filtered.length === f.substoreIds.length) return f
      return { ...f, substoreIds: filtered }
    })
  }, [roleSubstoreIds, isAllSubstores])

  const [lastRoleId, setLastRoleId] = useState(form.roleId)
  useEffect(() => {
    if (form.roleId !== lastRoleId) {
      setLastRoleId(form.roleId)
      if (lastRoleId) {
        setForm((f) => ({ ...f, revokePermissionIds: [] }))
      }
    }
  }, [form.roleId, lastRoleId])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const overrideCount = form.revokePermissionIds.length
  const effectiveTotal = rolePermissionIds.size - overrideCount

  async function handleSave() {
    if (!form.name.trim()) {
      setTab("general")
      return toast.error("Name is required")
    }
    if (!form.email.trim()) {
      setTab("general")
      return toast.error("Email is required")
    }
    if (!isEdit && !form.password) {
      setTab("general")
      return toast.error("Password is required")
    }
    if (!form.roleId) {
      setTab("general")
      return toast.error("Role is required")
    }
    // if (isSingleSubstore && form.substoreIds.length !== 1) {
    //   setTab("general")
    //   return toast.error("Select a substore for this role")
    // }
    // if (!isSingleSubstore && needsSubstores && form.substoreIds.length === 0) {
    //   setTab("general")
    //   return toast.error("Select at least one substore for this role, or choose an \u201Call substores\u201D role")
    // }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        twoFactorRequired: form.twoFactorRequired,
        roleId: form.roleId,
        substoreIds: needsSubstores ? form.substoreIds : [],
        overridePermissions: { grant: [], revoke: form.revokePermissionIds },
        status: form.status,
      }
      if (!isEdit) payload.password = form.password

      if (isEdit) {
        await api.patch(`/seller/store-admins/${adminId}`, payload)
        toast.success("Store admin updated")
      } else {
        await api.post("/seller/store-admins", payload)
        toast.success("Store admin created")
      }
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Failed to save store admin")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>{isEdit ? "Edit store admin" : "Add store admin"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this admin's role, substore access, and permission overrides."
              : "Set a password directly — share it with the admin yourself. They'll set up two-step verification on first login if required."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading store admin" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border px-6 pt-3">
              <TabsList variant="line" className="h-auto w-full justify-start gap-6 bg-transparent p-0">
                {[
                  ["general", "General"],
                  ["permissions", "Permissions"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-none rounded-none border-transparent px-1 pb-2.5 text-sm text-muted-foreground shadow-none after:bottom-[-1px] after:bg-primary hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <TabsContent value="general" className="mt-0 flex flex-col gap-4">
                <Field label="Name *" htmlFor="sa-name">
                  <Input id="sa-name" value={form.name} onChange={setInput("name")} placeholder="e.g. John Doe" maxLength={120} />
                </Field>
                <Field label="Email *" htmlFor="sa-email">
                  <Input
                    id="sa-email"
                    type="email"
                    value={form.email}
                    onChange={setInput("email")}
                    placeholder="admin@example.com"
                    disabled={isEdit}
                  />
                </Field>

                {!isEdit && (
                  <Field label="Password *" htmlFor="sa-password" hint="Auto-generated — copy it before saving, it won't be shown again.">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="sa-password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={setInput("password")}
                          className="pr-9 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                        </button>
                      </div>
                      <Button type="button" variant="outline" size="icon" className="size-9 shrink-0" onClick={() => set("password")} aria-label="Regenerate password">
                        <RefreshCw className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </Field>
                )}

                <Separator className="my-1" />

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require two-step verification</p>
                    <p className="text-xs text-muted-foreground">
                      Admin sets up an authenticator app on first login. You can reset enrollment any time from the list.
                    </p>
                  </div>
                  <Switch checked={form.twoFactorRequired} onCheckedChange={set("twoFactorRequired")} aria-label="Require two-step verification" />
                </div>

                <Separator className="my-1" />

                <Field label="Role *">
                  <Select value={form.roleId} onValueChange={set("roleId")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {selectedRole && (
                  isAllSubstores ? (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      This role grants access to <span className="font-medium text-foreground">all substores</span> — no
                      individual selection needed.
                    </div>
                  ) : isSingleSubstore ? (
                    <Field label="Substore *" hint="This role is scoped to a single substore.">
                      <Select
                        value={form.substoreIds[0] ?? ""}
                        onValueChange={(v) => set("substoreIds")(v ? [v] : [])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select substore" />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedSubstoresList.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : (
                    <Field
                      label="Substores"
                      hint={
                        roleSubstoreIds.size > 0
                          ? "Limited to the substores this role is scoped to."
                          : "Which substores this admin can access."
                      }
                    >
                      <MultiSelect
                        options={substoreOptions}
                        selected={selectedSubstoreNames}
                        onChange={(names) => {
                          const ids = names
                            .map((name) => {
                              const substore = allowedSubstoresList.find((s) => s.name === name)
                              return substore ? String(substore._id) : null
                            })
                            .filter(Boolean)
                          set("substoreIds")(ids)
                        }}
                        placeholder="Select substores"
                      />
                    </Field>
                  )
                )}

                <Separator className="my-1" />
                <Field label="Status">
                  <Select value={form.status} onValueChange={set("status")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="permissions" className="mt-0 flex flex-col gap-3">
                {!form.roleId ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Select a role on the General tab first — this shows only what that role grants.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block size-2.5 rounded-sm border border-emerald-500/40 bg-emerald-500/15" /> Granted by role
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block size-2.5 rounded-sm border border-red-500/40 bg-red-500/10" /> Revoked
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <KeyRound className="size-3" aria-hidden="true" />
                          {effectiveTotal} effective · {overrideCount} revoked
                        </Badge>
                        {overrideCount > 0 && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={resetAllToRoleDefault}>
                            <RotateCcw className="size-3" aria-hidden="true" />
                            Reset all
                          </Button>
                        )}
                      </div>
                    </div>

                    {roleDetailLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <div className="overflow-auto rounded-xl border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="sticky left-0 z-10 bg-muted/50">Module</TableHead>
                              {actions.map((action) => (
                                <TableHead key={action} className="text-center capitalize">
                                  {action}
                                </TableHead>
                              ))}
                              <TableHead className="w-10" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {modules.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={actions.length + 2} className="h-24 text-center text-sm text-muted-foreground">
                                  This role grants no permissions.
                                </TableCell>
                              </TableRow>
                            ) : (
                              modules.map((module) => {
                                const Icon = moduleIcon(module)
                                const items = permissionsByModule.get(module) ?? []
                                const hasOverrideInRow = items.some((p) => isRevoked(p._id))
                                return (
                                  <TableRow key={module}>
                                    <TableCell className="sticky left-0 z-10 bg-background">
                                      <div className="flex items-center gap-2">
                                        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                                        <span className="text-sm font-medium capitalize text-foreground">{module}</span>
                                      </div>
                                    </TableCell>
                                    {actions.map((action) => {
                                      const permission = cellMap.get(`${module}:${action}`)
                                      return (
                                        <TableCell key={action} className="text-center">
                                          {permission ? (
                                            <OverrideCell
                                              revoked={isRevoked(permission._id)}
                                              onClick={() => toggleCell(permission)}
                                              label={permission.label ?? `${module} ${action}`}
                                            />
                                          ) : (
                                            <span className="text-muted-foreground/40">—</span>
                                          )}
                                        </TableCell>
                                      )
                                    })}
                                    <TableCell>
                                      {hasOverrideInRow && (
                                        <button
                                          type="button"
                                          onClick={() => resetRowToRoleDefault(module)}
                                          className="text-muted-foreground hover:text-foreground"
                                          aria-label={`Reset ${module} to role default`}
                                          title="Reset row to role default"
                                        >
                                          <RotateCcw className="size-3.5" aria-hidden="true" />
                                        </button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.email.trim() || !form.roleId}
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create store admin"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default StoreAdminFormSheet