import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { getSettings, updateSettings } from "./generalSettings.controller.js"
import { updateGeneralSettingsSchema } from "./generalSettings.validation.js"


// router. Reads are permission-gated (general_setting.read); the single PATCH

export const generalSettingsRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("general_setting", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("general_setting", "write")]

generalSettingsRoutes.get("/", ...readGuard, getSettings)
generalSettingsRoutes.patch("/", ...writeGuard, validate(updateGeneralSettingsSchema), updateSettings)
