"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Layers, Loader2, Lock, Save, X } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { api, fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

// Categories per infinite-scroll page for the permission editor.
const PERM_PAGE = 6;

const ACTION_ORDER = ["read", "write", "update", "delete", "manage", "export"];
const ACTION_LABELS = {
  read: "View",
  write: "Create",
  update: "Edit",
  delete: "Delete",
  manage: "Manage",
  export: "Export",
};
const ACTION_STYLES = {
  read: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  write: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  update: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delete: "bg-destructive/10 text-destructive",
  manage: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  export: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

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
  dataAccess: "",
  otherSubstoreAccess: "view_only",
  substoreIds: [],
};

export function RoleFormSheet({ open, onOpenChange, roleId = null, onSaved }) {
  const [tab, setTab] = useState("general");
  const [role, setRole] = useState(EMPTY_ROLE);
  const [granted, setGranted] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  // Permission catalog — grouped by category -> module and loaded a page at a
  // time via infinite scroll (no more limit=500). Only fetched while open.
  const getPermKey = (index, prev) => {
    if (!open) return null;
    if (prev && (prev.rows?.length ?? 0) < PERM_PAGE) return null;
    return `/seller/permissions/grouped?page=${index + 1}&limit=${PERM_PAGE}`;
  };
  const {
    data: permPages,
    size,
    setSize,
    isValidating: permsValidating,
    isLoading: permsLoading,
  } = useSWRInfinite(getPermKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  });

  const categories = useMemo(
    () => (permPages ?? []).flatMap((p) => p?.rows ?? []),
    [permPages],
  );
  const totalCategories = permPages?.[0]?.total ?? 0;
  const hasMore = categories.length < totalCategories;

  // Total permission count (for the "x of y granted" badge) — one lean call.
  const { data: keysData } = useSWR(
    open ? "/seller/permissions/keys" : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const totalPermissions = keysData?.keys?.length ?? 0;
  const allPermissionIds = keysData?.ids ?? [];
  const allGranted =
    allPermissionIds.length > 0 && granted.size >= allPermissionIds.length;

  // Substores — lazy, paged options feed (same pattern as the option-set /
  // collection editors). NOTHING is fetched until the picker is opened; it then
  // hits the lean /options endpoint 10 at a time.
  const SUBSTORE_PAGE_SIZE = 10;
  const [substoreQuery, setSubstoreQuery] = useState("");
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false);
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null; // lazy: don't fetch until opened
    if (prev && (prev.rows?.length ?? 0) < SUBSTORE_PAGE_SIZE) return null;
    const params = new URLSearchParams({
      page: String(index + 1),
      limit: String(SUBSTORE_PAGE_SIZE),
    });
    if (substoreQuery) params.set("q", substoreQuery);
    return `/seller/substores/options?${params.toString()}`;
  };
  const {
    data: substorePages,
    size: substoreSize,
    setSize: setSubstoreSize,
    isLoading: substoreLoading,
    isValidating: substoreValidating,
  } = useSWRInfinite(getSubstoreKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  });
  const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? []);
  const substoreTotal = substorePages?.[0]?.total ?? 0;
  const pickerSubstoreOptions = substoreRows.map((s) => ({
    value: String(s._id),
    label: s.name,
  }));
  const substoreHasMore = substoreRows.length < substoreTotal;
  const substoreLoadingMore =
    substoreValidating && substorePages && substoreSize > substorePages.length;

  // Resolve labels for already-selected ids (edit mode) so chips aren't blank
  // before the paged list has scrolled far enough to include them.
  const { data: selectedSubstoreData } = useSWR(
    open && role.substoreIds?.length
      ? `/seller/substores/options?ids=${role.substoreIds.join(",")}`
      : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const substoreOptions = useMemo(() => {
    const byValue = new Map();
    for (const s of selectedSubstoreData?.rows ?? []) {
      byValue.set(String(s._id), { value: String(s._id), label: s.name });
    }
    for (const o of pickerSubstoreOptions) byValue.set(o.value, o);
    return [...byValue.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubstoreData, substoreRows.length]);

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
        dataAccess: editingRole.dataAccess ?? "",
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

  // Infinite scroll: fetch the next page when the permissions list is scrolled
  // near the bottom — reads the scroll container directly (same approach as the
  // substore/product pickers), so it never depends on observer/mount timing.
  function handlePermScroll(e) {
    if (tab !== "permissions" || !hasMore || permsValidating) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      setSize(size + 1);
    }
  }

  const toggleCell = useCallback((permission) => {
    if (!permission) return;
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(permission._id)) next.delete(permission._id);
      else next.add(permission._id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((docs, grant) => {
    setGranted((prev) => {
      const next = new Set(prev);
      for (const d of docs) {
        if (grant) next.add(d._id);
        else next.delete(d._id);
      }
      return next;
    });
  }, []);

  const set = (key) => (value) => setRole((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!role.displayName.trim()) {
      setTab("general");
      toast.error("Role name is required");
      return;
    }
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
          otherSubstoreAccess: role.otherSubstoreAccess,
          substoreIds: role.substoreIds || [],
          permissions: Array.from(granted),
          // Blank = "not chosen": omit on create; send null on edit so a
          // previously-set value is actually cleared (not left/defaulted).
          ...(role.dataAccess
            ? { dataAccess: role.dataAccess }
            : editingRole
              ? { dataAccess: null }
              : {}),
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
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
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

            <div
              onScroll={handlePermScroll}
              className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
            >
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

                  <div className="flex items-center gap-2">
                    <Select
                      value={role.dataAccess}
                      onValueChange={(v) =>
                        setRole((r) => ({ ...r, dataAccess: v }))
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select data access" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_ACCESS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {role.dataAccess && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground"
                        onClick={() => set("dataAccess")("")}
                        aria-label="Clear data access"
                        title="Clear"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      DATA_ACCESS_OPTIONS.find(
                        (o) => o.value === role.dataAccess,
                      )?.hint
                    }
                  </p>

                  <Field
                    label="Substores"
                    hint="Which substores this admin can access."
                  >
                    <MultiSelect
                      options={substoreOptions}
                      selected={role.substoreIds}
                      onChange={(ids) => set("substoreIds")(ids)}
                      placeholder="Select substores"
                      emptyText="No substores"
                      onOpenChange={(o) => o && setSubstorePickerOpen(true)}
                      loading={substoreLoading}
                      hasMore={substoreHasMore}
                      isLoadingMore={substoreLoadingMore}
                      onLoadMore={() => setSubstoreSize(substoreSize + 1)}
                      onSearch={(q) => {
                        setSubstoreQuery(q);
                        setSubstoreSize(1);
                      }}
                    />
                  </Field>

                  {role.dataAccess && role.dataAccess !== "own_substore" && (
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

              <TabsContent value="permissions" className="mt-0 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Grant permissions by module. Hover an action for details.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <KeyRound className="size-3" aria-hidden="true" />
                      {granted.size}
                      {totalPermissions ? ` of ${totalPermissions}` : ""} granted
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={allPermissionIds.length === 0}
                      onClick={() =>
                        setGranted(
                          allGranted ? new Set() : new Set(allPermissionIds),
                        )
                      }
                    >
                      {allGranted ? "Clear all" : "Select all"}
                    </Button>
                  </div>
                </div>

                {permsLoading && categories.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No permissions found. Seed defaults from the Permissions page
                    first.
                  </p>
                ) : (
                  <TooltipProvider delayDuration={200}>
                    <Accordion
                      type="multiple"
                      defaultValue={categories.map((c) => c.category)}
                      className="flex flex-col gap-2"
                    >
                      {categories.map((cat) => {
                        const catDocs = (cat.modules ?? []).flatMap(
                          (m) => m.permissions ?? [],
                        );
                        const grantedInCat = catDocs.filter((d) =>
                          granted.has(d._id),
                        ).length;
                        const catAll =
                          catDocs.length > 0 && grantedInCat === catDocs.length;
                        const catSome = !catAll && grantedInCat > 0;
                        return (
                          <AccordionItem
                            key={cat.category}
                            value={cat.category}
                            className="rounded-xl border border-border px-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                checked={catAll || (catSome && "indeterminate")}
                                onCheckedChange={(v) =>
                                  toggleMany(catDocs, Boolean(v))
                                }
                                aria-label={`Grant all ${cat.category} permissions`}
                              />
                              <AccordionTrigger className="flex-1 hover:no-underline">
                                <div className="flex flex-1 items-center gap-2">
                                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                                    {titleCase(cat.category)}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="font-normal"
                                  >
                                    {cat.moduleCount} module
                                    {cat.moduleCount === 1 ? "" : "s"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {grantedInCat}/{cat.permissionCount} granted
                                  </span>
                                </div>
                              </AccordionTrigger>
                            </div>
                            <AccordionContent className="pb-3">
                              <div className="flex flex-col gap-2">
                                {(cat.modules ?? []).map((m) => {
                                  const docs = sortActions(m.permissions ?? []);
                                  const modGranted = docs.filter((d) =>
                                    granted.has(d._id),
                                  ).length;
                                  const modAll =
                                    docs.length > 0 &&
                                    modGranted === docs.length;
                                  const modSome = !modAll && modGranted > 0;
                                  return (
                                    <div
                                      key={m.module}
                                      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-4"
                                    >
                                      <div className="flex items-center gap-2.5 sm:w-60 sm:shrink-0">
                                        <Checkbox
                                          checked={
                                            modAll ||
                                            (modSome && "indeterminate")
                                          }
                                          onCheckedChange={(v) =>
                                            toggleMany(docs, Boolean(v))
                                          }
                                          aria-label={`Grant all ${m.module} permissions`}
                                        />
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                                          <Layers
                                            className="size-4 text-muted-foreground"
                                            aria-hidden="true"
                                          />
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                          <span className="truncate text-sm font-medium text-foreground">
                                            {titleCase(m.module)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {modGranted}/{docs.length} granted
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                        {docs.map((doc) => {
                                          const on = granted.has(doc._id);
                                          return (
                                            <Tooltip key={doc._id}>
                                              <TooltipTrigger asChild>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    toggleCell(doc)
                                                  }
                                                  className={cn(
                                                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                                                    on
                                                      ? cn(
                                                          "border-transparent",
                                                          ACTION_STYLES[
                                                            doc.action
                                                          ] ??
                                                            "bg-primary/15 text-primary",
                                                        )
                                                      : "border-border text-muted-foreground hover:bg-muted/60",
                                                  )}
                                                >
                                                  <span
                                                    className={cn(
                                                      "size-1.5 rounded-full",
                                                      on
                                                        ? "bg-current"
                                                        : "bg-border",
                                                    )}
                                                  />
                                                  {ACTION_LABELS[doc.action] ??
                                                    doc.action}
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent
                                                side="top"
                                                className="max-w-xs"
                                              >
                                                <div className="flex flex-col gap-1">
                                                  <div className="font-medium">
                                                    {doc.label || doc.key}
                                                  </div>
                                                  <code className="font-mono text-[11px] opacity-80">
                                                    {doc.key}
                                                  </code>
                                                  {doc.description ? (
                                                    <p className="text-[11px] opacity-80">
                                                      {doc.description}
                                                    </p>
                                                  ) : null}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </TooltipProvider>
                )}

                {/* Loading spinner while the next page is fetched */}
                {permsValidating && categories.length > 0 && (
                  <div className="flex justify-center py-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
