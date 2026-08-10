"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EditorField } from "./editor-field"

/**
 * SEO tab (plan C.10). Binds to `draft.seo` + `draft.sitemap`.
 */
const FREQUENCIES = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]

export function SeoTab({ draft, setField }) {
  const seo = draft.seo ?? {}
  const sitemap = draft.sitemap ?? {}
  const [kw, setKw] = useState("")
  const keywords = seo.keywords ?? []

  function addKeyword(e) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    const v = kw.trim()
    if (v && !keywords.includes(v)) setField("seo.keywords", [...keywords, v])
    setKw("")
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <EditorField label="Title" htmlFor="seo-title">
        <Input
          id="seo-title"
          value={seo.title ?? ""}
          onChange={(e) => setField("seo.title", e.target.value)}
          placeholder="Enter SEO title"
        />
      </EditorField>

      <EditorField label="Description" htmlFor="seo-desc">
        <Textarea
          id="seo-desc"
          rows={3}
          value={seo.description ?? ""}
          onChange={(e) => setField("seo.description", e.target.value)}
          placeholder="Enter SEO meta description"
        />
      </EditorField>

      <EditorField label="Keywords" htmlFor="seo-kw" hint="Press Enter to add a keyword.">
        <Input
          id="seo-kw"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={addKeyword}
          placeholder="Add a keyword and press Enter"
        />
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <Badge key={k} variant="secondary" className="gap-1 rounded-md pr-1 font-normal">
                {k}
                <button
                  type="button"
                  onClick={() => setField("seo.keywords", keywords.filter((v) => v !== k))}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${k}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </EditorField>

      <EditorField label="Canonical Url" htmlFor="seo-canonical">
        <Input
          id="seo-canonical"
          value={seo.canonicalUrl ?? ""}
          onChange={(e) => setField("seo.canonicalUrl", e.target.value)}
          placeholder="https://…"
        />
      </EditorField>

      <EditorField label="Sitemap Priority" htmlFor="seo-priority">
        <Input
          id="seo-priority"
          type="number"
          min={0}
          max={1}
          step={0.1}
          className="max-w-xs"
          value={sitemap.priority ?? 0.5}
          onChange={(e) => setField("sitemap.priority", Number(e.target.value))}
        />
      </EditorField>

      <EditorField label="Sitemap Frequency" hint="Default is daily for products">
        <Select value={sitemap.frequency ?? "daily"} onValueChange={(v) => setField("sitemap.frequency", v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EditorField>

      <EditorField label="Disable for bots">
        <Checkbox
          checked={Boolean(sitemap.disableForBots)}
          onCheckedChange={(v) => setField("sitemap.disableForBots", Boolean(v))}
          aria-label="Disable for bots"
        />
      </EditorField>
    </section>
  )
}
