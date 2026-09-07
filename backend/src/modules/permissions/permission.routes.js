import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { loadUser, requirePermission } from "../../middleware/loadUser.js";
import { validate } from "../../middleware/validate.js";
import { list,getOne,create, remove,update, bulkRemove, reseed, listGrouped, listKeys } from "./permission.controller.js"; 
import { bulkDeletePermissionSchema, createPermissionSchema, updatePermissionSchema } from "./permission.validation.js";

export const permissionRoutes = Router();

const readGuard = [authenticate, loadUser, requirePermission("store_permission", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("store_permission", "write")]


//api/seller/...

permissionRoutes.get("/", ...readGuard, list)
permissionRoutes.get("/grouped", ...readGuard, listGrouped)
permissionRoutes.get("/keys", ...readGuard, listKeys)
permissionRoutes.post("/", ...writeGuard, validate(createPermissionSchema, { allow: ["isActive"] }), create)
permissionRoutes.post("/reseed", ...writeGuard, reseed)
permissionRoutes.get("/:id", ...readGuard, getOne)
permissionRoutes.patch("/:id", ...writeGuard, validate(updatePermissionSchema, { allow: ["isActive"] }), update)
permissionRoutes.post("/bulk-delete", ...writeGuard, validate(bulkDeletePermissionSchema), bulkRemove)
permissionRoutes.delete("/:id", ...writeGuard, remove)
