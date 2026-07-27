import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createStoreVariantDoc,
  deleteStoreVariantDoc,
  destroyStoreVariantDoc,
  getStoreVariant,
  listStoreVariants,
  restoreStoreVariantDoc,
  updateStoreVariantDoc,
} from "./storevariant.service.js"
import { listStoreVariantsQuerySchema } from "./storevariant.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listStoreVariantsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listStoreVariants({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const variant = await getStoreVariant({ ...ctx(req), id: req.params.id })
  res.json({ variant })
})

export const create = asyncHandler(async (req, res) => {
  const variant = await createStoreVariantDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ variant })
})

export const update = asyncHandler(async (req, res) => {
  const variant = await updateStoreVariantDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ variant })
})

export const remove = asyncHandler(async (req, res) => {
  // ?permanent=true hard-deletes a variant that is already in the trash.
  const fn = req.query.permanent === "true" ? destroyStoreVariantDoc : deleteStoreVariantDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const variant = await restoreStoreVariantDoc({ ...ctx(req), id: req.params.id })
  res.json({ variant })
})
