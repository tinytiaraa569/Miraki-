import { asyncHandler } from "../../utils/asyncHandler.js"
import { createSession, setAuthCookies } from "../auth/token.service.js"
import {
  createSubstore,
  getHubOverview,
  getSellerBranding,
  inviteStoreUser,
  updateSellerProfile,
  verifySellerLogin,
} from "./seller.service.js"

// STEP 1 (and only step for now): email + password. The tenant database is
// resolved server-side from the master directory; the session is stamped with
// sellerId so every later request re-resolves the tenant without trusting
// the client. (Two-step email OTP hangs off twoStepEnabled — future phase.)
export const sellerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, seller } = await verifySellerLogin({ email, password, req })

  const { accessToken, refreshToken } = await createSession({
    userId: user._id,
    userType: "store",
    sellerId: seller._id,
    req,
  })
  setAuthCookies(res, { accessToken, refreshToken })
  res.json({ ok: true })
})

// Identity + scope + permitted menu — the SERVER decides what the Hub shows.
export const sellerMe = asyncHandler(async (req, res) => {
  const user = req.user
  const seller = req.seller
  const isOwner = user.role === "SELLER_SUPERADMIN"

  res.json({
    user: { id: user._id, email: user.email, role: user.role, storeId: user.storeId },
    seller: {
      id: seller._id,
      businessName: seller.businessName,
      multistoreEnabled: seller.multistoreEnabled,
      mainStoreId: seller.mainStoreId,
      profile: seller.profile ?? {},
    },
    scope: isOwner ? "all-stores" : "single-store",
    menu: isOwner
      ? ["overview", "stores", "team", "profile"]
      : ["overview"],
  })
})

// Aggregation-backed micro-payload: business name, theme-aware logos, and
// brand colors ONLY. Fetched by the Hub shell to theme the sidebar instantly
// without dragging the whole profile/stores payload along.
export const branding = asyncHandler(async (req, res) => {
  const data = await getSellerBranding({ seller: req.seller })
  res.json(data)
})

export const hubOverview = asyncHandler(async (req, res) => {
  const data = await getHubOverview({
    seller: req.seller,
    tenantDbName: req.tenantDbName,
    user: req.user,
  })
  res.json(data)
})

export const addSubstore = asyncHandler(async (req, res) => {
  const store = await createSubstore({
    seller: req.seller,
    tenantDbName: req.tenantDbName,
    user: req.user,
    name: req.body.name,
    req,
  })
  res.status(201).json({ store })
})

export const addStoreUser = asyncHandler(async (req, res) => {
  const { invited, inviteToken } = await inviteStoreUser({
    seller: req.seller,
    tenantDbName: req.tenantDbName,
    user: req.user,
    storeId: req.params.storeId,
    email: req.body.email,
    role: req.body.role,
    req,
  })
  res.status(201).json({
    user: { id: invited._id, email: invited.email, role: invited.role, status: invited.status },
    // Dev convenience — production sends this via email instead.
    activationUrl: `/activate?token=${inviteToken}`,
  })
})

export const saveProfile = asyncHandler(async (req, res) => {
  const profile = await updateSellerProfile({
    seller: req.seller,
    user: req.user,
    updates: req.body,
    req,
  })
  res.json({ profile })
})
