"use client"

import { useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Construction,
  Copyright,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Store,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  useGeneralSettings,
  useGeneralSettingsMutations,
} from "@/components/hub/settings/use-general-settings"
import { useHubAuth, hasPermission } from "@/hooks/use-hub-auth"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"
import { LANGUAGES, GMT_OFFSETS, toGmtOffset } from "@/lib/store-data"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // matches the server-side decoded cap
// Every web-renderable image format the server accepts for settings uploads
// (kept in sync with SETTINGS_IMAGE_MIME in backend utils/uploads.js). HEIC/
// TIFF/BMP are intentionally excluded — browsers can't render them in <img>.
const ACCEPTED = "image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
const ACCEPTED_EXT_RE = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i
const DESCRIPTION_MAX = 1000
const MIN_PASSWORD = 4

// Top-level branding slots: form key -> PATCH keys + which stored URL feeds the
// "current" preview. The nested under-construction image is handled separately.
const IMAGE_SLOTS = [
  { key: "logo", base64: "logoBase64", remove: "removeLogo", url: "logoUrl", label: "Logo", hint: "Your main store logo." },
  { key: "mobileLogo", base64: "mobileLogoBase64", remove: "removeMobileLogo", url: "mobileLogoUrl", label: "Mobile logo", hint: "Smaller logo shown on phones." },
  { key: "favicon", base64: "faviconBase64", remove: "removeFavicon", url: "faviconUrl", label: "Favicon", hint: "Brand icon for browser tabs and bookmarks. Use PNG, SVG, or ICO." },
  { key: "ogImage", base64: "ogImageBase64", remove: "removeOgImage", url: "ogImageUrl", label: "Social share image", hint: "Image shown when your store link is shared. Recommended 1200×630." },
]

// Editable scalar fields sent in the PATCH. `storeName` is intentionally NOT
// here: it is owned by the main store (seller.businessName), shown read-only,
// and never sent from this page — the server sets it authoritatively.
const SCALAR_KEYS = [
  "pageTitle",
  "description",
  "contactEmail",
  "contactPhone",
  "defaultStoreLocation",
  "copyright",
  "defaultLanguage",
  "defaultTimezone",
]

function scalarsFrom(settings) {
  const out = {}
  for (const k of SCALAR_KEYS) out[k] = settings?.[k] ?? ""
  return out
}

/**
 * One image drop-zone (click or drag & drop). `preview` is the resolved src to
 * show (staged data URL or the stored /uploads image), `onPick` receives a
 * base64 data URL, `onRemove` clears the slot. Mirrors the substore/profile
 * upload UX; the server re-checks MIME + 2 MB on save.
 */
