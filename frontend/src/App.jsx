"use client"

import { lazy, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom"
import { LoginPage } from "@/pages/login-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { ActivatePage } from "@/pages/activate-page"
import { SellerLoginPage } from "@/pages/seller-login-page"
import { HubLayout } from "@/pages/hub/hub-layout"
import { useAuth } from "@/hooks/use-auth"
import { useHubAuth } from "@/hooks/use-hub-auth"
import { findAccessibleNavMatch, firstAccessibleUrl } from "@/lib/seller-nav"
import { Toaster } from "sonner"
import { useStoreAdminAuth } from "./hooks/use-storeadmin-auth"
import CheckoutPage from "./pages/checkout-page"


const HubOverviewPage = lazy(() => import("@/pages/hub/overview-page"))
const HubStoresPage = lazy(() => import("@/pages/hub/stores-page"))
const HubSubstoresPage = lazy(() => import("@/pages/hub/substores-page"))
const HubStoreVariantsPage = lazy(() => import("@/pages/hub/store-variants-page"))

const HubProductsPage = lazy(() => import("@/pages/hub/products/products-page"))
const HubProductEditorPage = lazy(() => import("@/pages/hub/products/product-editor-page"))
const HubProductVariantsPage = lazy(() => import("@/pages/hub/products/product-variants-page"))


const HubCategoriesPage = lazy(() => import("@/pages/hub/categories-page"))
const HubBrandsPage = lazy(() => import("@/pages/hub/brands/brands-page"))
const HubCollectionsPage = lazy(() => import("@/pages/hub/collections/collections-page"))
const HubOptionSetsPage = lazy(() => import("@/pages/hub/option-sets/option-sets-page"))

const HubDiscountsPage = lazy(() => import("@/pages/hub/discounts/discounts-page"))

const HubMetafieldsPage = lazy(() => import("@/pages/hub/metafields/metafields-page"))
const HubMetafieldEditorPage = lazy(() => import("@/pages/hub/metafields/metafield-editor-page"))


const HubTeamPage = lazy(() => import("@/pages/hub/team-page"))
const HubProfilePage = lazy(() => import("@/pages/hub/profile-page"))
const HubAppearancePage = lazy(() => import("@/pages/hub/appearance-page"))
const HubModulePage = lazy(() => import("@/pages/hub/module-page"))
const HubPermissionPage = lazy(() => import("@/pages/hub/permissions-page"))
const HubRolePage = lazy(() => import("@/pages/hub/roles-page"))
const HubStoreAdminPage = lazy(() => import("@/pages/hub/store-admins-page"))
const HubGeneralSettingsPage = lazy(() => import("@/pages/hub/settings/general-settings-page"))

const StorefrontPage = lazy(() => import("@/pages/storefront-page"))
const JewelryPage = lazy(() => import("@/pages/jewelry-page"))
const ProductPage = lazy(() => import("@/pages/product-page"))

const CouponsPage = lazy(() => import("@/pages/hub/coupons/coupons-page"))


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

function SellerPublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useHubAuth()
  if (isLoading) return <FullScreenLoader />
  return isAuthenticated ? <Navigate to="/hub" replace /> : children
}

function SellerProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useHubAuth()
  if (isLoading) return <FullScreenLoader />
  return isAuthenticated ? children : <Navigate to="/seller/login" replace />
}

function HubPermissionRoute({ children }) {
  const { pathname } = useLocation()
  const { permissions, isOwner } = useHubAuth()
  if (pathname === "/hub/forbidden") return children
  if (findAccessibleNavMatch(pathname, permissions, isOwner)) return children

  const fallback = firstAccessibleUrl(permissions, isOwner)
  return fallback && fallback !== pathname
    ? <Navigate to={fallback} replace />
    : <Navigate to="/hub/forbidden" replace />
}


// Remount the editor whenever the product id changes so the draft fully resets
function KeyedProductEditor() {
  const { id } = useParams()
  return <HubProductEditorPage key={`edit:${id}`} />
}

export default function App() {
  return (
    <>
      <Toaster />
    
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
            <HubPermissionRoute>
              <HubLayout />
            </HubPermissionRoute>
          </SellerProtectedRoute>
        }
      >
        <Route index element={<HubOverviewPage />} />
        <Route path="stores" element={<HubStoresPage />} />
        <Route path="stores/substores" element={<HubSubstoresPage />} />
        <Route path="stores/variants" element={<HubStoreVariantsPage />} />

        <Route path="products" element={<HubProductsPage />} />
        <Route path="products/variants" element={<HubProductVariantsPage />} />
        <Route path="products/create" element={<HubProductEditorPage key="create" />} />
        <Route path="products/:id/edit" element={<KeyedProductEditor />} />
        
        <Route path="products/categories" element={<HubCategoriesPage />} />
        <Route path="products/brands" element={<HubBrandsPage />} />
        <Route path="products/collections" element={<HubCollectionsPage />} />
        <Route path="products/option-sets" element={<HubOptionSetsPage />} />

        <Route path="stores/permissions" element={<HubPermissionPage />} />
        <Route path="stores/roles" element={<HubRolePage />} />
        <Route path="stores/admins" element={<HubStoreAdminPage />} />
        <Route path="team" element={<HubTeamPage />} />
        <Route path="profile" element={<HubProfilePage />} />
        <Route path="advanced/appearance" element={<HubAppearancePage />} />

        <Route path="marketing/coupons" element={<CouponsPage />} />

        {/* Metafields */}

        <Route path="advanced/metafields" element={<HubMetafieldsPage />} />
        <Route path="advanced/metafields/new" element={<HubMetafieldEditorPage key="create" />} />
        <Route path="advanced/metafields/:id/edit" element={<HubMetafieldEditorPage />} />

        {/* Marketing */}
        <Route path="marketing/discounts" element={<HubDiscountsPage />} />

        {/* Settings */}
        <Route path="settings" element={<HubGeneralSettingsPage />} />

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

         <Route
        path="/jewelry"
        element={
          <Suspense fallback={<FullScreenLoader />}>
            <JewelryPage />
          </Suspense>
        }
      />

       <Route
        path="/product/:alias"
        element={
          <Suspense fallback={<FullScreenLoader />}>
            <ProductPage />
          </Suspense>
        }
      />

      <Route
        path="/checkout"
        element={
          <Suspense fallback={<FullScreenLoader />}>
            <CheckoutPage />
          </Suspense>
        }
      />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
