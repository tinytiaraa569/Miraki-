"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { AlertTriangle, Building2, Loader2, Lock, Plus, Store, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function CreateSubstoreDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await api.post("/seller/stores", { name: name.trim() })
      setOpen(false)
      setName("")
      await onCreated()
    } catch (err) {
      setError(err.message || "Failed to create substore")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Create substore
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) {
            setName("")
            setError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create substore</DialogTitle>
            <DialogDescription>
              Substores live under your Main Store hub. You can invite dedicated admins for each one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="substore-name">Store name</Label>
              <Input
                id="substore-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Downtown Branch"
                required
                minLength={1}
                maxLength={120}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function StoresPanel({ hub, isOwner }) {
  const { mutate } = useSWRConfig()
  const stats = hub?.stats ?? {}
  const stores = hub?.stores ?? []
  const multistoreEnabled = Boolean(hub?.seller?.multistoreEnabled)
  const mainStoreId = hub?.seller?.mainStoreId

  // MAIN first, then substores by creation date.
  const sorted = [...stores].sort((a, b) => (a.type === "MAIN" ? -1 : b.type === "MAIN" ? 1 : 0))

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label="Total stores" value={stats.totalStores ?? 0} />
        <StatCard icon={Building2} label="Substores" value={stats.subStores ?? 0} />
        <StatCard icon={Users} label="Team members" value={stats.teamMembers ?? "—"} />
      </div>

      {/* Stores list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Stores</h2>
            <p className="text-xs text-muted-foreground">
              {multistoreEnabled
                ? "Your Main Store is the hub. Substores are optional."
                : "Single-store mode — substores are not enabled for your account."}
            </p>
          </div>
          {isOwner &&
            (multistoreEnabled ? (
              <CreateSubstoreDialog
                onCreated={() => mutate((key) => typeof key === "string" && key.startsWith("/seller/"))}
              />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" aria-hidden="true" />
                Multistore disabled — contact the platform administrator
              </span>
            ))}
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <AlertTriangle className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No stores visible for your account.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((store) => {
              const isMain = store.type === "MAIN" || String(store._id) === String(mainStoreId)
              return (
                <li key={store._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        isMain ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      <Store className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">{store.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(store.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={isMain ? "default" : "outline"} className="shrink-0 rounded-full text-[10px]">
                    {isMain ? "MAIN — HUB" : "SUB"}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
