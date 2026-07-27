"use client"

import { useMemo, useRef, useState } from "react"
import { useSWRConfig } from "swr"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  ImageIcon,
  Loader2,
  MapPin,
  Moon,
  Palette,
  Phone,
  Sun,
  Trash2,
  Upload,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // matches the server-side cap
const ACCEPTED = "image/png,image/jpeg,image/webp,image/svg+xml"
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const DESCRIPTION_MAX = 1000

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Singapore",
  "Hong Kong",
  "Japan",
  "China",
  "Thailand",
  "Israel",
  "Turkey",
  "Saudi Arabia",
  "Qatar",
  "South Africa",
  "Brazil",
  "Mexico",
]

/**
 * One logo slot (light or dark). `staged` is null (untouched), "" (remove
 * requested) or a data URL (new file staged). Files are sent as base64 in
 * the JSON PATCH — the server writes them to uploads/seller/<id>/logo/ and
 * stores ONLY the URL in the database.
 *
 * Supports click-to-upload and drag & drop.
 */
function LogoSlot({ label, hint, icon: Icon, preview, dark, square, onPick, onRemove, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function stageFile(file) {
    if (!file) return
    onError("")
    if (!file.type.startsWith("image/")) {
      onError("Please choose an image file.")
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      onError("Logo must be 2 MB or smaller.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result)
    reader.onerror = () => onError("Could not read the selected file.")
    reader.readAsDataURL(file)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    stageFile(file)
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        {label}
      </Label>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          stageFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
          dark
            ? "border-neutral-600 bg-neutral-800 dark:border-neutral-600 dark:bg-neutral-800"
            : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900",
          dragging && "border-primary bg-primary/5",
        )}
      >
        {preview ? (
          <img
            src={preview || "/placeholder.svg"}
            alt={`${label} preview`}
            className={cn("max-w-full shrink-0 object-contain", square ? "size-16 rounded-lg" : "h-16")}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-lg",
              dark ? "text-neutral-400" : "text-neutral-400 dark:text-neutral-500",
            )}
          >
            <ImageIcon className="size-8" />
          </span>
        )}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className={
              dark
                ? "border-neutral-500 bg-neutral-700 text-neutral-100 hover:bg-neutral-600 hover:text-white dark:border-neutral-500 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                : undefined
            }
          >
            <Upload className="size-3.5" aria-hidden="true" />
            {preview ? "Replace" : "Upload"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className={
                dark
                  ? "text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                  : undefined
              }
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
        <p className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-500 dark:text-neutral-400")}>
          {hint} Drag &amp; drop or click to upload.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleFile}
          className="sr-only"
          aria-label={`Upload ${label.toLowerCase()}`}
        />
      </div>
    </div>
  )
}

