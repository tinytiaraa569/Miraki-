"use client"

import { useState } from "react"
import { CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

const ROLES = [
  { id: "STORE_SUPERADMIN", label: "Store superadmin", hint: "Full control of the assigned store" },
  { id: "STORE_ADMIN", label: "Store admin", hint: "Day-to-day management of the assigned store" },
]

export function TeamPanel({ hub }) {
  const stores = hub?.stores ?? []
  const [storeId, setStoreId] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("STORE_ADMIN")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [invited, setInvited] = useState(null)
  const [copied, setCopied] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setInvited(null)
    try {
      const res = await api.post(`/seller/stores/${storeId}/users`, { email, role })
      setInvited(res)
      setEmail("")
    } catch (err) {
      setError(err.message || "Failed to send invite")
    } finally {
      setSaving(false)
    }
  }

  async function copyLink() {
    if (!invited?.activationUrl) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invited.activationUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — user can select the text manually
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" aria-hidden="true" />
          Invite a team member
        </CardTitle>
        <CardDescription>
          Invite an admin to one of your stores. They&apos;ll activate their account with the link below (emailed in
          production).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-store">Store</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger id="invite-store" aria-label="Select store">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s._id} value={String(s._id)}>
                    {s.name} {s.type === "MAIN" ? "(Main)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" aria-label="Select role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLES.find((r) => r.id === role)?.hint}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {invited && (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                Invite created for {invited.user?.email}
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  {invited.activationUrl}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">The link expires in 15 minutes.</p>
            </div>
          )}

          <Button type="submit" disabled={saving || !storeId || !email} className="self-start">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Send invite
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
