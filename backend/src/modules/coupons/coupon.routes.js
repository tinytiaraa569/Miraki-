import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { loadUser, requireRole ,requirePermission} from "../../middleware/loadUser.js";
import { validate } from "../../middleware/validate.js";
import { list, getOne, create, update, remove, restore, redeem , usage, options, toggle, duplicate, bulkRemove} from "./coupon.controller.js";
import {
  createCouponSchema,
  updateCouponSchema,
  redeemCouponSchema,
  listCouponUsageQuerySchema,
} from "./coupon.validation.js";

export const couponRoutes = Router();

const customerGuard = [authenticate];

const readGuard = [authenticate, loadUser, requirePermission("coupon", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("coupon", "write")]

//api/seller/...

couponRoutes.get("/", ...readGuard, list);
couponRoutes.get("/options/:entity",...readGuard,options)
couponRoutes.post("/", ...writeGuard, validate(createCouponSchema), create);
couponRoutes.get("/:id", ...readGuard, getOne);
couponRoutes.patch("/:id", ...writeGuard, validate(updateCouponSchema), update);
couponRoutes.delete("/:id", ...writeGuard, remove);
couponRoutes.post("/:id/restore", ...writeGuard, restore);
couponRoutes.get("/:id/usage",...readGuard, validate(listCouponUsageQuerySchema), usage);

couponRoutes.post("/:id/redeem", ...customerGuard, validate(redeemCouponSchema), redeem);

couponRoutes.patch("/:id/toggle",...writeGuard, toggle)
couponRoutes.post("/duplicate/:id",...writeGuard, duplicate)

couponRoutes.post("/bulk-delete", ...writeGuard,bulkRemove)

