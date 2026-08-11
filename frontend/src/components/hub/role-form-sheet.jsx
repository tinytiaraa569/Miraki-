"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Lock,
  Package,
  Save,
  ShoppingCart,
  Store,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/hub/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, fetcher } from "@/lib/api";
import { Separator } from "../ui/separator";

const MODULE_ICONS = {
  products: Package,
  orders: ShoppingCart,
  stores: Store,
  staff: UserCog,
};

function moduleIcon(module) {
  return MODULE_ICONS[module] ?? KeyRound;
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

const COLOR_SWATCHES = [
  "#6B7280",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

const DATA_ACCESS_OPTIONS = [
  {
    value: "own_substore",
    label: "Own substore only",
    hint: "Can only see/manage records tied to their own substore",
  },
  {
    value: "multiple_substores",
    label: "Multiple substores",
    hint: "Pick which substores this role can access",
  },
  {
    value: "all_substores",
    label: "All substores",
    hint: "Full visibility across every substore",
  },
];

const OTHER_ACCESS_OPTIONS = [
  { value: "view_only", label: "View only" },
  { value: "permission_based", label: "Permission-based" },
];

const EMPTY_ROLE = {
  displayName: "",
  description: "",
  color: "#6B7280",
  status: "active",
  dataAccess: "own_substore",
  otherSubstoreAccess: "view_only",
  substoreIds: [],
};

export function RoleFormSheet({ open, onOpenChange, roleId = null, onSaved }) {
  const [tab, setTab] = useState("general");
  const [role, setRole] = useState(EMPTY_ROLE);
  const [granted, setGranted] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  // Permission catalog — the matrix needs the full set, not a paginated page,
  // so request a high limit. Only fetched while the sheet is open.
  const { data: permData, isLoading: permsLoading } = useSWR(
    open ? "/seller/permissions?limit=500&sort=sortOrder" : null,
    fetcher,
  );
  const permissions = permData?.rows ?? [];

  // Substore catalog — needed for the "multiple_substores" picker.
  const { data: substoreData, isLoading: substoresLoading } = useSWR(
    open ? "/seller/substores?limit=10" : null,
    fetcher,
  );
  const substores = substoreData?.rows ?? [];

  const substoreOptions = substores.map((s) => ({
    value: s.name,
    label: s.name,
  }));

  const selectedSubstoreNames = substores
    .filter((s) => role.substoreIds?.includes(String(s._id)))
    .map((s) => s.name);

  // Fetch the role being edited (parent no longer holds the full list).
  const { data: roleData, isLoading: roleLoading } = useSWR(
    open && roleId ? `/seller/roles/${roleId}` : null,
    fetcher,
  );
  const editingRole = roleData?.role ?? null;
  const isSystem = Boolean(editingRole?.isSystem);

  // Reset the form each time the sheet opens, or once the edited role loads.
  useEffect(() => {
    if (!open) return;
    setTab("general");
    if (roleId && editingRole) {
      setRole({
        displayName: editingRole.displayName,
        description: editingRole.description ?? "",
        color: editingRole.color ?? "#6B7280",
        status: editingRole.status,
        dataAccess: editingRole.dataAccess ?? "own_substore",
        otherSubstoreAccess: editingRole.otherSubstoreAccess ?? "view_only",
        substoreIds: (editingRole.substoreIds ?? []).map((s) =>
          typeof s === "string" ? s : s._id,
        ),
      });
      setGranted(
        new Set(
          (editingRole.permissions ?? []).map((p) =>
            typeof p === "string" ? p : p._id,
          ),
        ),
      );
    } else if (!roleId) {
      setRole(EMPTY_ROLE);
      setGranted(new Set());
    }
  }, [open, roleId, editingRole]);

  const { modules, actions, cellMap } = useMemo(() => {
    const moduleSet = new Set();
    const actionSet = new Set();
    const map = new Map();
    for (const p of permissions) {
      if (!p.module || !p.action) continue;
      moduleSet.add(p.module);
      actionSet.add(p.action);
      map.set(`${p.module}:${p.action}`, p);
    }
    return {
      modules: Array.from(moduleSet).sort(),
      actions: Array.from(actionSet).sort(),
      cellMap: map,
    };
  }, [permissions]);

  const permissionsByModule = useMemo(() => {
    const map = new Map();
    for (const m of modules) {
      map.set(m, actions.map((a) => cellMap.get(`${m}:${a}`)).filter(Boolean));
    }
    return map;
  }, [modules, actions, cellMap]);

  const permissionsByAction = useMemo(() => {
    const map = new Map();
    for (const a of actions) {
      map.set(a, modules.map((m) => cellMap.get(`${m}:${a}`)).filter(Boolean));
    }
    return map;
  }, [modules, actions, cellMap]);

  const toggleCell = useCallback((permission) => {
    if (!permission) return;
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(permission._id)) next.delete(permission._id);
      else next.add(permission._id);
      return next;
    });
  }, []);

  const toggleRow = useCallback(
    (module, checked) => {
      const items = permissionsByModule.get(module) ?? [];
      setGranted((prev) => {
        const next = new Set(prev);
        for (const p of items) {
          if (checked) next.add(p._id);
          else next.delete(p._id);
        }
        return next;
      });
    },
    [permissionsByModule],
  );

  const toggleColumn = useCallback(
    (action, checked) => {
      const items = permissionsByAction.get(action) ?? [];
      setGranted((prev) => {
        const next = new Set(prev);
        for (const p of items) {
          if (checked) next.add(p._id);
          else next.delete(p._id);
        }
        return next;
      });
    },
    [permissionsByAction],
  );

  const toggleAll = useCallback(
    (checked) => {
      setGranted(checked ? new Set(permissions.map((p) => p._id)) : new Set());
    },
    [permissions],
  );

  const toggleSubstore = useCallback((id, checked) => {
    setRole((r) => {
      const set = new Set(r.substoreIds);
      if (checked) set.add(id);
      else set.delete(id);
      return { ...r, substoreIds: Array.from(set) };
    });
  }, []);

  const totalPermissions = permissions.length;
  const allGranted = granted.size === totalPermissions && totalPermissions > 0;
  const someGranted = !allGranted && granted.size > 0;

  const set = (key) => (value) => setRole((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!role.displayName.trim()) {
      setTab("general");
      toast.error("Role name is required");
      return;
    }
    // if (role.dataAccess === "multiple_substores" && role.substoreIds.length === 0) {
    //   setTab("general")
    //   toast.error("Select at least one substore")
    //   return
    // }
    setSaving(true);

    // System roles: only the permission set is editable server-side, so only
    // send that to avoid a 403 from assertNotSystemLocked on the rest.
    const payload = isSystem
      ? { permissions: Array.from(granted) }
      : {
          displayName: role.displayName.trim(),
          description: role.description.trim(),
          color: role.color,
          status: role.status,
          dataAccess: role.dataAccess,
          otherSubstoreAccess: role.otherSubstoreAccess,
          substoreIds: role.substoreIds || [],
          permissions: Array.from(granted),
        };

    try {
      const res = editingRole
        ? await api.patch(`/seller/roles/${editingRole._id}`, payload)
        : await api.post("/seller/roles", payload);
      const saved = res.role;
      onSaved?.(saved);
      toast.success(
        `${saved.displayName} saved with ${granted.size} permission${granted.size === 1 ? "" : "s"}`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message ?? "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  const loading = roleLoading && Boolean(roleId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="gap-1 border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            {roleId ? "Edit role" : "Create role"}
            {isSystem && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Lock className="size-3" aria-hidden="true" />
                System role
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {isSystem
              ? "System roles ship with the platform — only their permissions can be changed."
              : "Set the basics, scope the access, then grant permissions module by module."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 flex-col gap-3 px-6 py-5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b border-border px-6 pt-3">
              <TabsList
                variant="line"
                className="h-auto w-full justify-start gap-6 bg-transparent p-0"
              >
                {[
                  ["general", "General"],
                  ["permissions", "Permission matrix (ABAC)"],
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
                <SectionHeading>Basics</SectionHeading>
                <fieldset
                  disabled={isSystem}
                  className="flex flex-col gap-4 disabled:opacity-60"
                >
                  <Field label="Role Name *" htmlFor="role-name" />
                  <Input
                    id="role-name"
                    value={role.displayName}
                    onChange={(e) =>
                      setRole((r) => ({ ...r, displayName: e.target.value }))
                    }
                    placeholder="Store Manager"
                    required
                    maxLength={120}
                    // autoFocus
                  />
                  <Field htmlFor="role-desc" label="Description " />
                  <Textarea
                    id="role-desc"
                    value={role.description}
                    onChange={(e) =>
                      setRole((r) => ({ ...r, description: e.target.value }))
                    }
                    placeholder="What this role is for and who should have it"
                    rows={3}
                  />
                  <Field label="Accent color" />
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRole((r) => ({ ...r, color: c }))}
                        className={`size-6 rounded-full ring-offset-2 ring-offset-background transition ${
                          role.color?.toUpperCase() === c
                            ? "ring-2 ring-foreground"
                            : ""
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Use color ${c}`}
                      />
                    ))}
                    {/* <Input
                        value={role.color}
                        onChange={(e) => setRole((r) => ({ ...r, color: e.target.value }))}
                        className="h-8 w-24 font-mono text-xs uppercase"
                        maxLength={7}
                        aria-label="Custom hex color"
                      /> */}
                  </div>
                  <Field
                    htmlFor="role-active"
                    className="text-sm font-normal"
                    label="Active — this role can be assigned to staff"
                  />
                  <Switch
                    id="role-active"
                    checked={role.status === "active"}
                    onCheckedChange={(v) =>
                      setRole((r) => ({
                        ...r,
                        status: v ? "active" : "inactive",
                      }))
                    }
                  />
                </fieldset>
                <Separator className="my-2" />
                <SectionHeading>Access & Scope</SectionHeading>
                <fieldset
                  disabled={isSystem}
                  className="flex flex-col gap-5 disabled:opacity-60"
                >
                  <Field
                    label="Data access"
                    hint="Which substores' records can staff with this role see or manage?"
                  />

                  <Select
                    value={role.dataAccess}
                    onValueChange={(v) =>
                      setRole((r) => ({ ...r, dataAccess: v }))
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_ACCESS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {
                      DATA_ACCESS_OPTIONS.find(
                        (o) => o.value === role.dataAccess,
                      )?.hint
                    }
                  </p>

                  {/* {role.dataAccess === "multiple_substores" && ( */}
                  <div className="flex flex-col gap-1.5">
                    <Label>Substores</Label>
                    {substoresLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : substores.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No substores found.
                      </p>
                    ) : (
                      // <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
                      //   {substores.map((s) => (
                      //     <label
                      //       key={s._id}
                      //       className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      //     >
                      //       <Checkbox
                      //         checked={role.substoreIds.includes(s._id)}
                      //         onCheckedChange={(v) => toggleSubstore(s._id, Boolean(v))}
                      //       />
                      //       {s.name}
                      //       {s.alias && <span className="text-xs text-muted-foreground">({s.alias})</span>}
                      //     </label>
                      //   ))}
                      // </div>
                      // <Field label="Substores" hint="Which substores this admin can access.">
                      //                     <MultiSelect
                      //                       options={substoreOptions}
                      //                       selected={role.substoreIds}
                      //                       onChange={set("substoreIds")}
                      //                       placeholder="Select substores"
                      //                     />
                      //                   </Field>
                      <Field
                        label="Substores"
                        hint="Which substores this admin can access."
                      >
                        <MultiSelect
                          options={substoreOptions}
                          selected={selectedSubstoreNames}
                          onChange={(names) => {
                            const ids = names
                              .map((name) => {
                                const substore = substores.find(
                                  (s) => s.name === name,
                                );
                                return substore ? String(substore._id) : null;
                              })
                              .filter(Boolean);

                            set("substoreIds")(ids);
                          }}
                          placeholder="Select substores"
                        />
                      </Field>
                    )}
                  </div>
                  {/* )} */}

                  {role.dataAccess !== "own_substore" && (
                    <div className="flex flex-col gap-1.5">
                      <Field
                        label="Access to other substores"
                        hint="How staff with this role interact with substores outside their scope above."
                      />
                      <Select
                        value={role.otherSubstoreAccess}
                        onValueChange={(v) =>
                          setRole((r) => ({ ...r, otherSubstoreAccess: v }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OTHER_ACCESS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </fieldset>
              </TabsContent>

              <TabsContent value="permissions" className="mt-0">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Check a whole row, a whole column, or individual cells.
                  </p>
                  <Badge variant="outline" className="gap-1">
                    <KeyRound className="size-3" aria-hidden="true" />
                    {granted.size} of {totalPermissions} granted
                  </Badge>
                </div>
                {permsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="overflow-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="sticky left-0 z-10 bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={
                                  allGranted || (someGranted && "indeterminate")
                                }
                                onCheckedChange={(v) => toggleAll(Boolean(v))}
                                aria-label="Grant every permission"
                              />
                              Module
                            </div>
                          </TableHead>
                          {actions.map((action) => {
                            const items = permissionsByAction.get(action) ?? [];
                            const colGranted =
                              items.every((p) => granted.has(p._id)) &&
                              items.length > 0;
                            const colSome =
                              !colGranted &&
                              items.some((p) => granted.has(p._id));
                            return (
                              <TableHead
                                key={action}
                                className="text-center capitalize"
                              >
                                <div className="flex items-center flex-col justify-center pb-1 text-sm gap-1">
                                  {action}
                                  <Checkbox
                                    checked={
                                      colGranted || (colSome && "indeterminate")
                                    }
                                    onCheckedChange={(v) =>
                                      toggleColumn(action, Boolean(v))
                                    }
                                    aria-label={`Grant all ${action} permissions`}
                                  />
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={actions.length + 1}
                              className="h-24 text-center text-sm text-muted-foreground"
                            >
                              No permissions found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          modules.map((module) => {
                            const Icon = moduleIcon(module);
                            const items = permissionsByModule.get(module) ?? [];
                            const rowGranted =
                              items.every((p) => granted.has(p._id)) &&
                              items.length > 0;
                            const rowSome =
                              !rowGranted &&
                              items.some((p) => granted.has(p._id));
                            return (
                              <TableRow key={module}>
                                <TableCell className="sticky left-0 z-10 bg-background">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={
                                        rowGranted ||
                                        (rowSome && "indeterminate")
                                      }
                                      onCheckedChange={(v) =>
                                        toggleRow(module, Boolean(v))
                                      }
                                      aria-label={`Grant all ${module} permissions`}
                                    />
                                    <Icon
                                      className="size-4 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                    <span className="text-sm font-medium capitalize text-foreground">
                                      {module}
                                    </span>
                                  </div>
                                </TableCell>
                                {actions.map((action) => {
                                  const permission = cellMap.get(
                                    `${module}:${action}`,
                                  );
                                  return (
                                    <TableCell
                                      key={action}
                                      className="text-center"
                                    >
                                      {permission ? (
                                        <Checkbox
                                          checked={granted.has(permission._id)}
                                          onCheckedChange={() =>
                                            toggleCell(permission)
                                          }
                                          aria-label={permission.label}
                                          title={permission.description}
                                        />
                                      ) : (
                                        <span className="text-muted-foreground/40">
                                          —
                                        </span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="size-3.5" aria-hidden="true" />
            {saving ? "Saving…" : roleId ? "Save changes" : "Create role"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default RoleFormSheet;