/** Hex color field with a native picker swatch + editable text input. */
function ColorField({ id, label, hint, value, onChange }) {
  const valid = !value || HEX_RE.test(value)
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_RE.test(value) ? value : "#7c3aed"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} picker`}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="#7c3aed"
          maxLength={7}
          aria-invalid={!valid}
          className="font-mono"
        />
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Reset
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{!valid ? "Use a hex color like #7c3aed" : hint}</p>
    </div>
  )
}

/** Labeled input with an optional leading icon. */
function Field({ id, label, icon: Icon, className, ...inputProps }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
        {label}
      </Label>
      <Input id={id} {...inputProps} />
    </div>
  )
}

export function ProfilePanel({ seller, onSaved }) {
  const { mutate } = useSWRConfig()
  const profile = seller?.profile ?? {}

  const initialForm = useMemo(
    () => ({
      phone: profile.phone ?? "",
      website: profile.website ?? "",
      description: profile.description ?? "",
      addressLine1: profile.addressLine1 ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      postalCode: profile.postalCode ?? "",
      country: profile.country ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seller],
  )
  const [form, setForm] = useState(initialForm)

  // Branding state. Logo slots: null = untouched, "" = remove, "data:" = staged.
  const savedLight = profile.logoLightUrl ?? profile.logoUrl ?? null
  const savedDark = profile.logoDarkUrl ?? null
  const savedIcon = profile.logoIconUrl ?? null
  const savedIconDark = profile.logoIconDarkUrl ?? null
  const [logoLight, setLogoLight] = useState(null)
  const [logoDark, setLogoDark] = useState(null)
  const [logoIcon, setLogoIcon] = useState(null)
  const [logoIconDark, setLogoIconDark] = useState(null)
  const [previewLight, setPreviewLight] = useState(imgUrl(savedLight))
  const [previewDark, setPreviewDark] = useState(imgUrl(savedDark))
  const [previewIcon, setPreviewIcon] = useState(imgUrl(savedIcon))
  const [previewIconDark, setPreviewIconDark] = useState(imgUrl(savedIconDark))
  const [brandColor, setBrandColor] = useState(profile.brandColor ?? "")
  const [accentColor, setAccentColor] = useState(profile.accentColor ?? "")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  // Country list — always include the saved value so the Select can show it.
  const countryOptions = useMemo(() => {
    const list = [...COUNTRIES]
    if (form.country && !list.includes(form.country)) list.unshift(form.country)
    return list
  }, [form.country])

  const dirty =
    JSON.stringify(form) !== JSON.stringify(initialForm) ||
    logoLight !== null ||
    logoDark !== null ||
    logoIcon !== null ||
    logoIconDark !== null ||
    brandColor !== (profile.brandColor ?? "") ||
    accentColor !== (profile.accentColor ?? "")

  function set(id, value) {
    setForm((f) => ({ ...f, [id]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if ((brandColor && !HEX_RE.test(brandColor)) || (accentColor && !HEX_RE.test(accentColor))) {
      setError("Brand colors must be hex values like #7c3aed.")
      return
    }
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const payload = { ...form, brandColor: brandColor || "", accentColor: accentColor || "" }
      if (logoLight) payload.logoLightBase64 = logoLight
      else if (logoLight === "" && savedLight) payload.removeLogoLight = true
      if (logoDark) payload.logoDarkBase64 = logoDark
      else if (logoDark === "" && savedDark) payload.removeLogoDark = true
      if (logoIcon) payload.logoIconBase64 = logoIcon
      else if (logoIcon === "" && savedIcon) payload.removeLogoIcon = true
      if (logoIconDark) payload.logoIconDarkBase64 = logoIconDark
      else if (logoIconDark === "" && savedIconDark) payload.removeLogoIconDark = true

      await api.patch("/seller/profile", payload)
      setLogoLight(null)
      setLogoDark(null)
      setLogoIcon(null)
      setLogoIconDark(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Refresh everything seller-scoped — /seller/branding re-themes the
      // sidebar instantly with the new logo/colors.
      await mutate((key) => typeof key === "string" && key.startsWith("/seller/"))
      await onSaved?.()
    } catch (err) {
      setError(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-6">
      <Tabs defaultValue="branding" className="w-full gap-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="size-3.5" aria-hidden="true" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-1.5">
            <Building2 className="size-3.5" aria-hidden="true" />
            Business details
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------ BRANDING ------------------------------ */}
        <TabsContent value="branding" className="mt-0">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="size-4" aria-hidden="true" />
                Branding
              </CardTitle>
              <CardDescription>
                Logos and brand colors are applied across your Hub — sidebar, buttons, and highlights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <LogoSlot
                  label="Logo — light mode"
                  hint="Shown on light backgrounds."
                  icon={Sun}
                  preview={previewLight}
                  dark={false}
                  onPick={(dataUrl) => {
                    setLogoLight(dataUrl)
                    setPreviewLight(dataUrl)
                  }}
                  onRemove={() => {
                    setLogoLight("")
                    setPreviewLight(null)
                  }}
                  onError={setError}
                />
                <LogoSlot
                  label="Logo — dark mode"
                  hint="Shown when dark mode is on."
                  icon={Moon}
                  preview={previewDark}
                  dark
                  onPick={(dataUrl) => {
                    setLogoDark(dataUrl)
                    setPreviewDark(dataUrl)
                  }}
                  onRemove={() => {
                    setLogoDark("")
                    setPreviewDark(null)
                  }}
                  onError={setError}
                />
                <LogoSlot
                  label="Icon — collapsed, light mode"
                  hint="Square mark shown when the sidebar is collapsed on light backgrounds. Falls back to the main logo if empty."
                  icon={Sun}
                  preview={previewIcon}
                  dark={false}
                  square
                  onPick={(dataUrl) => {
                    setLogoIcon(dataUrl)
                    setPreviewIcon(dataUrl)
                  }}
                  onRemove={() => {
                    setLogoIcon("")
                    setPreviewIcon(null)
                  }}
                  onError={setError}
                />
                <LogoSlot
                  label="Icon — collapsed, dark mode"
                  hint="Square mark shown when the sidebar is collapsed in dark mode. Falls back to the light icon if empty."
                  icon={Moon}
                  preview={previewIconDark}
                  dark
                  square
                  onPick={(dataUrl) => {
                    setLogoIconDark(dataUrl)
                    setPreviewIconDark(dataUrl)
                  }}
                  onRemove={() => {
                    setLogoIconDark("")
                    setPreviewIconDark(null)
                  }}
                  onError={setError}
                />
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPEG, WEBP, or SVG. Max 2 MB each.</p>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-3xl">
                <ColorField
                  id="brand-color"
                  label="Brand color"
                  hint="Primary color for the sidebar and buttons."
                  value={brandColor}
                  onChange={setBrandColor}
                />
                <ColorField
                  id="accent-color"
                  label="Accent color"
                  hint="Secondary highlights and hovers."
                  value={accentColor}
                  onChange={setAccentColor}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------- BUSINESS DETAILS -------------------------- */}
        <TabsContent value="details" className="mt-0 flex flex-col gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" aria-hidden="true" />
                Contact
              </CardTitle>
              <CardDescription>These details are visible to the platform administrators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="profile-phone"
                  label="Phone"
                  icon={Phone}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
                <Field
                  id="profile-website"
                  label="Website"
                  icon={Globe}
                  type="url"
                  autoComplete="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-description">Description</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {form.description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <Textarea
                  id="profile-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Tell the platform about your business…"
                  maxLength={DESCRIPTION_MAX}
                  rows={4}
                  className="min-h-24 resize-y"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4" aria-hidden="true" />
                Address
              </CardTitle>
              <CardDescription>Registered business address.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field
                id="profile-addressLine1"
                label="Address"
                type="text"
                autoComplete="address-line1"
                placeholder="123 Market St"
                value={form.addressLine1}
                onChange={(e) => set("addressLine1", e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  id="profile-city"
                  label="City"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="San Francisco"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
                <Field
                  id="profile-state"
                  label="State / Province"
                  type="text"
                  autoComplete="address-level1"
                  placeholder="CA"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
                <Field
                  id="profile-postalCode"
                  label="Postal code"
                  type="text"
                  autoComplete="postal-code"
                  placeholder="94103"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                />
                <div className="flex min-w-0 flex-col gap-2">
                  <Label htmlFor="profile-country">Country</Label>
                  <Select value={form.country || undefined} onValueChange={(v) => set("country", v)}>
                    <SelectTrigger id="profile-country" className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <Button type="submit" disabled={saving || !dirty}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
        {saved ? (
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
