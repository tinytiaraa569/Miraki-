import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { loadUser, requireRole } from "../../middleware/loadUser.js";
import { validate } from "../../middleware/validate.js";
import { list,getOne,create, remove,update, bulkRemove, reseed, listGrouped, listKeys } from "./permission.controller.js"; 
import { bulkDeletePermissionSchema, createPermissionSchema, updatePermissionSchema } from "./permission.validation.js";

export const permissionRoutes = Router();

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate,loadUser,ownerOnly]


//api/seller/...

permissionRoutes.get("/",...guard,list);
permissionRoutes.get("/grouped",...guard,listGrouped);
permissionRoutes.get("/keys",...guard,listKeys);
permissionRoutes.post("/",...guard,validate(createPermissionSchema,{ allow: ["isActive"]}),create);
permissionRoutes.post("/reseed",...guard,reseed);
permissionRoutes.get("/:id",...guard,getOne);
permissionRoutes.patch("/:id",...guard,validate(updatePermissionSchema,{ allow: ["isActive"]}),update);
permissionRoutes.post("/bulk-delete",...guard,validate(bulkDeletePermissionSchema),bulkRemove);
permissionRoutes.delete("/:id",...guard,remove);