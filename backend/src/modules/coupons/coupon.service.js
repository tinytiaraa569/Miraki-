import mongoose from "mongoose";
import { getTenantModels } from "../../config/tenantDb.js";
import { ApiError } from "../../utils/apiError.js";
import { audit } from "../audit/audit.service.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  code: { code: 1 },
  "-code": { code: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
  endDate: { endDate: 1 },
  "-endDate": { endDate: -1 },
};

const LIST_PROJECT = {
  code: 1,
  name: 1,
  enabled: 1,
  isPrivate: 1,
  discountType: 1,
  amount: 1,
  startDate: 1,
  endDate: 1,
  maxUsage: 1,
  maxUsagePerUser: 1,
  currentUsage: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
};

export async function listCoupons({ seller, tenantDbName, query }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const sort = SORTS[query.sort ?? "-createdAt"];

  const match = {
    sellerId: seller._id,
    deletedAt: query.deleted ? { $ne: null } : null,
  };
  if (query.q) match.code = { $regex: escapeRegex(query.q), $options: "i" };
  if (typeof query.enabled === "boolean") match.enabled = query.enabled;
  if (typeof query.isPrivate === "boolean") match.isPrivate = query.isPrivate;

  const [result] = await Coupon.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        rows: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: LIST_PROJECT }],
        total: [{ $count: "n" }],
      },
    },
  ]);

  return { rows: result?.rows ?? [], total: result?.total?.[0]?.n ?? 0, page, limit };
}

export async function getCoupon({ seller, tenantDbName, id }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, deletedAt: null }).lean();
  if (!doc) throw new ApiError(404, "Coupon not found");
  return doc;
}

export async function listCouponUsage({ seller, tenantDbName, id, query }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;

  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id }).select("usageByUser currentUsage").lean();
  if (!doc) throw new ApiError(404, "Coupon not found");

  let rows = doc.usageByUser ?? [];
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    rows = rows.filter((u) => rx.test(u.email ?? ""));
  }
  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, (page - 1) * limit + limit);

  return { rows: paged, total, page, limit, currentUsage: doc.currentUsage ?? 0 };
}

function assertConsistentCouponState(data) {
  if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    throw new ApiError(400, "endDate must be after startDate");
  }
  if (data.discountType === "percentage" && data.amount > 100) {
    throw new ApiError(400, "Percentage discount cannot exceed 100");
  }
  if (data.maxDiscount != null && data.discountType !== "percentage") {
    throw new ApiError(400, "maxDiscount is only applicable to percentage discount coupons");
  }
}

export async function createCouponDoc({ seller, tenantDbName, user, body, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  assertConsistentCouponState(body);

  let doc;
  try {
    doc = await Coupon.create({
      ...body,
      mainStoreId: body.mainStoreId ?? seller.mainStoreId,
      sellerId: seller._id,
      createdBy: user._id,
      updatedBy: user._id,
    });
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, "A coupon with this code already exists for this seller");
    throw err;
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.created",
    targetType: "Coupon",
    targetId: doc._id,
    after: { code: doc.code, enabled: doc.enabled },
  });

  return doc.toObject();
}

export async function updateCouponDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id });
  if (!doc) throw new ApiError(404, "Coupon not found");

  const before = { code: doc.code, enabled: doc.enabled };

  for (const [key, value] of Object.entries(body)) doc[key] = value;
  doc.updatedBy = user._id;

  assertConsistentCouponState({
    startDate: doc.startDate,
    endDate: doc.endDate,
    discountType: doc.discountType,
    amount: doc.amount,
    maxDiscount: doc.maxDiscount,
  });

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, "A coupon with this code already exists for this seller");
    throw err;
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.updated",
    targetType: "Coupon",
    targetId: doc._id,
    before,
    after: { code: doc.code, enabled: doc.enabled },
  });

  return doc.toObject();
}

export async function toggleCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, deletedAt: null });
  if (!doc) throw new ApiError(404, "Coupon not found");

  doc.enabled = !doc.enabled;
  doc.updatedBy = user._id;
  await doc.save();

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.toggled",
    targetType: "Coupon",
    targetId: doc._id,
    after: { enabled: doc.enabled },
  });

  return { ok: true, id: doc._id, enabled: doc.enabled };
}

