import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { getOne, update } from "./businessmode.controller.js"
import { updateBusinessModeSchema } from "./businessmode.validation.js"

export const businessmodeRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("business_mode", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("business_mode", "write")]

businessmodeRoutes.get("/", ...readGuard, getOne)
businessmodeRoutes.patch("/", ...writeGuard, validate(updateBusinessModeSchema ,{ allow: ["isActive"] }), update)