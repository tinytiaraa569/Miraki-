"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
  TriangleAlert,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"

/* ---------------------------------- utils ---------------------------------- */

const PASSWORD_RULES = [
  { id: "length", label: "At least 10 characters", test: (v) => v.length >= 10 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
]

function passwordScore(value) {
  if (!value) return 0
  let score = PASSWORD_RULES.filter((r) => r.test(value)).length
  if (value.length >= 14 && /[^a-zA-Z0-9]/.test(value)) score += 1
  return Math.min(score, 5)
}

const STRENGTH_LABELS = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"]

/* ------------------------------ small pieces ------------------------------- */

function PasswordInput({ id, label, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function StrengthMeter({ value }) {
  const score = passwordScore(value)
  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex items-center gap-1" role="presentation">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              score >= step
                ? score <= 2
                  ? "bg-destructive"
                  : score <= 3
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                : "bg-muted",
            )}
          />
        ))}
      </div>
      {value && (
        <span className="text-xs text-muted-foreground">
          Strength: <span className="font-medium text-foreground">{STRENGTH_LABELS[score]}</span>
        </span>
      )}
    </div>
  )
}

function RuleChecklist({ value }) {
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className="flex items-center gap-1.5 text-xs">
            {ok ? (
              <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
            ) : (
              <X className="size-3.5 text-muted-foreground" aria-hidden="true" />
            )}
            <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}

function SectionHeading({ icon: Icon, title, description, id }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/* ---------------------------- change password ------------------------------ */

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const rulesPass = useMemo(() => PASSWORD_RULES.every((r) => r.test(newPassword)), [newPassword])
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword
  const canSubmit = currentPassword.length > 0 && rulesPass && confirmPassword === newPassword && !saving

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      await api.post("/auth/password", { currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err?.message || "Could not update password. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="settings-password" className="flex flex-col gap-4">
      <SectionHeading
        icon={KeyRound}
        id="settings-password"
        title="Change password"
        description="Other devices are signed out after the change."
      />

      {success && (
        <Alert variant="success">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>Your new password is active. Other sessions have been signed out.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="current-password"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          placeholder="Enter current password"
        />

        <div className="flex flex-col gap-2">
          <PasswordInput
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            placeholder="Enter new password"
          />
          <StrengthMeter value={newPassword} />
          <RuleChecklist value={newPassword} />
        </div>

        <div className="flex flex-col gap-1.5">
          <PasswordInput
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter new password"
          />
          {confirmMismatch && (
            <p role="alert" className="text-xs text-destructive">
              Passwords do not match.
            </p>
          )}
        </div>

        <Button type="submit" disabled={!canSubmit} className="w-fit cursor-pointer">
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {saving ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  )
}

/* --------------------------------- dialog ---------------------------------- */

export function SettingsDialog({ open, onOpenChange }) {
  const { theme, toggleTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Loads ONLY while the dialog is open — key is null otherwise, so no fetch.
  const { data, isLoading, mutate } = useSWR(open ? "/auth/2fa/status" : null, fetcher, {
    revalidateOnFocus: false,
  })

  async function handleTwoFactorToggle(checked) {
    setError(null)
    setSaving(true)
    try {
      const res = await api.post(checked ? "/auth/2fa/enable" : "/auth/2fa/disable")
      await mutate(res, { revalidate: false })
    } catch {
      setError("Could not update two-step verification. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Base DialogContent is display:grid — explicit rows keep header/footer fixed
          and give the middle row a bounded (minmax 0,1fr) height so it can scroll. */}
      <DialogContent className="grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <Tabs defaultValue="information" className="contents">
          {/* Fixed header */}
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-0 pt-4 text-left">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Account security and appearance preferences.</DialogDescription>
            <TabsList className="mt-3 grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="information" className="w-full">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Information
              </TabsTrigger>
              <TabsTrigger value="password" className="w-full">
                <KeyRound className="size-4" aria-hidden="true" />
                Password
              </TabsTrigger>
            </TabsList>
            <div className="h-3" aria-hidden="true" />
          </DialogHeader>

          {/* Scrollable middle */}
          <ScrollArea className="h-full min-h-0">
            <TabsContent value="information" className="mt-0">
              <div className="flex flex-col gap-6 px-6 py-5">
                {/* Two-step verification */}
                <section aria-labelledby="settings-2fa" className="flex flex-col gap-4">
                  <SectionHeading
                    icon={ShieldCheck}
                    id="settings-2fa"
                    title="Security"
                    description="Protect your account with a second sign-in step."
                  />
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">Two-step verification</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {isLoading
                          ? "Checking status…"
                          : data?.required
                            ? data?.enrolled
                              ? "On — a 6-digit authenticator code is required at sign-in."
                              : "On — you'll scan a QR code at your next sign-in."
                            : "Off — sign-in requires only your password."}
                      </span>
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        {saving && (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
                        )}
                        <Switch
                          checked={!!data?.required}
                          onCheckedChange={handleTwoFactorToggle}
                          disabled={saving}
                          className="cursor-pointer"
                          aria-label="Toggle two-step verification"
                        />
                      </div>
                    )}
                  </div>
                  {!isLoading && !data?.required && (
                    <Alert variant="destructive">
                      <TriangleAlert aria-hidden="true" />
                      <AlertTitle>Two-step verification is off</AlertTitle>
                      <AlertDescription>
                        Anyone with your password can sign in. Turn it back on to secure your account.
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <p role="alert" className="text-xs text-destructive">
                      {error}
                    </p>
                  )}
                </section>

                {/* Appearance */}
                <section aria-labelledby="settings-appearance" className="flex flex-col gap-4">
                  <SectionHeading
                    icon={theme === "dark" ? Moon : Sun}
                    id="settings-appearance"
                    title="Appearance"
                    description="Switch between light and dark themes."
                  />
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">Dark mode</span>
                      <span className="text-xs text-muted-foreground">
                        {theme === "dark" ? "Dark theme is active." : "Light theme is active."}
                      </span>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={toggleTheme}
                      className="cursor-pointer"
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <div className="flex flex-col gap-6 px-6 py-5">
                <ChangePasswordSection />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Fixed footer */}
        <DialogFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
