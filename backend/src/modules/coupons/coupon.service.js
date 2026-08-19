import mongoose from "mongoose";
import { getTenantModels } from "../../config/tenantDb.js";
import { ApiError } from "../../utils/apiError.js";
import { audit } from "../audit/audit.service.js";

const SORTS = {
  code: { code: 1 },
  "-code": { code: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
  endDate: { endDate: 1 },
  "-endDate": { endDate: -1 },
};


export async function listCoupons({ seller, tenantDbName, query }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const sort = SORTS[query.sort] || SORTS.createdAt;

  const match = {
    sellerId: seller._id,
    isDeleted: query.deleted ? true : false,
  };
  if (query.q) {
    match.code = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }
  if (query.status) match.status = query.status;

  const [result] = await Coupon.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "substores",
              localField: "substoreIds",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, alias: 1 } }],
              as: "substores",
            },
          },
          {
            $project: {
              code: 1,
              discountType: 1,
              amount: 1,
              startDate: 1,
              endDate: 1,
              usageLimit: 1,
              usageLimitPerUser: 1,
              usageCount: 1,
              minPurchaseAmount: 1,
              maxDiscountAmount: 1,
              status: 1,
              substores: 1,
              isDeleted: 1,
              deletedAt: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ]);

  return {
    rows: result?.rows ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    limit,
  };
}



export async function listCouponUsage({ seller, tenantDbName, id, query }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;

  const exists = await Coupon.exists({ _id: id, sellerId: seller._id });
  if (!exists) throw new ApiError(404, "Coupon not found");

  const escaped = query.q ? query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : null;

  const resolveAndFilter = [
    { $unwind: "$usageCountPerUser" },
    {
      $lookup: {
        from: "customers",
        localField: "usageCountPerUser.userId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, email: 1 } }],
        as: "customer",
      },
    },
    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: "$usageCountPerUser.userId",
        usageCount: "$usageCountPerUser.count",
        name: "$customer.name",
        email: "$customer.email",
      },
    },
    ...(escaped
      ? [
          {
            $match: {
              $or: [
                { name: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
              ],
            },
          },
        ]
      : []),
  ];

  const [result] = await Coupon.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id), sellerId: seller._id } },
    { $project: { usageCount: 1, usageCountPerUser: 1 } },
    {
      $facet: {
       
        summary: [
          {
            $project: {
              totalRedemptions: "$usageCount",
              uniqueUsers: { $size: { $ifNull: ["$usageCountPerUser", []] } },
            },
          },
        ],
        rows: [...resolveAndFilter, { $sort: { usageCount: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
        total: [...resolveAndFilter, { $count: "n" }],
      },
    },
  ]);

  const summary = result?.summary?.[0] ?? {};

  return {
    rows: result?.rows ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    limit,
    uniqueUsers: summary.uniqueUsers ?? 0,
    totalRedemptions: summary.totalRedemptions ?? 0,
  };
}

export async function getCoupon({ seller, tenantDbName, id }) {
  const { Coupon } = getTenantModels(tenantDbName);
  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id }).lean();
  if (!doc) throw new ApiError(404, "Coupon not found");
  return doc;
}


async function resolveSubstoreIds(Substore, seller, substoreIds) {
  if (!substoreIds || substoreIds.length === 0) return [];

  const found = await Substore.find({
    _id: { $in: substoreIds },
    parentStoreId: seller.mainStoreId,
  })
    .select("_id")
    .lean();

  if (found.length !== substoreIds.length) {
    throw new ApiError(400, "One or more linked substores were not found");
  }

  return found.map((s) => new mongoose.Types.ObjectId(String(s._id)));
}

function assertConsistentCouponState(merged) {
  if (merged.endDate <= merged.startDate) {
    throw new ApiError(400, "endDate must be after startDate");
  }
  if (merged.discountType === "percentage" && merged.amount > 100) {
    throw new ApiError(400, "Percentage discount cannot exceed 100");
  }
  if (merged.maxDiscountAmount != null && merged.discountType !== "percentage") {
    throw new ApiError(400, "maxDiscountAmount is only applicable to percentage discount coupons");
  }
}

export async function createCouponDoc({ seller, tenantDbName, user, body, req }) {
  const { Coupon, Substore } = getTenantModels(tenantDbName);

  const substoreIds = await resolveSubstoreIds(Substore, seller, body.substoreIds);
  assertConsistentCouponState(body);

  let doc;
  try {
    doc = await Coupon.create({
      ...body,
      substoreIds,
      sellerId: seller._id,
      createdBy: user._id,
      updatedBy: user._id,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(409, "A coupon with this code already exists for this seller");
    }
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
    after: { code: doc.code, status: doc.status },
  });

  return doc.toObject();
}

export async function updateCouponDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Coupon, Substore } = getTenantModels(tenantDbName);

  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id });
  if (!doc) throw new ApiError(404, "Coupon not found");

  const before = { code: doc.code, status: doc.status };

  const { substoreIds, ...rest } = body;

  if (substoreIds) {
    doc.substoreIds = await resolveSubstoreIds(Substore, seller, substoreIds);
  }
  for (const [key, value] of Object.entries(rest)) doc[key] = value;
  doc.updatedBy = user._id;

 
  assertConsistentCouponState({
    startDate: doc.startDate,
    endDate: doc.endDate,
    discountType: doc.discountType,
    amount: doc.amount,
    maxDiscountAmount: doc.maxDiscountAmount,
  });

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(409, "A coupon with this code already exists for this seller");
    }
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
    after: { code: doc.code, status: doc.status },
  });

  return doc.toObject();
}

