"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"

/**
 * Live storefront catalog for the browsable grid. Country is resolved
 * server-side (geo header / cookie), so the client just hits the public feed.
 * Image paths are resolved to absolute srcs via imgUrl so stored
 * "/uploads/..." paths render across origins.
 */
export function useStorefrontProducts() {
  const { data, isLoading, error } = useSWR("/storefront/get-allproducts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  const products = (data?.products ?? []).map((p) => ({
    ...p,
    image: imgUrl(p.image),
    mainImg: imgUrl(p.mainImg),
    images: (p.images ?? []).map((u) => imgUrl(u)),
  }))

  return { products, isLoading, error }
}

/**
 * Full detail for one product — ALWAYS addressed by product _id, never by alias.
 * The browser URL stays the pretty /product/:alias.
 *
 * - Card navigation: `id` is passed in → single fetch get-allproducts/<id>.
 * - Direct visit/refresh: no `id` → resolve the alias to an _id ONCE
 *   (resolve-product/<alias>), then fetch detail by that _id. The detail SWR
 *   stays null until the id lands, so the catalog feed is never touched and the
 *   detail request is always id-based.
 */
export function useStorefrontProduct(alias, id) {
  // Step 1 (only when we don't already have an id): alias → _id.
  const needsResolve = !id && Boolean(alias)
  const { data: resolved, error: resolveError } = useSWR(
    needsResolve ? `/storefront/resolve-product/${encodeURIComponent(alias)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  // Step 2: fetch detail by _id (either the passed-in id, or the resolved one).
  const productId = id || resolved?.id || null
  const key = productId ? `/storefront/get-allproducts/${encodeURIComponent(productId)}` : null
  const { data, isLoading: detailLoading, error: detailError } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })

  // Loading while resolving the id, or while the detail is in flight.
  const isLoading = (needsResolve && !resolved && !resolveError) || (Boolean(key) && detailLoading)
  const error = resolveError || detailError

  const product = data?.product
    ? {
        ...data.product,
        image: imgUrl(data.product.image),
        mainImg: imgUrl(data.product.mainImg),
        images: (data.product.images ?? []).map((img) => ({ ...img, url: imgUrl(img.url) })),
        options: (data.product.options ?? []).map((o) => ({
          ...o,
          values: (o.values ?? []).map((v) => ({ ...v, image: imgUrl(v.image) })),
        })),
        // Compact variants list (each: { id, key, options, price, comparePrice, hasImage }).
        // Carries no image URLs, so it needs no imgUrl resolution here.
        variants: data.product.variants ?? [],
      }
    : null

  return { product, isLoading, error }
}

/**
 * Lazy image gallery for ONE selected variant, fetched by its _id (from the
 * product's variant index). Only called when the selected combo actually owns
 * images. The response carries images ONLY — never a price — so it cannot be
 * used to influence the charged amount. `keepPreviousData` avoids a flash while
 * switching, and SWR de-dupes/caches per variant id.
 */
export function useStorefrontVariantMedia(alias, variantId) {
  const shouldFetch = Boolean(alias && variantId)
  const { data, isLoading, isValidating } = useSWR(
    shouldFetch
      ? `/storefront/get-allproducts/${encodeURIComponent(alias)}/variant-media?id=${encodeURIComponent(variantId)}`
      : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const images = (data?.images ?? []).map((img) => ({ ...img, url: imgUrl(img.url) }))

  return { images, isLoading: shouldFetch && (isLoading || isValidating) }
}
