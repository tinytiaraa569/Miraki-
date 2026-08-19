import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { loadUser, requirePermission } from "../../middleware/loadUser.js";
import { create, list,getOne,update,restore,remove } from "./role.controller.js";
import { listRolesQuerySchema,createRoleSchema, updateRoleSchema } from "./role.validation.js";

// api/seller/roles/

export const roleRoutes = Router();

const readGuard = [authenticate, loadUser, requirePermission("store_role", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("store_role", "write")]

roleRoutes.get("/", ...readGuard, validate(listRolesQuerySchema), list)
roleRoutes.post("/", ...writeGuard, validate(createRoleSchema), create)
roleRoutes.get("/:id", ...readGuard, getOne)
roleRoutes.patch("/:id", ...writeGuard, validate(updateRoleSchema), update)
roleRoutes.delete("/:id", ...writeGuard, remove)
roleRoutes.post("/:id/restore", ...writeGuard, restore)

