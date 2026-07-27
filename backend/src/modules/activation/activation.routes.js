import { Router } from "express"
import rateLimit from "express-rate-limit"
import { validate } from "../../middleware/validate.js"
import { activate, verifyToken } from "./activation.controller.js"
import { activateSchema } from "./activation.validation.js"

// Tight limiter: activation is a public, unauthenticated surface.
// 10 attempts / 15 min per IP covers legit retries while killing brute force.
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
})

export const activationRoutes = Router()

activationRoutes.get("/verify", activationLimiter, verifyToken)
activationRoutes.post("/", activationLimiter, validate(activateSchema), activate)