import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  attachOptionSet,
  createProductDoc,
  deleteProductDoc,
  destroyProductDoc,
  duplicateProductDoc,
  getProduct,
  importProducts,
  listProductOptions,
  listProducts,
  restoreProductDoc,
  resyncOptions,
  updateProductDoc,
} from "./product.service.js"
import {
  createVariant as createVariantSvc,
  deleteVariant as deleteVariantSvc,
  generateProductVariants,
  listAllVariants,
  listProductVariants,
  updateVariant as updateVariantSvc,
} from "../productvariants/productVariant.service.js"
import {
  attachOptionSetSchema,
  createVariantSchema,
  generateVariantsSchema,
  importProductsSchema,
  listAllVariantsQuerySchema,
  listProductOptionsQuerySchema,
  listProductsQuerySchema,
  updateVariantSchema,
} from "./product.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listProductsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listProducts({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed — only _id/name/alias/price, paginated for lazy dropdowns.
export const options = asyncHandler(async (req, res) => {
  const parsed = listProductOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listProductOptions({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// GET /variants — EVERY variant across all products (Product Variants page).
// Literal path, registered before "/:id" so "variants" isn't read as an id.
export const listAllVariantsController = asyncHandler(async (req, res) => {
  const parsed = listAllVariantsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listAllVariants({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const product = await getProduct({ ...ctx(req), id: req.params.id })
  res.json({ product })
})

export const create = asyncHandler(async (req, res) => {
  const { product, warnings } = await createProductDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ product, warnings })
})

export const update = asyncHandler(async (req, res) => {
  const { product, warnings } = await updateProductDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ product, warnings })
})

export const duplicate = asyncHandler(async (req, res) => {
  const product = await duplicateProductDoc({ ...ctx(req), id: req.params.id })
  res.status(201).json({ product })
})

export const attachOptions = asyncHandler(async (req, res) => {
  const parsed = attachOptionSetSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body")
  const product = await attachOptionSet({ ...ctx(req), id: req.params.id, optionSetId: parsed.data.optionSetId })
  res.json({ product })
})

export const resyncProductOptions = asyncHandler(async (req, res) => {
  const product = await resyncOptions({ ...ctx(req), id: req.params.id })
  res.json({ product })
})

export const generateVariants = asyncHandler(async (req, res) => {
  const parsed = generateVariantsSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body")
  const data = await generateProductVariants({ ...ctx(req), id: req.params.id, ...parsed.data })
  res.json(data)
})

// GET /:id/variants — a product's variant rows (Product variants page).
export const listVariants = asyncHandler(async (req, res) => {
  const data = await listProductVariants({ ...ctx(req), id: req.params.id })
  res.json(data)
})

// POST /:id/variants — add one variant.
export const createVariant = asyncHandler(async (req, res) => {
  const parsed = createVariantSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body")
  const variant = await createVariantSvc({ ...ctx(req), id: req.params.id, body: parsed.data })
  res.status(201).json({ variant })
})

// PATCH /:id/variants/:variantId — edit one variant.
export const updateVariant = asyncHandler(async (req, res) => {
  const parsed = updateVariantSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body")
  const variant = await updateVariantSvc({
    ...ctx(req),
    id: req.params.id,
    variantId: req.params.variantId,
    body: parsed.data,
  })
  res.json({ variant })
})

// DELETE /:id/variants/:variantId — remove one variant.
export const removeVariant = asyncHandler(async (req, res) => {
  const result = await deleteVariantSvc({ ...ctx(req), id: req.params.id, variantId: req.params.variantId })
  res.json(result)
})

export const importCatalog = asyncHandler(async (req, res) => {
  const parsed = importProductsSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body")
  const report = await importProducts({ ...ctx(req), products: parsed.data.products, upsert: parsed.data.upsert })
  res.json({ report })
})

export const restore = asyncHandler(async (req, res) => {
  const product = await restoreProductDoc({ ...ctx(req), id: req.params.id })
  res.json({ product })
})

// DELETE /:id → soft delete. DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyProductDoc : deleteProductDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})
