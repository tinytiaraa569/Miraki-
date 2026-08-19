"use client"

import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ChevronRight, ExternalLink, Loader2, MoreVertical, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { useProductEditor } from "@/components/hub/products/use-product-editor"
import { GeneralTab } from "@/components/hub/products/general-tab"
import { InventoryTab } from "@/components/hub/products/inventory-tab"
import { OptionsVariantsTab } from "@/components/hub/products/options-variants-tab"
import { SeoTab } from "@/components/hub/products/seo-tab"
import { MiscellaneousTab } from "@/components/hub/products/miscellaneous-tab"
import { SellerTab } from "@/components/hub/products/seller-tab"

const TABS = [
  { value: "general", label: "General" },
  { value: "inventory", label: "Inventory" },
  { value: "options", label: "Options & Variants" },
  { value: "seo", label: "SEO" },
  { value: "misc", label: "Miscellaneous" },
  { value: "seller", label: "Seller" },
]

/**
 * Six-tab product editor (create + edit). The page is remounted with a `key`
 * of `edit:<id>` / `create` by the route wrapper so switching products fully
 * resets the draft. Header = breadcrumb + Save / Save & Continue / View
 * Product; overflow menu = Duplicate / Delete. Per plan C.4.
 */
export default function ProductEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editor = useProductEditor(id)
  const {
    isCreate,
    loading,
    draft,
    setField,
    labelCache,
    mergeLabels,
    isDirty,
    saving,
    save,
    mfDefinition,
  } = editor

  const [tab, setTab] = useState("general")

  function validate() {
    if (!draft.name?.trim()) {
      toast.error("Name is required")
      setTab("general")
      return false
    }
    if (draft.price === "" || draft.price === null || Number(draft.price) < 0) {
      toast.error("A valid price is required")
      setTab("general")
      return false
    }
    return true
  }

  async function handleSave({ stay } = {}) {
    if (!validate()) return
    try {
      const result = await save()
      if (result?.warnings?.length) {
        toast.warning(result.warnings.join(" "))
      }
      toast.success("Product saved")
      const newId = result?.product?._id
      if (isCreate && newId) {
        navigate(`/hub/products/${newId}/edit`, { replace: true })
      } else if (!stay) {
        navigate("/hub/products")
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function duplicate() {
    try {
      const { product } = await api.post(`/seller/products/${id}/duplicate`)
      toast.success("Product duplicated")
      if (product?._id) navigate(`/hub/products/${product._id}/edit`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function remove() {
    try {
      await api.delete(`/seller/products/${id}`)
      toast.success("Product deleted")
      navigate("/hub/products")
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const title = draft.name?.trim() || (isCreate ? "New Product" : "Untitled")

  return (
    <div className="flex flex-col gap-5">
      {/* -------------------------------------------------------- header bar */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/hub/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="max-w-[16rem] truncate font-medium text-foreground">{title}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span>{isCreate ? "Create" : "Edit"}</span>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </Button>
          <Button onClick={() => handleSave({ stay: true })} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save &amp; Continue
          </Button>
          <Button
            variant="outline"
            disabled={isCreate || !draft.seo?.canonicalUrl}
            onClick={() => draft.seo?.canonicalUrl && window.open(draft.seo.canonicalUrl, "_blank", "noopener")}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            View Product
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isCreate} aria-label="More actions">
                <MoreVertical className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={duplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={remove}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ------------------------------------------------------------- tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralTab
            draft={draft}
            setField={setField}
            labelCache={labelCache}
            mergeLabels={mergeLabels}
            mfDefinition={mfDefinition}
            mfValues={draft.metafields}
            setMfValues={(v) => setField("metafields", v)}
          />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryTab draft={draft} setField={setField} />
        </TabsContent>
        <TabsContent value="options" className="mt-4">
          <OptionsVariantsTab
            id={id}
            isCreate={isCreate}
            draft={draft}
            setField={setField}
            mergeLabels={mergeLabels}
          />
        </TabsContent>
        <TabsContent value="seo" className="mt-4">
          <SeoTab draft={draft} setField={setField} />
        </TabsContent>
        <TabsContent value="misc" className="mt-4">
          <MiscellaneousTab draft={draft} setField={setField} mergeLabels={mergeLabels} />
        </TabsContent>
        <TabsContent value="seller" className="mt-4">
          <SellerTab draft={draft} setField={setField} labelCache={labelCache} mergeLabels={mergeLabels} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
