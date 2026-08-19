import { Router } from "express";
import {
  resolveStorefront,
  resolveSubstore,
  listPublicSubstores,
  resolveStorefrontProductId,
  listCanvasIds,
  listStorefrontProducts,
  getStorefrontProduct,
  getStorefrontVariantMedia,
  applyStorefrontCoupon,
} from "./storefront.service.js";
import { applyCouponSchema } from "../coupons/coupon.validation.js";

// PUBLIC, read-only storefront resolver — no auth, safe by construction:
// it only ever returns whitelisted substore fields + a static canvas JSON.
export const storefrontRoutes = Router();

/**
 * Country detection priority: explicit ?country override → remembered
 * `sf_country` cookie → CDN geo headers. Reading the cookie is what lets the
 * shopper's chosen store flow to EVERY endpoint (detail, variant-media, feed)
 * without threading a query param onto each request — the browser sends the
 * cookie automatically, so option/value scoping matches the picked substore.
 */
function detectCountry(req) {
  const q = String(req.query.country || "").toUpperCase();
  if (/^[A-Z]{2}$/.test(q)) return q;

  const cookie = String(req.headers.cookie || "").match(
    /(?:^|;\s*)sf_country=([A-Za-z]{2})/,
  );
  if (cookie) return cookie[1].toUpperCase();

  const header =
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-country-code"] ||
    "";
  const h = String(header).toUpperCase();
  return /^[A-Z]{2}$/.test(h) ? h : null;
}

storefrontRoutes.get("/resolve", async (req, res, next) => {
  try {
    const payload = await resolveStorefront(detectCountry(req));
    // Browser/CDN caching: fresh for 60s, serve-stale while revalidating 5min.
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// FAST substore-only resolver. Returns JUST the matched substore for the
// visitor's country (no canvas, no products) so the client/other endpoints can
// cheaply learn which store + currency applies before scoping product/category
// calls. Same country-detection + caching contract as /resolve.
storefrontRoutes.get("/substore", async (req, res, next) => {
  try {
    const payload = await resolveSubstore(detectCountry(req));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// FAST list of all active substores for the navbar country/region dropdown.
// Country-independent, so it's cacheable for everyone and needs no `Vary`.
storefrontRoutes.get("/substores", async (_req, res, next) => {
  try {
    const payload = await listPublicSubstores();
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Public, read-only product feed for the browsable grid (published + approved,
// scoped to the resolved substore). Facets are derived server-side.
storefrontRoutes.get("/get-allproducts", async (req, res, next) => {
  try {
    const payload = await listStorefrontProducts(detectCountry(req));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Public: validate + preview a coupon code for the current cart. 
storefrontRoutes.post("/coupons/apply", async (req, res, next) => {
  try {
    const parsed = applyCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || "Invalid request" });
    }

    const payload = await applyStorefrontCoupon({
      code: parsed.data.code,
      cartTotal: parsed.data.cartTotal,
      userId: parsed.data.userId,
      items: parsed.data.items,
      countryCode: detectCountry(req),
    });
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Lazy variant media: fetch ONE variant's own image gallery by _id (taken from
// the variant index shipped with the product). Called only when a selected combo
// actually owns images. Returns images only — never a price — so it cannot be
// used to influence what a shopper is charged.
storefrontRoutes.get(
  "/get-allproducts/:alias/variant-media",
  async (req, res, next) => {
    try {
      const payload = await getStorefrontVariantMedia(
        req.params.alias,
        req.query.id,
        detectCountry(req),
      );
      if (!payload) return res.status(404).json({ error: "Product not found" });
      res.set(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=600",
      );
      res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
      res.json(payload);
    } catch (err) {
      next(err);
    }
  },
);

// Cheap alias → _id resolver. On a direct visit/refresh the client has only the
// alias; it calls this once to get the _id, then fetches detail by _id. Returns
// just { id } so it stays a tiny lookup.
storefrontRoutes.get("/resolve-product/:alias", async (req, res, next) => {
  try {
    const payload = await resolveStorefrontProductId(
      req.params.alias,
      detectCountry(req),
    );
    if (!payload) return res.status(404).json({ error: "Product not found" });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Full product detail for the product page. The path segment may be either a
// product _id (preferred, sent by the client when known) or an alias — the
// service resolves by _id when the segment is a valid ObjectId, else by alias.
storefrontRoutes.get("/get-allproducts/:idOrAlias", async (req, res, next) => {
  try {
    const seg = req.params.idOrAlias;
    const payload = await getStorefrontProduct(
      { alias: seg, id: seg },
      detectCountry(req),
    );
    if (!payload) return res.status(404).json({ error: "Product not found" });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.set("Vary", "Cookie, x-vercel-ip-country, cf-ipcountry");
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// Handy for hub testing: which canvas IDs exist on disk.
storefrontRoutes.get("/canvases", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({ canvasIds: listCanvasIds() });
});
