"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { Plus, Loader2, AlertCircle, Copy, Check, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api, ApiError } from "@/lib/api"

export function CreateSellerDialog() {
  const { mutate } = useSWRConfig()
  const [open, setOpen] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [multistore, setMultistore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  function reset() {
    setBusinessName("")
    setOwnerEmail("")
    setMultistore(false)
    setError(null)
    setResult(null)
    setCopied(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post("/platform/sellers", {
        businessName,
        ownerEmail,
        multistoreEnabled: multistore,
      })
      setResult(res)
      await mutate((key) => typeof key === "string" && key.startsWith("/platform/"))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed.")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyInvite() {
    if (!result?.inviteToken) return
    const link = `${window.location.origin}/activate?token=${result.inviteToken}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          Create seller
        </Button>
      </DialogTrigger>
      <DialogContent>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Seller created</DialogTitle>
              <DialogDescription>
                {result.seller.businessName} was provisioned atomically with its default Main Store.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="size-4 text-primary" aria-hidden="true" />
                Owner invite — shown once
              </div>
              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Owner email</dt>
                  <dd className="font-mono text-foreground">{result.seller.ownerEmail}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Activation link</dt>
                  <dd className="break-all font-mono text-xs text-foreground">
                    {result.inviteToken
                      ? `${window.location.origin}/activate?token=${result.inviteToken}`
                      : "Sent via email"}
                  </dd>
                </div>
              </dl>
              {result.inviteToken && (
                <Button variant="secondary" size="sm" onClick={copyInvite} className="self-start">
                  {copied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy activation link"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Share this securely. The owner opens the link to set their password; it is single-use, expires in 15
                minutes, and cannot be retrieved again.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create seller</DialogTitle>
              <DialogDescription>
                Provisions the seller, its owner account, and a default Main Store atomically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Jewels"
                  required
                  minLength={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ownerEmail">Owner email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@acme.com"
                  required
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="multistore" className="cursor-pointer">
                    Multistore enabled
                  </Label>
                  <span className="text-xs text-muted-foreground">Allow this seller to create additional stores</span>
                </div>
                <Switch id="multistore" checked={multistore} onCheckedChange={setMultistore} />
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
                <Button type="submit" disabled={submitting || !businessName || !ownerEmail}>
                  {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {submitting ? "Provisioning…" : "Create seller"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
