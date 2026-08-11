"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  KeyRound,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api, fetcher } from "@/lib/api";
import { PermissionSelectSheet } from "@/components/hub/permission-select-sheet";
import { PERMISSION_HUB } from "@/lib/permissions-hub";

// TODO: replace with your real module list (same source the sidebar/nav uses).
const MODULE_OPTIONS = [
  "stores",
  "products",
  "diamonds",
  "marketing",
  "orders",
  "customers",
  "staff",
  "site",
  "affiliates",
  "settings",
];

const ACTION_OPTIONS = ["read", "write", "update", "delete", "manage"];

// Fixed action order so every module's action row reads the same left-to-right.
const ACTION_ORDER = ["read", "write", "update", "delete", "manage"];

const ACTION_STYLES = {
  read: "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400",
  write:
    "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  update:
    "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delete: "border-transparent bg-destructive/10 text-destructive",
  manage:
    "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

const EMPTY_FORM = {
  label: "",
  key: "",
  module: "",
  category: "",
  action: "read",
  description: "",
  isActive: true,
  keyEditedManually: false,
};

// Permissions lists are small (tens to low hundreds of rows), so the grouped
// view fetches everything matching the current filters in one page instead
// of paginating — grouping only makes sense with the full set in hand.
const GROUP_FETCH_LIMIT = 500;

function slugify(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleCase(s) {
  return (s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** category -> module -> ordered permission  */
function groupPermissions(rows) {
  const byCategory = new Map();
  for (const doc of rows) {
    const categoryKey = doc.category || doc.module || "uncategorized";
    if (!byCategory.has(categoryKey)) byCategory.set(categoryKey, new Map());
    const byModule = byCategory.get(categoryKey);
    const moduleKey = doc.module || "—";
    if (!byModule.has(moduleKey)) byModule.set(moduleKey, []);
    byModule.get(moduleKey).push(doc);
  }

  const categories = Array.from(byCategory.entries()).map(
    ([category, byModule]) => {
      const modules = Array.from(byModule.entries()).map(
        ([moduleName, docs]) => {
          const sorted = [...docs].sort((a, b) => {
            const ai = ACTION_ORDER.indexOf(a.action);
            const bi = ACTION_ORDER.indexOf(b.action);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          });
          return { moduleName, docs: sorted };
        },
      );
      modules.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
      return { category, modules };
    },
  );
  categories.sort((a, b) => a.category.localeCompare(b.category));
  return categories;
}

export function HubPermissionsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState({}); // { [docId]: true }
  const [collapsed, setCollapsed] = useState({}); // { [categoryKey]: true }
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // single doc or "bulk"
  const [deleting, setDeleting] = useState(false);
  const [permissionForm, setPermissionForm] = useState(false);

  const q = useDebouncedValue(search, 300);

  const params = new URLSearchParams({
    page: "1",
    limit: String(GROUP_FETCH_LIMIT),
    sort: "sortOrder",
  });
  if (q.trim()) params.set("q", q.trim());
  if (moduleFilter !== "all") params.set("module", moduleFilter);

  const { data, isLoading, error, mutate } = useSWR(
    `/seller/permissions?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const groups = useMemo(() => groupPermissions(rows), [rows]);

  function toggleCategory(category) {
    setCollapsed((c) => ({ ...c, [category]: !c[category] }));
  }

  function toggleRow(id) {
    setRowSelection((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  function toggleModuleGroup(docs) {
    const allSelected = docs.every((d) => rowSelection[d._id]);
    setRowSelection((s) => {
      const next = { ...s };
      for (const d of docs) {
        if (allSelected) delete next[d._id];
        else next[d._id] = true;
      }
      return next;
    });
  }

  function openCreate(prefill = {}) {
    setEditingDoc(null);
    setForm({ ...EMPTY_FORM, ...prefill });
    // setDialogOpen(true)
    setPermissionForm(true);
  }

  function openEdit(doc) {
    setEditingDoc(doc);
    setForm({
      label: doc.label ?? "",
      key: doc.key ?? "",
      module: doc.module ?? "",
      category: doc.category ?? "",
      action: doc.action ?? "read",
      description: doc.description ?? "",
      isActive: doc.isActive,
      keyEditedManually: true,
    });
    setDialogOpen(true);
  }

  function updateFormField(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "key") {
        next.keyEditedManually = true;
      } else if (
        !f.keyEditedManually &&
        (field === "module" || field === "category" || field === "action")
      ) {
        const base = slugify(next.category || next.module || "");
        next.key = base ? `${base}.${next.action}` : "";
      }
      return next;
    });
  }

  async function toggleActive(doc) {
    try {
      await api.patch(`/seller/permissions/${doc._id}`, {
        isActive: !doc.isActive,
      });
      toast.success(`${doc.label} ${doc.isActive ? "disabled" : "enabled"}`);
      mutate();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function saveForm() {
    if (!form.label.trim() || !form.key.trim() || !form.module) {
      toast.error("Label, module, and key are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        key: form.key.trim(),
        module: form.module,
        category: form.category.trim() || form.module,
        action: form.action,
        description: form.description.trim(),
        isActive: form.isActive,
      };
      if (editingDoc) {
        await api.patch(`/seller/permissions/${editingDoc._id}`, body);
        toast.success(`${form.label} updated`);
      } else {
        await api.post("/seller/permissions", body);
        toast.success(`${form.label} created`);
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // async function confirmDelete() {
  //   setDeleting(true);
  //   try {
  //     if (deleteTarget === "bulk") {
  //       const targets = rows.filter((r) => rowSelection[r._id]);
  //       const deletable = targets.filter((r) => !r.isSystem);
  //       const skipped = targets.length - deletable.length;

  //       await Promise.all(
  //         deletable.map((r) => api.delete(`/seller/permissions/${r._id}`)),
  //       );

  //       if (deletable.length > 0) {
  //         toast.success(
  //           `Deleted ${deletable.length} permission${deletable.length === 1 ? "" : "s"}`,
  //         );
  //       }
  //       if (skipped > 0) {
  //         toast.error(
  //           `${skipped} system permission${skipped === 1 ? "" : "s"} can't be deleted and ${skipped === 1 ? "was" : "were"} skipped`,
  //         );
  //       }
  //       setRowSelection({});
  //     } else {
  //       await api.delete(`/seller/permissions/${deleteTarget._id}`);
  //       toast.success(`Deleted ${deleteTarget.label}`);
  //     }
  //     setDeleteTarget(null);
  //     mutate();
  //   } catch (err) {
  //     toast.error(err.message);
  //   } finally {
  //     setDeleting(false);
  //   }
  // }

  async function confirmDelete() {
    setDeleting(true);
    try {
      if (deleteTarget === "bulk") {
        const targets = rows.filter((r) => rowSelection[r._id]);
        const ids = targets.map((r) => r._id);
        console.log("sending ids:", ids);
        const result = await api.post("/seller/permissions/bulk-delete", {
          ids,
        });

        if (result.deletedCount > 0) {
          toast.success(
            `Deleted ${result.deletedCount} permission${result.deletedCount === 1 ? "" : "s"}`,
          );
        }
        const skippedSystem = result.skipped?.system?.length ?? 0;
        if (skippedSystem > 0) {
          toast.error(
            `${skippedSystem} system permission${skippedSystem === 1 ? "" : "s"} can't be deleted and ${skippedSystem === 1 ? "was" : "were"} skipped`,
          );
        }
        const skippedNotFound = result.skipped?.notFound?.length ?? 0;
        if (skippedNotFound > 0) {
          toast.error(
            `${skippedNotFound} permission${skippedNotFound === 1 ? "" : "s"} no longer existed`,
          );
        }
        setRowSelection({});
      } else {
        await api.delete(`/seller/permissions/${deleteTarget._id}`);
        toast.success(`Deleted ${deleteTarget.label}`);
      }
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const selectedCount = Object.keys(rowSelection).length;
  const selectedSystemCount = rows.filter(
    (r) => rowSelection[r._id] && r.isSystem,
  ).length;
  const isSystemEdit = Boolean(editingDoc?.isSystem);
  const existingKeys = useMemo(() => new Set(rows.map((r) => r.key)), [rows]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">
            Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Define what store admins can view and manage across each module.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget("bulk")}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete ({selectedCount})
            </Button>
          )}
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add permission
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by label, key…"
            className="h-9 pl-8"
            aria-label="Search permissions"
          />
        </div>
        {/* <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="h-9 w-40" aria-label="Filter by module">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {PERMISSION_HUB.modules.module.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m}
              </SelectItem>
            ))}
            {PERMISSION_HUB.flatMap((category) =>
  category.modules.map((m) => (
    <SelectItem key={m.module} value={m.module}>
      {m.label}
    </SelectItem>
  ))
)}
          </SelectContent>
        </Select> */}
        <span className="ml-auto text-xs text-muted-foreground">
          {total} permission{total === 1 ? "" : "s"} ·{" "}
          {groups.reduce((n, g) => n + g.modules.length, 0)} modules
        </span>
      </div>

      {error?.status === 403 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <ShieldCheck
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            You don't have access to permissions
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
      ) : isLoading && rows.length === 0 ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <KeyRound
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            {q || moduleFilter !== "all"
              ? "No permissions match your filters."
              : "No permissions yet."}
          </p>
          {!q && moduleFilter === "all" && (
            <Button variant="outline" size="sm" onClick={() => openCreate()}>
              <Plus className="size-3.5" aria-hidden="true" />
              Create your first permission
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ category, modules }) => {
            const categoryDocs = modules.flatMap((m) => m.docs);
            const isCollapsed = Boolean(collapsed[category]);
            return (
              <div key={category} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {titleCase(category)}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {modules.length} module{modules.length === 1 ? "" : "s"} ·{" "}
                    {categoryDocs.length} permission
                    {categoryDocs.length === 1 ? "" : "s"}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 gap-3">
                    {modules.map(({ moduleName, docs }) => {
                      const moduleAllSelected = docs.every(
                        (d) => rowSelection[d._id],
                      );
                      const moduleSomeSelected = docs.some(
                        (d) => rowSelection[d._id],
                      );
                      const activeCount = docs.filter((d) => d.isActive).length;
                      return (
                        <div
                          key={moduleName}
                          className="flex flex-col gap-2 rounded-xl border border-border p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                moduleAllSelected ||
                                (moduleSomeSelected && "indeterminate")
                              }
                              onCheckedChange={() => toggleModuleGroup(docs)}
                              aria-label={`Select all ${moduleName} permissions`}
                            />
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                              <Layers
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium capitalize text-foreground">
                                {titleCase(moduleName)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {activeCount}/{docs.length} active
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto size-7"
                              aria-label={`Add action to ${moduleName}`}
                              onClick={() =>
                                openCreate({ module: moduleName, category })
                              }
                            >
                              <Plus className="size-3.5" aria-hidden="true" />
                            </Button>
                          </div>

                          <div className="flex flex-row gap-2 divide-x">
                            {docs.map((doc) => (
                              <div
                                key={doc._id}
                                className="flex items-center gap-2 px-1.5 first:pt-0 last:pb-0"
                              >
                                {/* <Checkbox
                                  checked={Boolean(rowSelection[doc._id])}
                                  onCheckedChange={() => toggleRow(doc._id)}
                                  aria-label={`Select ${doc.label}`}
                                /> */}
                                <Badge
                                  variant="outline"
                                  className={`w-16 shrink-0 justify-center capitalize ${ACTION_STYLES[doc.action] ?? ""}`}
                                >
                                  {doc.action || "—"}
                                </Badge>
                                {/* <div className="flex min-w-0 flex-1 flex-col">
                                  <span className="flex items-center gap-1.5 truncate text-sm text-foreground">
                                    {doc.label || doc.key}
                                    {doc.isSystem && (
                                      <ShieldCheck
                                        className="size-3 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">{doc.key}</span>
                                </div> */}
                                {/* <Switch
                                  checked={doc.isActive}
                                  onCheckedChange={() => toggleActive(doc)}
                                  aria-label={`Toggle ${doc.label}`}
                                /> */}
                                {/* <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7"
                                      aria-label={`Actions for ${doc.label}`}
                                    >
                                      <MoreHorizontal className="size-4" aria-hidden="true" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEdit(doc)}>
                                      <Pencil className="size-4" aria-hidden="true" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      disabled={doc.isSystem}
                                      onClick={() => setDeleteTarget(doc)}
                                    >
                                      <Trash2 className="size-4" aria-hidden="true" />
                                      {doc.isSystem ? "System (locked)" : "Delete"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu> */}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? "Edit permission" : "Add permission"}
            </DialogTitle>
            <DialogDescription>
              {isSystemEdit
                ? "This is a system permission — its key, module, and action are locked, but you can still edit the label, description, and status."
                : "Permissions gate what a store admin role can see or do in the hub."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="perm-label">Label</Label>
              <Input
                id="perm-label"
                value={form.label}
                onChange={(e) => updateFormField("label", e.target.value)}
                placeholder="View Products"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Module</Label>
                <Select
                  value={form.module}
                  onValueChange={(v) => updateFormField("module", v)}
                  disabled={isSystemEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Action</Label>
                <Select
                  value={form.action}
                  onValueChange={(v) => updateFormField("action", v)}
                  disabled={isSystemEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a} className="capitalize">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="perm-key">Key</Label>
                {!isSystemEdit && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        keyEditedManually: !f.keyEditedManually,
                      }))
                    }
                  >
                    {form.keyEditedManually ? "Auto-generate" : "Edit manually"}
                  </button>
                )}
              </div>
              <Input
                id="perm-key"
                value={form.key}
                onChange={(e) => updateFormField("key", e.target.value)}
                placeholder="products.read"
                disabled={isSystemEdit || !form.keyEditedManually}
                className="font-mono text-sm"
              />
              {!isSystemEdit && !form.keyEditedManually && (
                <p className="text-xs text-muted-foreground">
                  Generated from module + action. Click "Edit manually" to
                  override.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="perm-desc">Description</Label>
              <Textarea
                id="perm-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="What this permission lets a store admin do"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="perm-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="perm-active" className="text-sm font-normal">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={saving}>
              {saving
                ? "Saving…"
                : editingDoc
                  ? "Save changes"
                  : "Create permission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `Delete ${selectedCount - selectedSystemCount} permission${selectedCount - selectedSystemCount === 1 ? "" : "s"}?`
                : `Delete ${deleteTarget?.label}?`}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget === "bulk" && selectedSystemCount > 0
                ? `${selectedSystemCount} system permission${selectedSystemCount === 1 ? "" : "s"} in your selection can't be deleted and will be skipped. `
                : ""}
              This removes the permission from every role it's currently
              attached to. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PermissionSelectSheet
        open={permissionForm}
        onOpenChange={setPermissionForm}
        existingKeys={existingKeys}
        onCreated={mutate}
      />
    </div>
  );
}

export default HubPermissionsPage;
