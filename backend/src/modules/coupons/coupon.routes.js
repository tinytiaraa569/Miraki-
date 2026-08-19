import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { loadUser, requireRole } from "../../middleware/loadUser.js";
import { validate } from "../../middleware/validate.js";
import { list, getOne, create, update, remove, restore, redeem , usage} from "./coupon.controller.js";
import {
  createCouponSchema,
  updateCouponSchema,
  redeemCouponSchema,
  listCouponUsageQuerySchema,
} from "./coupon.validation.js";

export const couponRoutes = Router();

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly];

const customerGuard = [authenticate];

//api/seller/...

couponRoutes.get("/", ...guard, list);
couponRoutes.post("/", ...guard, validate(createCouponSchema), create);
couponRoutes.get("/:id", ...guard, getOne);
couponRoutes.patch("/:id", ...guard, validate(updateCouponSchema), update);
couponRoutes.delete("/:id", ...guard, remove);
couponRoutes.post("/:id/restore", ...guard, restore);
couponRoutes.get("/:id/usage",...guard, validate(listCouponUsageQuerySchema), usage);


couponRoutes.post("/:id/redeem", ...customerGuard, validate(redeemCouponSchema), redeem);