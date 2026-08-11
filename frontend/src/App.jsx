"use client"

import { lazy, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "@/pages/login-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { ActivatePage } from "@/pages/activate-page"
import { SellerLoginPage } from "@/pages/seller-login-page"
import { HubLayout } from "@/pages/hub/hub-layout"
import { useAuth } from "@/hooks/use-auth"
import { useSellerAuth } from "@/hooks/use-seller-auth"
import { useStoreAdminAuth } from "./hooks/use-storeadmin-auth"


const HubOverviewPage = lazy(() => import("@/pages/hub/overview-page"))
const HubStoresPage = lazy(() => import("@/pages/hub/stores-page"))
const HubSubstoresPage = lazy(() => import("@/pages/hub/substores-page"))
const HubStoreVariantsPage = lazy(() => import("@/pages/hub/store-variants-page"))
const HubTeamPage = lazy(() => import("@/pages/hub/team-page"))
const HubProfilePage = lazy(() => import("@/pages/hub/profile-page"))
const HubAppearancePage = lazy(() => import("@/pages/hub/appearance-page"))
const HubModulePage = lazy(() => import("@/pages/hub/module-page"))
const HubPermissionPage = lazy(()=> import("@/pages/hub/permissions-page"))
const HubRolePage = lazy(()=> import("@/pages/hub/roles-page"))
const HubStoreAdminPage = lazy(()=> import("@/pages/hub/store-admins-page"))

const StorefrontPage = lazy(() => import("@/pages/storefront-page"))

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  )
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullScreenLoader />
  return isAuthenticated ? <Navigate to="/platform/super-admin" replace /> : children
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullScreenLoader />
  return isAuthenticated ? children : <Navigate to="/platform/super-admin/login" replace />
}

// function SellerPublicOnlyRoute({ children }) {
//   const { isAuthenticated, isLoading } = useSellerAuth()
//   if (isLoading) return <FullScreenLoader />
//   return isAuthenticated ? <Navigate to="/hub" replace /> : children
// }

// function SellerProtectedRoute({ children }) {
//   const { isAuthenticated, isLoading } = useSellerAuth()
//   if (isLoading) return <FullScreenLoader />
//   return isAuthenticated ? children : <Navigate to="/seller/login" replace />
// }

function SellerPublicOnlyRoute({ children }) {
  const seller = useSellerAuth()
  const storeAdmin = useStoreAdminAuth()
  if (seller.isLoading || storeAdmin.isLoading) return <FullScreenLoader />
  return seller.isAuthenticated || storeAdmin.isAuthenticated
    ? <Navigate to="/hub" replace />
    : children
}

function SellerProtectedRoute({ children }) {
  const seller = useSellerAuth()
  const storeAdmin = useStoreAdminAuth()
  if (seller.isLoading || storeAdmin.isLoading) return <FullScreenLoader />
  return seller.isAuthenticated || storeAdmin.isAuthenticated
    ? children
    : <Navigate to="/seller/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/activate" element={<ActivatePage />} />

      <Route
        path="/platform/super-admin/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/platform/super-admin"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      
      <Route
        path="/seller/login"
        element={
          <SellerPublicOnlyRoute>
            <SellerLoginPage />
          </SellerPublicOnlyRoute>
        }
      />

      <Route
        path="/hub"
        element={
          <SellerProtectedRoute>
            <HubLayout />
          </SellerProtectedRoute>
        }
      >
        <Route index element={<HubOverviewPage />} />
        <Route path="stores" element={<HubStoresPage />} />
        <Route path="stores/substores" element={<HubSubstoresPage />} />
        <Route path="stores/variants" element={<HubStoreVariantsPage />} />
        <Route path="stores/permissions" element={<HubPermissionPage />} />
        <Route path="stores/roles" element={<HubRolePage />} />
        <Route path="stores/admins" element={<HubStoreAdminPage />} />
        <Route path="team" element={<HubTeamPage />} />
        <Route path="profile" element={<HubProfilePage />} />
        <Route path="advanced/appearance" element={<HubAppearancePage />} />
        
        <Route path="*" element={<HubModulePage />} />
      </Route>

      <Route
        path="/"
        element={
          <Suspense fallback={<FullScreenLoader />}>
            <StorefrontPage />
          </Suspense>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
