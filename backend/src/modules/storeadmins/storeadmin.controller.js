import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { createStoreAdmin, getStoreAdmin, listStoreAdmins, updateStoreAdmin } from "./storeadmin.service.js"
import { listStoreAdminsQuerySchema } from "./storeadmin.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, actor: req.user, req })

export const create = asyncHandler(async (req, res) => {
  const admin = await createStoreAdmin({ ...ctx(req), body: req.body })
  res.status(201).json({ admin })
})

export const list = asyncHandler(async (req,res)=>{
  const parsed = listStoreAdminsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listStoreAdmins({...ctx(req),query:parsed.data})
  res.json(data)
})

export const getOne = asyncHandler(async(req,res)=>{
  const admin = await getStoreAdmin({...ctx(req), id:req.params.id})
  res.json({admin})
})

export const update = asyncHandler(async(req,res)=>{
  const admin = await updateStoreAdmin({...ctx(req),id:req.params.id, body:req.body})
  res.json({admin})
})