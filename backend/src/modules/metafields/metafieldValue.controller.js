import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  deleteRecordValues,
  getRecordValues,
  resolveManyValues,
  saveRecordValues,
} from "./metafieldValue.service.js"
import { saveValuesSchema } from "./metafieldValue.validation.js"

// Per-record metafield VALUES. `module` comes from the path (e.g.
// "ms.categories"); recordId identifies the specific record. All run behind the
// owner-only guard applied in metafield.routes.js.

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

// GET /:module/values/:recordId
export const getValues = asyncHandler(async (req, res) => {
  const result = await getRecordValues({
    ...ctx(req),
    module: req.params.module,
    recordId: req.params.recordId,
  })
  res.json(result)
})

// PUT /:module/values/:recordId  — body: { recordId?, data }
export const putValues = asyncHandler(async (req, res) => {
  // recordId in the path is authoritative; the body only needs `data`. Merge so
  // the shared envelope schema validates both shapes.
  const parsed = saveValuesSchema.safeParse({ recordId: req.params.recordId, data: req.body?.data ?? req.body })
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid values payload")

  const result = await saveRecordValues({
    ...ctx(req),
    module: req.params.module,
    recordId: parsed.data.recordId,
    data: parsed.data.data,
  })
  res.json(result)
})

// DELETE /:module/values/:recordId
export const removeValues = asyncHandler(async (req, res) => {
  const result = await deleteRecordValues({
    ...ctx(req),
    module: req.params.module,
    recordId: req.params.recordId,
  })
  res.json(result)
})

// POST /:module/values:resolve  — body: { recordIds: [...] } → { [id]: {data} }
export const resolveValues = asyncHandler(async (req, res) => {
  const recordIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds : []
  if (recordIds.length > 500) throw new ApiError(400, "Too many recordIds (max 500)")
  const map = await resolveManyValues({ ...ctx(req), module: req.params.module, recordIds })
  res.json({ module: req.params.module, values: map })
})
