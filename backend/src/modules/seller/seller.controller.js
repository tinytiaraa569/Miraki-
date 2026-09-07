import { asyncHandler } from "../../utils/asyncHandler.js"
import { env } from "../../config/env.js"
import { createSession, setAuthCookies } from "../auth/token.service.js"
import { signPreauthToken } from "../storeadmins/totp.storeadmin.service.js"
import {
  createSubstore,
  buildHubBootstrap,
  getHubOverview,
  getSellerBranding,
  inviteStoreUser,
  updateSellerProfile,
  verifySellerLogin,
} from "./seller.service.js"

const PREAUTH_COOKIE = "preauth_token"
const PREAUTH_PATH = "/api/seller"

function setPreauthCookie(res, token) {
  res.cookie(PREAUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "strict" : "lax",
    path: PREAUTH_PATH,
    maxAge: 5 * 60 * 1000,
  })
}

export const sellerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, seller, accountType, role } = await verifySellerLogin({ email, password, req })

  if (accountType === "storeAdmin" && (user.twoFactorRequired || user.totpEnabled)) {
    const mode = user.totpEnabled ? "verify" : "enroll"
    setPreauthCookie(res, signPreauthToken({ userId: user._id, mode, sellerId: seller._id }))
    return res.json({ accountType, twoFactorRequired: true, mode })
  }

  const [{ accessToken, refreshToken }, bootstrap] = await Promise.all([
    createSession({
      userId: user._id,
      userType: accountType === "storeAdmin" ? "storeAdmin" : "store",
      sellerId: seller._id,
      req,
    }),
    buildHubBootstrap({ user, seller, accountType, role }),
  ])
  setAuthCookies(res, { accessToken, refreshToken })
  res.json({ ok: true, accountType, twoFactorRequired: false, bootstrap })
})

// Identity + scope + permitted menu — the SERVER decides what the Hub shows.
// For StoreUser (owner): full access with explicit menu.
// For StoreAdmin: permission-based scope, empty menu (frontend builds from permissions).
export const sellerMe = asyncHandler(async (req, res) => {
  const user = req.user
  const seller = req.seller
  const isOwner = user.role === "SELLER_SUPERADMIN"
  const isStoreAdmin = req.userType === "storeAdmin"

  if (isStoreAdmin) {
    res.json({
      accountType: "storeAdmin",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        storeId: user.storeId,
      },
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        multistoreEnabled: seller.multistoreEnabled,
        mainStoreId: seller.mainStoreId,
        profile: seller.profile ?? {},
      },
      scope: "permission-based",
      menu: [],
      permissions: user.permissions ?? [],
    })
    return
  }

  res.json({
    accountType: "storeUser",
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
    permissions: ["*"],
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
    userType: req.userType,
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
