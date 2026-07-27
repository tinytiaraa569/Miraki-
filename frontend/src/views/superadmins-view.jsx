"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import {
  ShieldCheck,
  ShieldOff,
  Plus,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Ban,
  RotateCcw,
  MoreHorizontal,
  Crown,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, ApiError, fetcher } from "@/lib/api"

const initialsOf = (admin) => {
  const source = admin.name || admin.email || "?"
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function CreateSuperadminDialog() {
  const { mutate } = useSWRConfig()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)

  function reset() {
    setName("")
    setEmail("")
    setPassword("")
    setConfirm("")
    setShowPassword(false)
    setError(null)
    setCreated(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post("/platform/superadmins", { name: name.trim(), email, password })
      setCreated(res.superadmin)
      await mutate((key) => typeof key === "string" && key.startsWith("/platform/"))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          Add superadmin
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Superadmin created</DialogTitle>
              <DialogDescription>
                {created.email} can now sign in with the password you set. Two-step verification is required by
                default — they&apos;ll be walked through authenticator setup on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Share the credentials through a secure channel. The password is never shown again and is stored only as
              a hash.
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add superadmin</DialogTitle>
              <DialogDescription>
                Creates a new platform superadmin with full access. They sign in with the email and password below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sa-name">Name (optional)</Label>
                <Input
                  id="sa-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sa-email">Email</Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sa-password">Password</Label>
                <div className="relative">
                  <Input
                    id="sa-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 10 chars, upper, lower, digit"
                    required
                    minLength={10}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sa-confirm">Confirm password</Label>
                <Input
                  id="sa-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat the password"
                  required
                  minLength={10}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !email || !password || !confirm}>
                  {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {submitting ? "Creating…" : "Create superadmin"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TwoFactorConfirmDialog({ admin, open, onOpenChange, onConfirm, busy }) {
  const turningOn = !admin?.twoFactorRequired
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{turningOn ? "Require two-step verification?" : "Turn off two-step verification?"}</DialogTitle>
          <DialogDescription>
            {turningOn
              ? `${admin?.email} will be required to set up an authenticator app on their next login before they can access the dashboard.`
              : `${admin?.email} will sign in with only their password. Their current authenticator enrollment is removed — re-enabling later requires a fresh setup.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={turningOn ? "default" : "destructive"} onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {turningOn ? "Require two-step" : "Turn off"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SuperadminsView() {
  const { data, isLoading } = useSWR("/platform/superadmins", fetcher, { revalidateOnFocus: false })
  const { mutate } = useSWRConfig()
  const [busyId, setBusyId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const admins = data?.items ?? []
  const selfId = data?.selfId

  async function refresh() {
    await mutate((key) => typeof key === "string" && key.startsWith("/platform/"))
  }

  async function toggleStatus(admin) {
    setBusyId(admin.id)
    try {
      const next = admin.status === "active" ? "suspended" : "active"
      await api.patch(`/platform/superadmins/${admin.id}/status`, { status: next })
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function confirmTwoFactor() {
    if (!confirmTarget) return
    setBusyId(confirmTarget.id)
    try {
      await api.patch(`/platform/superadmins/${confirmTarget.id}/two-factor`, {
        required: !confirmTarget.twoFactorRequired,
      })
      await refresh()
      setConfirmTarget(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Superadmins</h1>
          <p className="text-sm text-muted-foreground">
            Platform-level administrators with full access. All superadmins can manage each other.
          </p>
        </div>
        <CreateSuperadminDialog />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Two-step</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isSelf = admin.id === selfId
                const busy = busyId === admin.id
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {initialsOf(admin)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-foreground">
                              {admin.name || admin.email}
                            </span>
                            {admin.isOriginal && (
                              <Badge
                                variant="outline"
                                className="gap-1 border-primary/30 bg-primary/5 px-1.5 text-[10px] text-primary"
                              >
                                <Crown className="size-2.5" aria-hidden="true" />
                                Original
                              </Badge>
                            )}
                            {isSelf && (
                              <Badge variant="outline" className="px-1.5 text-[10px]">
                                You
                              </Badge>
                            )}
                          </div>
                          {admin.name && <span className="truncate text-xs text-muted-foreground">{admin.email}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.status === "active" ? "default" : "destructive"}>{admin.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={admin.twoFactorRequired}
                          disabled={isSelf || busy}
                          onCheckedChange={() => setConfirmTarget(admin)}
                          aria-label={`Two-step verification for ${admin.email}`}
                        />
                        {admin.twoFactorRequired ? (
                          admin.totpEnabled ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                              Enrolled
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending setup</span>
                          )
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldOff className="size-3.5" aria-hidden="true" />
                            Off
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={busy} aria-label={`Actions for ${admin.email}`}>
                            {busy ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={isSelf || (admin.isOriginal && admin.status === "active")}
                            onClick={() => toggleStatus(admin)}
                            className={admin.status === "active" ? "text-destructive focus:text-destructive" : ""}
                          >
                            {admin.status === "active" ? (
                              <>
                                <Ban className="size-4" aria-hidden="true" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <RotateCcw className="size-4" aria-hidden="true" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {admins.length} superadmin{admins.length === 1 ? "" : "s"} · You can&apos;t change your own status or
          two-step setting, and the original account can&apos;t be suspended.
        </p>
      )}

      <TwoFactorConfirmDialog
        admin={confirmTarget}
        open={Boolean(confirmTarget)}
        onOpenChange={(next) => {
          if (!next) setConfirmTarget(null)
        }}
        onConfirm={confirmTwoFactor}
        busy={Boolean(confirmTarget && busyId === confirmTarget.id)}
      />
    </div>
  )
}