export async function duplicateCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const original = await Coupon.findOne({ _id: id, sellerId: seller._id }).lean();
  if (!original) throw new ApiError(404, "Coupon not found");

  const { _id, createdAt, updatedAt, currentUsage, usageByUser, ...rest } = original;

  let copy;
  let suffix = 1;
  while (!copy) {
    const code = `${rest.code}-COPY${suffix > 1 ? suffix : ""}`;
    try {
      copy = await Coupon.create({
        ...rest,
        code,
        currentUsage: 0,
        usageByUser: [],
        createdBy: user._id,
        updatedBy: user._id,
      });
    } catch (err) {
      if (err?.code === 11000 && suffix < 20) {
        suffix += 1;
        continue;
      }
      throw err;
    }
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.duplicated",
    targetType: "Coupon",
    targetId: copy._id,
    after: { code: copy.code, sourceId: id },
  });

  return copy.toObject();
}

// SOFT DELETE
export async function deleteCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, deletedAt: null });
  if (!doc) throw new ApiError(404, "Coupon not found");

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.deletedBy = user._id;
  doc.updatedBy = user._id;
  await doc.save();

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.deleted",
    targetType: "Coupon",
    targetId: doc._id,
    before: { code: doc.code },
    after: { isDeleted: true },
  });

  return { ok: true, id: doc._id, isDeleted: true };
}

export async function bulkDeleteCouponDoc({ seller, tenantDbName, user, ids, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const objectIds = ids.map((id) => oid(id));

  const result = await Coupon.updateMany(
    { _id: { $in: objectIds }, sellerId: seller._id, deletedAt: null },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: user._id, updatedBy: user._id } },
  );

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.bulk_deleted",
    targetType: "Coupon",
    targetId: null,
    after: { ids, matched: result.matchedCount, modified: result.modifiedCount },
  });

  return { success: true, message: `${result.modifiedCount} coupon(s) deleted`, deleted: result.modifiedCount };
}

// RESTORE
export async function restoreCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, deletedAt: { $ne: null } });
  if (!doc) throw new ApiError(404, "Deleted coupon not found");

  doc.isDeleted = false;
  doc.deletedAt = null;
  doc.deletedBy = null;
  doc.updatedBy = user._id;

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, "Cannot restore — another active coupon already uses this code");
    throw err;
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.restored",
    targetType: "Coupon",
    targetId: doc._id,
    after: { code: doc.code },
  });

  return doc.toObject();
}

// PERMANENT DESTROY
export async function destroyCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, deletedAt: { $ne: null } });
  if (!doc) throw new ApiError(404, "Deleted coupon not found — soft delete it first");

  await doc.deleteOne();

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.coupon.destroyed",
    targetType: "Coupon",
    targetId: doc._id,
    before: { code: doc.code },
  });

  return { ok: true, id: doc._id, destroyed: true };
}

