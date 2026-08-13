import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  bulkDeletePermissionDocs,
  createPermissionDoc,
  deletePermissionDoc,
  getPermission,
  listGroupedPermissions,
  listPermissionKeys,
  listPermissions,
  reseedDefaultPermissions,
  updatePermissionDoc,
} from "./permission.service.js"

// Query parsing/validation for list= listPermissionsQuerySchema

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const data = await listPermissions({ ...ctx(req), query: req.query })
  res.json(data)
})

// Grouped + category-paginated view for the hub permissions page.
export const listGrouped = asyncHandler(async (req, res) => {
  const data = await listGroupedPermissions({ ...ctx(req), query: req.query })
  res.json(data)
})

// All existing permission keys for this seller (used by the add-permissions sheet).
export const listKeys = asyncHandler(async (req, res) => {
  const data = await listPermissionKeys(ctx(req))
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const permission = await getPermission({ ...ctx(req), id: req.params.id })
  res.json({ permission })
})

export const create = asyncHandler(async (req, res) => {
  const permission = await createPermissionDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ permission })
})

export const update = asyncHandler(async (req, res) => {
  const permission = await updatePermissionDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ permission })
})

export const remove = asyncHandler(async (req, res) => {
  const result = await deletePermissionDoc({ ...ctx(req), id: req.params.id })
  res.json(result)
})


export const bulkRemove = asyncHandler(async (req, res) => {
  const result = await bulkDeletePermissionDocs({ ...ctx(req), ids: req.body.ids })
  res.json(result)
})

// Reseed the seller's tenant DB with any missing default (sidebar) permissions.
export const reseed = asyncHandler(async (req, res) => {
  const result = await reseedDefaultPermissions(ctx(req))
  res.json(result)
})