import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { loadUser,requireRole } from "../../middleware/loadUser.js";
import { create, list,getOne,update,restore,remove } from "./role.controller.js";
import { listRolesQuerySchema,createRoleSchema, updateRoleSchema } from "./role.validation.js";

// api/seller/roles/

export const roleRoutes = Router();

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const gaurd = [authenticate,loadUser,ownerOnly]

roleRoutes.get("/", ...gaurd,validate(listRolesQuerySchema),list);
roleRoutes.post("/", ...gaurd,validate(createRoleSchema),create);
roleRoutes.get("/:id", ...gaurd, getOne);
roleRoutes.patch("/:id", ...gaurd, validate(updateRoleSchema),update);
roleRoutes.delete("/:id", ...gaurd, remove);
roleRoutes.post("/:id/restore", ...gaurd, restore);

