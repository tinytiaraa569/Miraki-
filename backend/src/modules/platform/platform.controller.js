import { env } from "../../config/env.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createSellerWithMainStore,
  createSuperadmin,
  getSellerDetails,
  getSellerStats,
  hardDeleteSeller,
  listAuditLogs,
  listSellers,
  listSuperadmins,
  restoreSeller,
  setSellerStatus,
  setSuperadminStatus,
  setSuperadminTwoFactor,
  softDeleteSeller,
  updateSeller,
} from "./platform.service.js"

const toSuperadminDTO = (u) => ({
  id: u._id,
  name: u.name || "",
  email: u.email,
  status: u.status,
  isOriginal: Boolean(u.isOriginal),
  totpEnabled: Boolean(u.totpEnabled),
  twoFactorRequired: Boolean(u.twoFactorRequired),
  createdAt: u.createdAt,
})

export const createSeller = asyncHandler(async (req, res) => {
  const { businessName, ownerEmail, multistoreEnabled } = req.body
  const result = await createSellerWithMainStore({
    businessName,
    ownerEmail,
    multistoreEnabled,
    actor: req.user,
    req,
  })

  res.status(201).json({
    seller: {
      id: result.seller._id,
      businessName: result.seller.businessName,
      slug: result.seller.slug,
      ownerEmail: result.seller.ownerEmail,
      status: result.seller.status,
      multistoreEnabled: result.seller.multistoreEnabled,
      mainStoreId: result.seller.mainStoreId,
      createdAt: result.seller.createdAt,
    },
    // Dev-only convenience: in production this is emailed, never returned.
    ...(env.NODE_ENV !== "production" ? { inviteToken: result.inviteToken } : {}),
  })
})

export const getSellers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 20))
  const status = ["active", "suspended"].includes(req.query.status) ? req.query.status : undefined
  const deleted = req.query.deleted === "true"
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 120) : undefined
  res.json(await listSellers({ page, limit, status, deleted, q: q || undefined }))
})

export const getStats = asyncHandler(async (_req, res) => {
  res.json(await getSellerStats())
})

// Detail view for the seller-details modal: registry row (incl. business
// profile + logo URL) plus live tenant stores and user count.
export const getSellerById = asyncHandler(async (req, res) => {
  const { seller, stores, userCount } = await getSellerDetails({ sellerId: req.params.id })
  res.json({
    seller: {
      id: seller._id,
      businessName: seller.businessName,
      slug: seller.slug,
      dbName: seller.dbName,
      ownerEmail: seller.ownerEmail,
      status: seller.status,
      multistoreEnabled: seller.multistoreEnabled,
      mainStoreId: seller.mainStoreId,
      profile: seller.profile ?? {},
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt,
      deletedAt: seller.deletedAt ?? null,
    },
    stores: stores.map((s) => ({
      id: s._id,
      name: s.name,
      type: s.type,
      isDeletable: s.isDeletable,
      createdAt: s.createdAt,
    })),
    userCount,
  })
})

export const patchSeller = asyncHandler(async (req, res) => {
  const seller = await updateSeller({
    sellerId: req.params.id,
    updates: req.body,
    actor: req.user,
    req,
  })
  res.json({
    seller: {
      id: seller._id,
      businessName: seller.businessName,
      slug: seller.slug,
      ownerEmail: seller.ownerEmail,
      status: seller.status,
      multistoreEnabled: seller.multistoreEnabled,
    },
  })
})

export const deleteSeller = asyncHandler(async (req, res) => {
  const seller = await softDeleteSeller({ sellerId: req.params.id, actor: req.user, req })
  res.json({ seller: { id: seller._id, deletedAt: seller.deletedAt } })
})

export const postRestoreSeller = asyncHandler(async (req, res) => {
  const seller = await restoreSeller({ sellerId: req.params.id, actor: req.user, req })
  res.json({ seller: { id: seller._id, deletedAt: null } })
})

export const deleteSellerPermanent = asyncHandler(async (req, res) => {
  await hardDeleteSeller({ sellerId: req.params.id, actor: req.user, req })
  res.json({ ok: true })
})

export const patchSellerStatus = asyncHandler(async (req, res) => {
  const seller = await setSellerStatus({
    sellerId: req.params.id,
    status: req.body.status,
    actor: req.user,
    req,
  })
  res.json({ seller: { id: seller._id, status: seller.status } })
})

export const getSuperadmins = asyncHandler(async (req, res) => {
  const { items, total } = await listSuperadmins()
  res.json({
    items: items.map(toSuperadminDTO),
    total,
    selfId: String(req.user._id),
  })
})

export const postSuperadmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  const user = await createSuperadmin({ name, email, password, actor: req.user, req })
  res.status(201).json({ superadmin: toSuperadminDTO(user) })
})

export const patchSuperadminStatus = asyncHandler(async (req, res) => {
  const user = await setSuperadminStatus({
    targetId: req.params.id,
    status: req.body.status,
    actor: req.user,
    req,
  })
  res.json({ superadmin: toSuperadminDTO(user) })
})

export const patchSuperadminTwoFactor = asyncHandler(async (req, res) => {
  const user = await setSuperadminTwoFactor({
    targetId: req.params.id,
    required: req.body.required,
    actor: req.user,
    req,
  })
  res.json({ superadmin: toSuperadminDTO(user) })
})

export const getAudit = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 30))
  res.json(
    await listAuditLogs({
      page,
      limit,
      sellerId: req.query.sellerId || undefined,
      action: req.query.action || undefined,
    }),
  )
})
