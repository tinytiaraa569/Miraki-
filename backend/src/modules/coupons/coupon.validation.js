import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const NUMERIC_FIELDS = ["cart_total", "cart_item_count", "product_quantity"];
const ENTITY_FIELDS = ["product", "category", "collection", "brand"];

const conditionItemSchema = z
  .object({
    field: z.enum(
      ["cart_total", "cart_item_count", "product_quantity", "product", "category", "collection", "brand"],
      { errorMap: () => ({ message: "Invalid condition field" }) },
    ),
    operator: z.enum(["contains", "notContains", "equals", "notEquals", "greaterThan", "lessThan"], {
      errorMap: () => ({ message: "Invalid operator" }),
    }),
    values: z.array(z.any()).min(1, "values must have at least one entry"),
  })
  .superRefine((data, ctx) => {
    if (NUMERIC_FIELDS.includes(data.field)) {
      if (!["equals", "greaterThan", "lessThan"].includes(data.operator)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "operator must be equals/greaterThan/lessThan for numeric fields",
          path: ["operator"],
        });
      }
      if (data.values.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "numeric fields take exactly one value",
          path: ["values"],
        });
      }
    }
    if (ENTITY_FIELDS.includes(data.field)) {
      if (!["contains", "notContains", "equals", "notEquals"].includes(data.operator)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "operator must be contains/notContains/equals/notEquals for entity fields",
          path: ["operator"],
        });
      }
    }
  });

const baseFields = {
  code: z.string().trim().min(1, "Coupon code is required").max(50),
  name: z.string().trim().max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  enabled: z.boolean().optional(),
  conditions: z.array(conditionItemSchema).optional(),
  showAdvanceSettings: z.boolean().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  maxUsagePerUser: z.number().int().positive().optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  minOrderAmount:z.number().positive().optional().nullable(),
  isPrivate: z.boolean().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  amount: z.number().positive("Discount amount must be a positive number"),
  mainStoreId: objectId.optional(), 
  sellerId: objectId.optional(),
  substoreIds: z.array(objectId).max(500).optional(),
};

function applyCouponRules(data, ctx) {
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endDate must be after startDate", path: ["endDate"] });
  }
  if (data.discountType === "percentage" && data.amount !== undefined && data.amount > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Percentage discount cannot exceed 100", path: ["amount"] });
  }
  if (data.maxDiscount != null && data.discountType && data.discountType !== "percentage") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "maxDiscount is only applicable to percentage discount coupons",
      path: ["maxDiscount"],
    });
  }
  if (data.maxUsagePerUser != null && data.maxUsage != null && data.maxUsagePerUser > data.maxUsage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "maxUsagePerUser cannot exceed maxUsage",
      path: ["maxUsagePerUser"],
    });
  }
}

export const createCouponSchema = z.object(baseFields).strict().superRefine(applyCouponRules);

export const updateCouponSchema = z
  .object(baseFields)
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No fields to update", path: [] });
      return;
    }
    applyCouponRules(data, ctx);
  });

export const listCouponsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    // enabled: z.coerce.boolean().optional(),
    enabled: z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true")),
    isPrivate: z.coerce.boolean().optional(),
    deleted: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    sort: z.enum(["code", "-code", "createdAt", "-createdAt", "endDate", "-endDate"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const bulkDeleteCouponSchema = z
  .object({ ids: z.array(objectId).min(1, "ids must have at least one id") })
  .strict();

export const optionEntity = z.enum(["product", "category", "collection", "brand","substores"]);

export const listOptionQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    ids: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined))
      .refine((arr) => !arr || arr.every((id) => /^[a-f0-9]{24}$/i.test(id)), { message: "Invalid id" }),
  })
  .strict();

const cartItemSchema = z.object({
  productId: objectId.optional(),
  categoryIds: z.array(objectId).optional(),
  collectionIds: z.array(objectId).optional(),
  brandId: objectId.optional(),
  quantity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
});

export const listCouponUsageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().trim().max(120).optional(),
  })
  .strict();

export const applyCouponSchema = z
  .object({
    code: z.string().trim().min(1, "Coupon code is required").max(50),
    userId: objectId.optional(),
    cartTotal: z.number().nonnegative().optional(),
    items: z.array(cartItemSchema).optional(),
    substoreId: objectId.optional(),
  })
  .strict();

export const redeemCouponSchema = applyCouponSchema;