import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"



function defaultBusinessModePayload(seller, user) {
  return {
    parentStoreId: seller.mainStoreId,
    createdBy: user?._id ?? null,
    updatedBy: user?._id ?? null,
  }
}

export async function getBusinessMode({ seller, tenantDbName, user }) {
  const { BusinessMode } = getTenantModels(tenantDbName)

  let doc = await BusinessMode.findOne({ parentStoreId: seller.mainStoreId })
  if (!doc) {
    doc = await BusinessMode.create(defaultBusinessModePayload(seller, user))
  }
  return doc.toObject()
}




export async function updateBusinessModeDoc({ seller, tenantDbName, user, body, req }) {
  const { BusinessMode } = getTenantModels(tenantDbName)

  let doc = await BusinessMode.findOne({ parentStoreId: seller.mainStoreId })
  if (!doc) {
    doc = await BusinessMode.create(defaultBusinessModePayload(seller, user))
  }

  const before = { mode: doc.mode, isActive: doc.isActive }

  const { b2bSettings, b2cSettings, ...rest } = body

  if (b2bSettings) {
    doc.b2bSettings = { ...(doc.b2bSettings?.toObject?.() ?? doc.b2bSettings ?? {}), ...b2bSettings }
  }
  if (b2cSettings) {
    doc.b2cSettings = { ...(doc.b2cSettings?.toObject?.() ?? doc.b2cSettings ?? {}), ...b2cSettings }
  }

  for (const [key, value] of Object.entries(rest)) {
    doc[key] = value
  }
  doc.updatedBy = user._id

  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.businessMode.updated",
    targetType: "BusinessMode",
    targetId: doc._id,
    before,
    after: { mode: doc.mode, isActive: doc.isActive },
  })

  return doc.toObject()
}