const ENTITY_CONFIG = {
  product: { model: "Product", project: { _id: 1, name: 1, alias: 1, sku: 1, images: 1 }, search: ["name", "alias", "sku"] },
  category: { model: "Category", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  collection: { model: "Collection", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  brand: { model: "Brand", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  substores: { model: "Substore", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
}

export async function listEntityOptions({ seller, tenantDbName, entity, query }) {
  const cfg = ENTITY_CONFIG[entity];
  if (!cfg) throw new ApiError(404, "Unknown option type");

  const Model = getTenantModels(tenantDbName)[cfg.model];
  if (!Model) throw new ApiError(404, "Unknown option type");
  const parentStoreId = oid(seller.mainStoreId);

  if (query.ids?.length) {
    const rows = await Model.aggregate([
      { $match: { parentStoreId, _id: { $in: query.ids.map((id) => oid(id)) } } },
      { $sort: { name: 1 } },
      { $project: cfg.project },
    ]);
    return { rows, total: rows.length, page: 1, limit: rows.length };
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const match = { parentStoreId, deletedAt: null };
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" };
    match.$or = cfg.search.map((f) => ({ [f]: rx }));
  }

  const [result] = await Model.aggregate([
    { $match: match },
    {
      $facet: {
        rows: [{ $sort: { name: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: cfg.project }],
        total: [{ $count: "n" }],
      },
    },
  ]);

  return { rows: result?.rows ?? [], total: result?.total?.[0]?.n ?? 0, page, limit };
}

function itemMatchesIds(item, type, idSet) {
  const ids =
    type === "product"
      ? item.productId ? [item.productId] : []
      : type === "category"
        ? item.categoryIds
        : type === "collection"
          ? item.collectionIds
          : item.brandId
            ? [item.brandId]
            : [];
  return (ids || []).some((id) => idSet.has(String(id)));
}

function compareNumber(actual, operator, expected) {
  switch (operator) {
    case "equals":
      return actual === expected;
    case "greaterThan":
      return actual > expected;
    case "lessThan":
      return actual < expected;
    default:
      return false;
  }
}

// function evaluateCondition(cond, { cartTotal, items }) {
//   if (cond.field === "cart_total") {
//     return compareNumber(cartTotal ?? 0, cond.operator, Number(cond.values[0]?.name));
//   }
//   if (cond.field === "cart_item_count" || cond.field === "product_quantity") {
//     const count = (items || []).reduce((sum, it) => sum + (it.quantity ?? 1), 0);
//     return compareNumber(count, cond.operator, Number(cond.values[0]?.name));
//   }
//   const idSet = new Set(cond.values.map((v) => String(v.id)));
//   const hasMatch = (items || []).some((item) => itemMatchesIds(item, cond.field, idSet));
//   if (cond.operator === "notContains" || cond.operator === "notEquals") return !hasMatch;
//   return hasMatch; // contains / equals
// }

function evaluateCondition(cond, { cartTotal, items }) {
  if (cond.field === "cart_total") {
    return compareNumber(cartTotal ?? 0, cond.operator, Number(cond.values[0]?.name));
  }
  if (cond.field === "cart_item_count") {
    const count = (items || []).reduce((sum, it) => sum + (it.quantity ?? 1), 0);
    return compareNumber(count, cond.operator, Number(cond.values[0]?.name));
  }
  // if (cond.field === "product_quantity") {
  //   return (cond.values || []).every((v) => {
  //     const productQty = (items || [])
  //       .filter((item) => String(item.productId) === String(v.id))
  //       .reduce((sum, it) => sum + (it.quantity ?? 1), 0);
  //     return compareNumber(productQty, cond.operator, Number(v.name));
  //   });
  // }
  if (cond.field === "product_quantity") {
  const threshold = Number(cond.values[0]?.name);
  return (items || []).some((it) => compareNumber(it.quantity ?? 1, cond.operator, threshold));
}
  const idSet = new Set(cond.values.map((v) => String(v.id)));
  const hasMatch = (items || []).some((item) => itemMatchesIds(item, cond.field, idSet));
  if (cond.operator === "notContains" || cond.operator === "notEquals") return !hasMatch;
  return hasMatch;
}

function isItemScopedField(field) {
  return ["product", "category", "collection", "brand", "product_quantity"].includes(field);
}

function getMatchingItems(cond, items) {
  if (cond.field === "product_quantity") {
    const threshold = Number(cond.values[0]?.name);
    return (items || []).filter((item) => compareNumber(item.quantity ?? 1, cond.operator, threshold));
  }
  const idSet = new Set(cond.values.map((v) => String(v.id)));
  const matches = (items || []).filter((item) => itemMatchesIds(item, cond.field, idSet));
  if (cond.operator === "notContains" || cond.operator === "notEquals") {
    const matchedIds = new Set(matches.map((i) => i.productId));
    return (items || []).filter((item) => !matchedIds.has(item.productId));
  }
  return matches;
}

function getEligibleItems(conditions, items) {
  const itemConditions = (conditions || []).filter((c) => isItemScopedField(c.field));
  if (itemConditions.length === 0) {
    return { eligibleItems: items || [], hasItemScope: false };
  }
  let eligible = items || [];
  for (const cond of itemConditions) {
    const matchedIds = new Set(getMatchingItems(cond, items).map((i) => i.productId));
    eligible = eligible.filter((item) => matchedIds.has(item.productId));
  }
  return { eligibleItems: eligible, hasItemScope: true };
}

function computeDiscount(coupon, applicableSubtotal) {
  let discount =
    coupon.discountType === "percentage"
      ? (applicableSubtotal * coupon.amount) / 100
      : coupon.amount;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, applicableSubtotal ?? 0);
  return discount;
}

export async function previewCouponForCart({ sellerId, tenantDbName, code, substoreId, userId, cartTotal, items }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const coupon = await Coupon.findOne({
    code: String(code || "").trim().toUpperCase(),
    sellerId: sellerId,
    deletedAt: null,
  }).lean();
  if (!coupon) throw new ApiError(404, "Invalid coupon code");

  if (!coupon.enabled) throw new ApiError(400, "This coupon is not active");

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) throw new ApiError(400, "This coupon is not valid yet");
  if (coupon.endDate && now > coupon.endDate) throw new ApiError(400, "This coupon has expired");

  if (substoreId !== undefined && coupon.substoreIds?.length) {
    if (!coupon.substoreIds.map(String).includes(String(substoreId))) {
      throw new ApiError(400, "This coupon is not valid for this store");
    }
  }

  if (coupon.minOrderAmount != null && (cartTotal ?? 0) < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `A minimum order amount of ${coupon.minOrderAmount} is required to use this coupon`,
    );
  }

  if (coupon.maxUsage != null && coupon.currentUsage >= coupon.maxUsage) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  if (userId && coupon.maxUsagePerUser != null) {
    const entry = coupon.usageByUser.find((u) => String(u.userId) === String(userId));
    if ((entry?.count ?? 0) >= coupon.maxUsagePerUser) {
      throw new ApiError(400, "You've already used this coupon the maximum number of times");
    }
  }

  const cartLevelConditions = (coupon.conditions || []).filter(
    (c) => c.field === "cart_total" || c.field === "cart_item_count" || c.field === "product_quantity",
  );
  const cartGatesOk = cartLevelConditions.every((cond) => evaluateCondition(cond, { cartTotal, items }));
  if (!cartGatesOk) {
    throw new ApiError(400, "Your cart doesn't meet the conditions for this coupon");
  }

  const { eligibleItems, hasItemScope } = getEligibleItems(coupon.conditions, items);
  if (hasItemScope && eligibleItems.length === 0) {
    throw new ApiError(400, "No items in your cart qualify for this coupon");
  }

  const applicableSubtotal = hasItemScope
    ? eligibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : (cartTotal ?? 0);

  const discountAmount = computeDiscount(coupon, applicableSubtotal);

  return {
    discountAmount,
    coupon: { code: coupon.code, discountType: coupon.discountType },
    applicableInfo: {
      allItemsEligible: !hasItemScope || eligibleItems.length === (items || []).length,
      eligibleItemsCount: eligibleItems.length,
      totalItemsCount: (items || []).length,
      applicableSubtotal,
      eligibleProductIds: eligibleItems.map((i) => i.productId),
    },
  };
}

export async function redeemCouponDoc({ seller, tenantDbName, body }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const { code, userId, cartTotal, items, substoreId } = body;

const result = await previewCouponForCart({ sellerId: seller._id, tenantDbName, code, substoreId, userId, cartTotal, items });
  const coupon = await Coupon.findOne({
    code: String(code).trim().toUpperCase(),
    sellerId: seller._id,
    deletedAt: null,
  }).lean();

  const usageLimitFilter = coupon.maxUsage != null ? { currentUsage: { $lt: coupon.maxUsage } } : {};
  if (userId) {
    const incremented = await Coupon.updateOne(
      {
        _id: coupon._id,
        "usageByUser.userId": oid(userId),
        ...usageLimitFilter,
        ...(coupon.maxUsagePerUser != null ? { "usageByUser.count": { $lt: coupon.maxUsagePerUser } } : {}),
      },
      { $inc: { "usageByUser.$.count": 1, currentUsage: 1 } },
    );
    if (incremented.matchedCount === 0) {
      const pushed = await Coupon.updateOne(
        { _id: coupon._id, "usageByUser.userId": { $ne: oid(userId) }, ...usageLimitFilter },
        { $push: { usageByUser: { userId: oid(userId), count: 1 } }, $inc: { currentUsage: 1 } },
      );
      if (pushed.matchedCount === 0) {
        throw new ApiError(409, "Coupon could not be applied — usage limit may have just been reached");
      }
    }
  } else {
    const inc = await Coupon.updateOne({ _id: coupon._id, ...usageLimitFilter }, { $inc: { currentUsage: 1 } });
    if (inc.matchedCount === 0) {
      throw new ApiError(409, "Coupon could not be applied — usage limit may have just been reached");
    }
  }

  return result;
}