function ImageSlot({ label, hint, preview, disabled, onPick, onRemove }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function readFile(file) {
    if (!file) return
    // Accept by MIME, falling back to the file extension — some browsers report
    // an empty type for .ico and a few other image formats.
    if (!file.type.startsWith("image/") && !ACCEPTED_EXT_RE.test(file.name || "")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 2 MB)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result)
    reader.onerror = () => toast.error("Could not read the selected file")
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragOver(false)
          readFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
        )}
      >
        {preview ? (
          <>
            <img src={preview || "/placeholder.svg"} alt={`${label} preview`} className="max-h-24 max-w-full object-contain" />
            {!disabled && (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Upload className="size-3.5" aria-hidden="true" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-xs text-muted-foreground/70">PNG, JPG, WEBP, AVIF, GIF, SVG or ICO (max 2 MB)</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            readFile(e.target.files?.[0])
            e.target.value = ""
          }}
          aria-label={`Upload ${label}`}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function Field({ id, label, icon: Icon, hint, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

/**
 * One titled section inside the single settings panel. Replaces the former
 * per-section Cards: the whole form is now ONE card, its sections separated by
 * rules, so the page reads as a single sheet instead of a stack of shadowed
 * boxes.
 */
function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/**
 * The editable General Settings form. State model for images mirrors the
 * profile panel: a slot is absent from `images` (untouched), a data URL
 * (staged upload) or "" (remove requested). `settings` is the server's
 * canonical copy; after a save the SWR cache updates and the initial snapshot
 * recomputes, so `dirty` clears without a remount.
 */
function GeneralSettingsForm({ settings, canWrite, mainStoreName }) {
  const { save, saving } = useGeneralSettingsMutations()

  const initialScalars = useMemo(() => scalarsFrom(settings), [settings])
  const initialUc = Boolean(settings?.underConstruction?.enabled)
  const initialPw = Boolean(settings?.passwordPage?.enabled)

  const [form, setForm] = useState(initialScalars)
  const [images, setImages] = useState({}) // slot key -> data URL | ""
  const [ucEnabled, setUcEnabled] = useState(initialUc)
  const [pwEnabled, setPwEnabled] = useState(initialPw)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  // Language options — always include the saved value so the Select can show it.
  const languageOptions = useMemo(() => {
    const list = LANGUAGES.map((l) => ({ value: l.code, label: l.name }))
    if (form.defaultLanguage && !list.some((o) => o.value === form.defaultLanguage)) {
      list.unshift({ value: form.defaultLanguage, label: form.defaultLanguage })
    }
    return list
  }, [form.defaultLanguage])

  // The stored timezone may be a legacy IANA name (e.g. "Asia/Dubai") — show it
  // as its GMT offset without rewriting state, so the field isn't marked dirty.
  const timezoneValue = toGmtOffset(form.defaultTimezone)
  const timezoneOptions = useMemo(() => {
    const list = GMT_OFFSETS.map((z) => ({ value: z, label: z }))
    if (timezoneValue && !list.some((o) => o.value === timezoneValue)) {
      list.unshift({ value: timezoneValue, label: timezoneValue })
    }
    return list
  }, [timezoneValue])

  // The Description is rich text (HTML). The counter reflects VISIBLE characters
  // — matching the editor's soft cap and the plain text search engines index —
  // not raw markup length.
  const descriptionLength = useMemo(
    () =>
      form.description
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .trim().length,
    [form.description],
  )

  const dirty =
    JSON.stringify(form) !== JSON.stringify(initialScalars) ||
    Object.keys(images).length > 0 ||
    ucEnabled !== initialUc ||
    pwEnabled !== initialPw ||
    password.length > 0

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Resolve the preview src for a slot: staged value wins, else the stored URL.
  function previewFor(slotKey, storedUrl) {
    const staged = images[slotKey]
    if (staged === undefined) return imgUrl(storedUrl)
    return staged ? staged : null // "" => removed
  }

  function pickImage(slotKey) {
    return (dataUrl) => setImages((im) => ({ ...im, [slotKey]: dataUrl }))
  }
  function removeImage(slotKey) {
    return () => setImages((im) => ({ ...im, [slotKey]: "" }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!canWrite) return
    if (pwEnabled && password && password.length < MIN_PASSWORD) {
      setError(`Store password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    setError("")
    setSaved(false)

    // Scalar fields (all valid keys; the server treats each as a set).
    const payload = { ...form }

    // Top-level branding slots.
    for (const slot of IMAGE_SLOTS) {
      const staged = images[slot.key]
      if (staged === undefined) continue
      if (staged) payload[slot.base64] = staged
      else if (settings?.[slot.url]) payload[slot.remove] = true
    }

    // Under construction (toggle + own image).
    payload.underConstruction = { enabled: ucEnabled }
    const stagedUc = images.underConstruction
    if (stagedUc !== undefined) {
      if (stagedUc) payload.underConstruction.imageBase64 = stagedUc
      else if (settings?.underConstruction?.imageUrl) payload.underConstruction.removeImage = true
    }

    // Password page (toggle + optional new secret; blank keeps the current one).
    payload.passwordPage = { enabled: pwEnabled }
    if (password) payload.passwordPage.password = password

    try {
      await save(payload)
      setImages({})
      setPassword("")
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success("General settings saved")
    } catch (err) {
      const msg = err?.message || "Failed to save settings"
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-6">
      {/* One unified settings panel — sections divided by rules, not separate
          cards, so the page reads as a single sheet instead of stacked boxes. */}
      <Card className="w-full">
        <CardContent className="flex flex-col gap-8 pt-6">
          <Section
            icon={Store}
            title="Store details"
            description="How your store shows up in browser tabs and search results."
          >
          <div className="flex flex-col gap-4">
            <Field
              id="gs-storeName"
              label="Store name"
              icon={Store}
              hint="Managed in your main store — not editable here."
            >
              <Input
                id="gs-storeName"
                value={mainStoreName || settings?.storeName || ""}
                placeholder="Your store"
                readOnly
                disabled
                aria-readonly="true"
              />
            </Field>
            <Field id="gs-pageTitle" label="Page title" hint="This appears in browser tabs and search results.">
              <Input id="gs-pageTitle" value={form.pageTitle} onChange={setInput("pageTitle")} placeholder="Miraki Jewels — Fine Jewellery" maxLength={200} disabled={!canWrite} />
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gs-description">Description</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {descriptionLength}/{DESCRIPTION_MAX}
              </span>
            </div>
            <RichTextEditor
              id="gs-description"
              value={form.description}
              onChange={set("description")}
              readOnly={!canWrite}
              maxLength={DESCRIPTION_MAX}
              minHeight={160}
              ariaLabel="Store description"
              placeholder="A short description for search results and social shares…"
            />
            <p className="text-xs text-muted-foreground/70">
              A short summary shown in search results and social shares.
            </p>
          </div>
          </Section>

          <Separator />

          <Section
            icon={ImageIcon}
            title="Branding"
            description="Logos and icons shown across your store."
          >
            <div className="flex flex-col gap-5">
          {IMAGE_SLOTS.map((slot) => (
            <ImageSlot
              key={slot.key}
              label={slot.label}
              hint={slot.hint}
              preview={previewFor(slot.key, settings?.[slot.url])}
              disabled={!canWrite}
              onPick={pickImage(slot.key)}
              onRemove={removeImage(slot.key)}
            />
          ))}
          </div>
          </Section>

          <Separator />

          <Section
            icon={Mail}
            title="Contact"
            description="How customers reach you, and your default store location."
          >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="gs-contactEmail" label="Contact email" icon={Mail}>
              <Input id="gs-contactEmail" type="email" value={form.contactEmail} onChange={setInput("contactEmail")} placeholder="hello@example.com" maxLength={254} disabled={!canWrite} />
            </Field>
            <Field id="gs-contactPhone" label="Contact phone" icon={Phone}>
              <PhoneInput id="gs-contactPhone" value={form.contactPhone} onChange={set("contactPhone")} placeholder="Enter phone number" disabled={!canWrite} />
            </Field>
          </div>
          <Field id="gs-location" label="Default store location" icon={MapPin} hint="City and country of your store.">
            <Input id="gs-location" value={form.defaultStoreLocation} onChange={setInput("defaultStoreLocation")} placeholder="Mumbai, India" maxLength={200} disabled={!canWrite} />
          </Field>
          </Section>

          <Separator />

          <Section
            icon={Globe}
            title="Localization"
            description="Default language, time zone, and storefront copyright line."
          >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="gs-language" label="Default language" icon={Globe}>
              <Select value={form.defaultLanguage || "en"} onValueChange={set("defaultLanguage")} disabled={!canWrite}>
                <SelectTrigger id="gs-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-64">
                  {languageOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="gs-timezone" label="Default time zone" icon={Clock}>
              <Select
                value={timezoneValue || "none"}
                onValueChange={(v) => set("defaultTimezone")(v === "none" ? "" : v)}
                disabled={!canWrite}
              >
                <SelectTrigger id="gs-timezone">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-64">
                  <SelectItem value="none">None</SelectItem>
                  {timezoneOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="gs-copyright" label="Copyright" icon={Copyright} hint="Shown in the storefront footer.">
            <Input id="gs-copyright" value={form.copyright} onChange={setInput("copyright")} placeholder="© 2026 Miraki Jewels" maxLength={300} disabled={!canWrite} />
          </Field>
          </Section>

          <Separator />

          <Section
            icon={Construction}
            title="Under construction"
            description="Show a maintenance screen to visitors while you work on the store."
          >
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Enable under-construction page</p>
              <p className="text-xs text-muted-foreground">Visitors see the maintenance screen instead of the storefront.</p>
            </div>
            <Switch checked={ucEnabled} onCheckedChange={setUcEnabled} disabled={!canWrite} aria-label="Enable under-construction page" />
          </div>
          <ImageSlot
            label="Under-construction image"
            hint="Optional banner shown on the maintenance screen."
            preview={previewFor("underConstruction", settings?.underConstruction?.imageUrl)}
            disabled={!canWrite}
            onPick={pickImage("underConstruction")}
            onRemove={removeImage("underConstruction")}
          />
          </Section>

          <Separator />

          <Section
            icon={Lock}
            title="Password protection"
            description="Require a shared password before visitors can view the storefront."
          >
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Enable password page</p>
              <p className="text-xs text-muted-foreground">
                {settings?.passwordPage?.enabled
                  ? "A password is currently set. Leave the field blank to keep it."
                  : "Set a password below to gate the storefront."}
              </p>
            </div>
            <Switch checked={pwEnabled} onCheckedChange={setPwEnabled} disabled={!canWrite} aria-label="Enable password page" />
          </div>
          <Field
            id="gs-password"
            label="Store password"
            icon={Lock}
            hint={`At least ${MIN_PASSWORD} characters. Leave blank to keep your current password.`}
          >
            <Input
              id="gs-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={200}
              disabled={!canWrite || !pwEnabled}
            />
          </Field>
          </Section>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <Button type="submit" disabled={saving || !dirty || !canWrite}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
        {!canWrite ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Read-only — you don&apos;t have permission to edit general settings.
          </span>
        ) : saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-primary" role="status">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Saved
          </span>
        ) : dirty ? (
          <Badge variant="secondary" className="font-normal">
            Unsaved changes
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">All changes saved</span>
        )}
      </div>
    </form>
  )
}

/** /hub/settings — store-wide General Settings (feeds the storefront <head>). */
export function HubGeneralSettingsPage() {
  const { settings, isLoading } = useGeneralSettings()
  const { permissions, isOwner, seller } = useHubAuth()
  const canWrite = isOwner || hasPermission(permissions, "general_setting", "write")
  const mainStoreName = seller?.businessName || ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">General Settings</h1>
        <p className="text-sm text-muted-foreground">
          Store identity, branding, and the storefront&apos;s page title, description, and favicon.
        </p>
      </div>

      {isLoading || !settings ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <GeneralSettingsForm settings={settings} canWrite={canWrite} mainStoreName={mainStoreName} />
      )}
    </div>
  )
}

export default HubGeneralSettingsPage
