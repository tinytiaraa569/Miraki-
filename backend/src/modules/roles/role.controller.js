import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createRoleDoc,
  deleteRoleDoc,
  destroyRoleDoc,
  getRole,
  listRoles,
  restoreRoleDoc,
  updateRoleDoc,
} from "./role.service.js"
import { listRolesQuerySchema } from "./role.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listRolesQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listRoles({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const role = await getRole({ ...ctx(req), id: req.params.id })
  res.json({ role })
})

export const create = asyncHandler(async (req, res) => {
  const role = await createRoleDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ role })
})

export const update = asyncHandler(async (req, res) => {
  const role = await updateRoleDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ role })
})

export const remove = asyncHandler(async (req, res) => {
  // ?permanent=true hard-deletes a role that is already in the trash.
  const fn = req.query.permanent === "true" ? destroyRoleDoc : deleteRoleDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const role = await restoreRoleDoc({ ...ctx(req), id: req.params.id })
  res.json({ role })
})