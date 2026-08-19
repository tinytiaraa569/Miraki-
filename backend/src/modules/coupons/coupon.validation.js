import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const conditionSchema = z.object({
    type: z.enum(["category", "collection", "brand"], {
        errorMap: () => ({ message: "Invalid condition type" }),
    }),
    valueIds: z.array(objectId).min(1, "valueIds must have at least one id"),
    operator: z.enum(["equal", "not_equal"]).optional(),
});

const baseFields = {
    code: z.string().trim().min(1, "Coupon code is required").max(50),
    discountType: z.enum(["percentage", "fixed"]),
    amount: z.number().positive("Discount amount must be a positive number"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional(),
    usageLimitPerUser: z.number().int().positive("Usage limit per user must be a positive integer").optional(),
    minPurchaseAmount: z.number().positive("Minimum purchase amount must be a positive number").optional(),
    maxDiscountAmount: z.number().positive("Maximum discount amount must be a positive number").optional(),
    substoreIds: z.array(objectId).optional(),
    conditions: z.array(conditionSchema).optional(),
    status: z.enum(["active", "inactive"]).optional(),
};

function applyCouponRules(data, ctx) {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endDate must be after startDate",
            path: ["endDate"],
        });
    }

    if (data.discountType === "percentage" && data.amount !== undefined && data.amount > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Percentage discount cannot exceed 100",
            path: ["amount"],
        });
    }

    if (data.maxDiscountAmount !== undefined && data.discountType && data.discountType !== "percentage") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "maxDiscountAmount is only applicable to percentage discount coupons",
            path: ["maxDiscountAmount"],
        });
    }

    if (data.usageLimitPerUser !== undefined && data.usageLimit !== undefined && data.usageLimitPerUser > data.usageLimit) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "usageLimitPerUser cannot exceed usageLimit",
            path: ["usageLimitPerUser"],
        });
    }
}

export const createCouponSchema = z
    .object(baseFields)
    .strict()
    .superRefine(applyCouponRules);

// NOTE: on update, cross-field rules (e.g. percentage cap, maxDiscountAmount
// applicability) only fire when BOTH related fields are present in the same
// payload. If a client sends `amount` alone against an existing
// discountType: "percentage" document, Zod has no way to see that — re-check
// these rules in the service layer after merging with the existing doc.
export const updateCouponSchema = z
    .object(baseFields)
    .partial()
    .strict()
    .superRefine((data, ctx) => {
        if (Object.keys(data).length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "No fields to update",
                path: [],
            });
            return;
        }
        applyCouponRules(data, ctx);
    });

export const listCouponsQuerySchema = z
    .object({
        q: z.string().trim().max(120).optional(),
        status: z.enum(["active", "inactive"]).optional(),

        deleted: z
            .enum(["true", "false"])
            .transform((v) => v === "true")
            .optional(),
        sort: z.enum(["code", "-code", "createdAt", "-createdAt", "endDate", "-endDate"]).optional(),
        page: z.coerce.number().int().min(1).max(10000).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict();

export const redeemCouponSchema = z
    .object({
        userId: objectId,
        cartTotal: z.number().positive("cartTotal must be a positive number").optional(),
    })
    .strict();

const cartItemSchema = z.object({
    categoryIds: z.array(objectId).optional(),
    collectionIds: z.array(objectId).optional(),
    brandId: objectId.optional(),
});

export const applyCouponSchema = z
    .object({
        code: z.string().trim().min(1, "Coupon code is required").max(50),
        cartTotal: z.number().nonnegative("cartTotal cannot be negative").optional(),
        userId: objectId.optional(),
        items: z.array(cartItemSchema).optional(), // needed to evaluate conditions[]
    })
    .strict();

export const listCouponUsageQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  q: z.string().trim().optional(),
})