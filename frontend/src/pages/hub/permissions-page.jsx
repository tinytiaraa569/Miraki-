"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Layers,
  Plus,
  RotateCw,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api, fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PermissionSelectSheet } from "@/components/hub/permission-select-sheet";

// The grouped endpoint paginates by CATEGORY, so we only ever pull a handful
// of fully-formed category blocks per request instead of every permission.
const CATEGORIES_PER_PAGE = 6;

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
const ACTION_ORDER = ["read", "write", "update", "delete", "manage", "export"];

const ACTION_STYLES = {
  read: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  write: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  update: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delete: "bg-destructive/10 text-destructive",
  manage: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  export: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
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

function sortActions(docs) {
  return [...docs].sort((a, b) => {
    const ai = ACTION_ORDER.indexOf(a.action);
    const bi = ACTION_ORDER.indexOf(b.action);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

const ACTION_LABELS = {
  read: "View",
  write: "Create",
  update: "Edit",
  delete: "Delete",
  manage: "Manage",
  export: "Export",
};

// Compact page list with ellipsis: 1 … 4 5 6 … 12
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

// Full-width module row: module identity on the left, its action chips filling
// the rest. Each chip reveals the full permission in a tooltip on hover.
function PermissionModuleCard({
  moduleName,
  docs,
  activeCount,
  selection,
  onToggleModule,
  onAddAction,
  onEditDoc,
}) {
  const ordered = useMemo(() => sortActions(docs), [docs]);
  const allSelected = docs.length > 0 && docs.every((d) => selection[d._id]);
  const someSelected = docs.some((d) => selection[d._id]);

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2.5 sm:w-72 sm:shrink-0">
        <Checkbox
          checked={allSelected || (someSelected && "indeterminate")}
          onCheckedChange={() => onToggleModule(docs)}
          aria-label={`Select all ${moduleName} permissions`}
        />
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {titleCase(moduleName)}
          </span>
          <span className="text-xs text-muted-foreground">
            {activeCount}/{docs.length} active
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {ordered.map((doc) => (
          <Tooltip key={doc._id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onEditDoc(doc)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium capitalize transition-opacity hover:opacity-80",
                  ACTION_STYLES[doc.action] ?? "bg-muted text-muted-foreground",
                  !doc.isActive && "opacity-40 grayscale",
                )}
              >
                {ACTION_LABELS[doc.action] ?? doc.action ?? "—"}
                {doc.isSystem && (
                  <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-medium">
                  {doc.label || doc.key}
                  {doc.isSystem && (
                    <ShieldCheck className="size-3" aria-hidden="true" />
                  )}
                </div>
                <code className="font-mono text-[11px] opacity-80">{doc.key}</code>
                <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                  <span className="capitalize">{doc.action}</span>
                  <span>·</span>
                  <span>{doc.isActive ? "Active" : "Inactive"}</span>
                </div>
                {doc.description ? (
                  <p className="mt-0.5 text-[11px] opacity-80">{doc.description}</p>
                ) : null}
                <p className="mt-1 text-[11px] opacity-60">Click to edit</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 sm:ml-auto sm:shrink-0"
        aria-label={`Add action to ${moduleName}`}
        onClick={onAddAction}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

export function HubPermissionsPage() {
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState({}); // { [docId]: true }
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // single doc or "bulk"
  const [deleting, setDeleting] = useState(false);
  const [permissionForm, setPermissionForm] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const q = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(CATEGORIES_PER_PAGE),
  });
  if (q.trim()) params.set("q", q.trim());

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/seller/permissions/grouped?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  // A fresh search resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [q]);

  // Navigating pages / searching clears the per-page bulk selection.
  useEffect(() => {
    setRowSelection({});
  }, [page, q]);

  const categories = useMemo(() => data?.rows ?? [], [data]);
  const totalCategories = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCategories / CATEGORIES_PER_PAGE));
  const pageNumbers = useMemo(
    () => getPageNumbers(page, totalPages),
    [page, totalPages],
  );

  // Keep the page in range if the total shrinks (e.g. after a bulk delete).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Docs on the current page — used for bulk-delete resolution.
  const loadedDocs = useMemo(
    () =>
      categories.flatMap((c) =>
        (c.modules ?? []).flatMap((m) => m.permissions ?? []),
      ),
    [categories],
  );

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

  async function handleReseed() {
    setReseeding(true);
    try {
      const r = await api.post("/seller/permissions/reseed");
      toast.success(
        r.insertedCount > 0
          ? `Added ${r.insertedCount} missing permission${r.insertedCount === 1 ? "" : "s"}`
          : "Permissions already up to date",
      );
      mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReseeding(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      if (deleteTarget === "bulk") {
        const ids = Object.keys(rowSelection);
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
  const selectedSystemCount = loadedDocs.filter(
    (r) => rowSelection[r._id] && r.isSystem,
  ).length;
  const isSystemEdit = Boolean(editingDoc?.isSystem);

  return (
    <TooltipProvider delayDuration={200}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleReseed}
              disabled={reseeding}
            >
              <RotateCw
                className={cn("size-3.5", reseeding && "animate-spin")}
                aria-hidden="true"
              />
              {reseeding ? "Reseeding…" : "Reseed defaults"}
            </Button>
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
        <span className="ml-auto text-xs text-muted-foreground">
          {totalCategories} categor{totalCategories === 1 ? "y" : "ies"} · Page{" "}
          {page} of {totalPages}
        </span>
      </div>

      {error?.status === 403 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            You don't have access to permissions
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : isLoading && categories.length === 0 ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <KeyRound className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {q ? "No permissions match your search." : "No permissions yet."}
          </p>
          {!q && (
            <div className="mt-1 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReseed} disabled={reseeding}>
                <RotateCw className={cn("size-3.5", reseeding && "animate-spin")} aria-hidden="true" />
                Reseed defaults
              </Button>
              <Button size="sm" onClick={() => openCreate()}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add permission
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Accordion
            key={`${page}:${q}`}
            type="multiple"
            defaultValue={categories.map((c) => c.category)}
            className="flex flex-col gap-3"
          >
            {categories.map(({ category, modules, moduleCount, permissionCount, activeCount }) => (
              <AccordionItem
                key={category}
                value={category}
                className="rounded-xl border border-border bg-card/50 px-4 last:border-b"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                      {titleCase(category)}
                    </h2>
                    <Badge variant="secondary" className="font-normal">
                      {moduleCount} module{moduleCount === 1 ? "" : "s"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activeCount}/{permissionCount} active
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {(modules ?? []).map((m) => (
                      <PermissionModuleCard
                        key={m.module}
                        moduleName={m.module}
                        docs={m.permissions ?? []}
                        activeCount={m.activeCount ?? 0}
                        selection={rowSelection}
                        onToggleModule={toggleModuleGroup}
                        onAddAction={() =>
                          openCreate({ module: m.module, category })
                        }
                        onEditDoc={openEdit}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Previous page"
                  disabled={page <= 1 || isValidating}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="size-8"
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? "page" : undefined}
                      disabled={isValidating}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Next page"
                  disabled={page >= totalPages || isValidating}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
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
              This removes the permission from every role it's currently attached
              to. This action cannot be undone.
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
        onCreated={mutate}
      />
      </div>
    </TooltipProvider>
  );
}

export default HubPermissionsPage;