// SOFT DELETE
export async function deleteCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, isDeleted: false });
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

// RESTORE
export async function restoreCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, isDeleted: true });
  if (!doc) throw new ApiError(404, "Deleted coupon not found");

  doc.isDeleted = false;
  doc.deletedAt = null;
  doc.deletedBy = null;
  doc.updatedBy = user._id;

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(409, "Cannot restore — another active coupon already uses this code");
    }
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
    after: { code: doc.code, isDeleted: false },
  });

  return doc.toObject();
}

// PERMANENT DESTROY
export async function destroyCouponDoc({ seller, tenantDbName, user, id, req }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const doc = await Coupon.findOne({ _id: id, sellerId: seller._id, isDeleted: true });
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


export async function redeemCouponDoc({ tenantDbName, id, userId, cartTotal }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const coupon = await Coupon.findOne({ _id: id, isDeleted: false }).lean();
  if (!coupon) throw new ApiError(404, "Coupon not found");

  if (coupon.status !== "active") {
    throw new ApiError(400, "This coupon is not active");
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "This coupon is not valid at this time");
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  const userEntry = coupon.usageCountPerUser.find((u) => u.userId.toString() === userId.toString());
  const userCount = userEntry?.count ?? 0;
  if (coupon.usageLimitPerUser !== null && userCount >= coupon.usageLimitPerUser) {
    throw new ApiError(400, "You've already used this coupon the maximum number of times");
  }


  if (coupon.minPurchaseAmount !== null) {
    if (cartTotal === undefined) {
      throw new ApiError(400, "cartTotal is required to redeem this coupon");
    }
    if (cartTotal < coupon.minPurchaseAmount) {
      throw new ApiError(400, `A minimum purchase of ${coupon.minPurchaseAmount} is required for this coupon`);
    }
  }


  const usageLimitFilter = coupon.usageLimit !== null ? { usageCount: { $lt: coupon.usageLimit } } : {};

  const incremented = await Coupon.updateOne(
    {
      _id: id,
      "usageCountPerUser.userId": userId,
      ...usageLimitFilter,
      ...(coupon.usageLimitPerUser !== null
        ? { "usageCountPerUser.count": { $lt: coupon.usageLimitPerUser } }
        : {}),
    },
    { $inc: { "usageCountPerUser.$.count": 1, usageCount: 1 } }
  );

  if (incremented.matchedCount === 1) {
    return computeDiscount(coupon, cartTotal);
  }

  // No existing per-user entry — push a new one, still guarding usageLimit atomically.
  const pushed = await Coupon.updateOne(
    {
      _id: id,
      "usageCountPerUser.userId": { $ne: userId },
      ...usageLimitFilter,
    },
    {
      $push: { usageCountPerUser: { userId, count: 1 } },
      $inc: { usageCount: 1 },
    }
  );

  if (pushed.matchedCount === 0) {
    // Lost the race, or limit was hit between our read and write.
    throw new ApiError(409, "Coupon could not be redeemed — usage limit may have just been reached");
  }

  return computeDiscount(coupon, cartTotal);
}



export function computeDiscount(coupon, cartTotal) {
  let discount =
    coupon.discountType === "percentage"
      ? ((cartTotal ?? 0) * coupon.amount) / 100
      : coupon.amount;

  if (coupon.maxDiscountAmount !== null) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  return { discountAmount: discount, coupon: { code: coupon.code, discountType: coupon.discountType } };
}


function assertConditionsMet(conditions, items) {
  for (const cond of conditions || []) {
    if (!cond.valueIds?.length) continue
    const idSet = new Set(cond.valueIds.map(String))
    const hasMatch = (items || []).some((item) => {
      const ids =
        cond.type === "category" ? item.categoryIds
        : cond.type === "collection" ? item.collectionIds
        : item.brandId ? [item.brandId] : []
      return (ids || []).some((id) => idSet.has(String(id)))
    })
    if (cond.operator === "not_equal" ? hasMatch : !hasMatch) {
      throw new ApiError(400, "Your cart doesn't have items eligible for this coupon")
    }
  }
}

export async function previewCouponForCart({ tenantDbName, code,sellerId, substoreId, userId, cartTotal, items }) {
  const { Coupon } = getTenantModels(tenantDbName);

  const coupon = await Coupon.findOne({
    code: String(code || "").trim().toUpperCase(),
    sellerId,
    isDeleted: false,
  }).lean();
  
  if (!coupon) throw new ApiError(404, "Invalid coupon code");

  if (coupon.status !== "active") {
    throw new ApiError(400, "This coupon is not active");
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "This coupon is not valid at this time");
  }

  if (coupon.substoreIds?.length && (!substoreId || !coupon.substoreIds.map(String).includes(String(substoreId)))) {
    throw new ApiError(400, "This coupon is not valid for this store");
  }

  assertConditionsMet(coupon.conditions, items);

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  if (userId && coupon.usageLimitPerUser !== null) {
    const entry = coupon.usageCountPerUser.find((u) => u.userId.toString() === String(userId));
    const count = entry?.count ?? 0;
    if (count >= coupon.usageLimitPerUser) {
      throw new ApiError(400, "You've already used this coupon the maximum number of times");
    }
  }

  if (coupon.minPurchaseAmount !== null) {
    if (cartTotal === undefined) {
      throw new ApiError(400, "cartTotal is required to apply this coupon");
    }
    if (cartTotal < coupon.minPurchaseAmount) {
      throw new ApiError(400, `A minimum purchase of ${coupon.minPurchaseAmount} is required for this coupon`);
    }
  }

  return computeDiscount(coupon, cartTotal);
}