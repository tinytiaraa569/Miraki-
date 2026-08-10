"use client"

import useSWR from "swr"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetcher } from "@/lib/api"
import { EditorField } from "./editor-field"

/**
 * Seller tab (plan C.12, screen 11). This is a single-seller store, so the
 * seller is the tenant itself — `sellerId` is stamped server-side and shown
 * read-only (its name comes from the lean `/seller/branding` payload the hub
 * already caches). Approve is an editable status Select.
 */
const APPROVE = [
  { value: "approved", label: "approved" },
  { value: "pending", label: "pending" },
  { value: "rejected", label: "rejected" },
]

export function SellerTab({ draft, setField }) {
  const { data: branding } = useSWR("/seller/branding", fetcher, { revalidateOnFocus: false })
  const sellerName = branding?.businessName ?? "This store"

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <EditorField label="Seller" required hint="Products belong to this store's seller account.">
        <Input value={sellerName} readOnly className="max-w-md bg-muted/40" aria-label="Seller" />
      </EditorField>

      <EditorField label="Approve">
        <Select value={draft.approve ?? "pending"} onValueChange={(v) => setField("approve", v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVE.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EditorField>
    </section>
  )
}