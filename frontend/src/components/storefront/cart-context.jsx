"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { api } from "@/lib/api"

const CartContext = createContext(null)
const STORAGE_KEY = "sf_cart"

function loadStoredCart() {
  if (typeof window === "undefined") return { items: [], coupon: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { items: [], coupon: null }
  } catch {
    return { items: [], coupon: null }
  }
}

function lineKey(productId, variantId, options) {
  const optKey = (options || [])
    .map((o) => `${o.name}:${o.value}`)
    .sort()
    .join("|")
  return `${productId}::${variantId || "novariant"}::${optKey}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadStoredCart().items)
  const [coupon, setCoupon] = useState(() => loadStoredCart().coupon)
  const [isOpen, setIsOpen] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, coupon }))
    } catch {}
  }, [items, coupon])

  const cartOpen = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback(async ({ product, variant, options, quantity, price, alias }) => {
    setAddingItem(true)
    try {
      const productId = product._id || product.id
      const key = lineKey(productId, variant?.id, options)
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key)
        if (existing) {
          return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        }
        return [
          ...prev,
          {
            key,
            itemId: key,
            productId,
            variantId: variant?.id ?? null,
            name: product.name,
            image: product.images?.[0]?.url || product.mainImg || product.image || null,
            price,
            quantity,
            options: options || [],
            categoryIds: product.categoryIds || [],
            collectionIds: product.collectionIds || [],
            brandId: product.brandId || null,
            alias: product.alias || alias || null,
          },
        ]
      })
      setIsOpen(true)
    } finally {
      setAddingItem(false)
    }
  }, [])

  const updateItemQty = useCallback((itemId, quantity) => {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i)))
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])

  // Sent to the server on every apply/re-validate call so it can check
  // coupon.conditions (category/collection/brand) 
 const cartItemsPayload = useMemo(
  () =>
    items.map((i) => ({
      productId: i.productId,
      categoryIds: i.categoryIds || [],
      collectionIds: i.collectionIds || [],
      brandId: i.brandId || undefined,
      quantity: i.quantity,
      price: i.price,
    })),
  [items],
)


const applyCoupon = useCallback(
  async (code, substoreId) => {
    setApplyingCoupon(true)
    try {
      const res = await api.post("/storefront/coupons/apply", {
        code: code.trim().toUpperCase(),
        cartTotal: subtotal,
        items: cartItemsPayload,
      })
      setCoupon({
        code: res.coupon.code,
        discountType: res.coupon.discountType,
        discountAmount: res.discountAmount,
        applicableInfo: res.applicableInfo,
      })
      return res
    } catch (err) {
      throw new Error(err?.message || "Couldn't apply that code")
    } finally {
      setApplyingCoupon(false)
    }
  },
  [subtotal, cartItemsPayload],
)

  const removeCoupon = useCallback(() => setCoupon(null), [])

  const couponCodeRef = useRef(null)
  couponCodeRef.current = coupon?.code ?? null

  useEffect(() => {
    const code = couponCodeRef.current
    if (!code) return

    const timer = setTimeout(async () => {
  try {
    const res = await api.post("/storefront/coupons/apply", { code, cartTotal: subtotal, items: cartItemsPayload })
    setCoupon({
      code: res.coupon.code,
      discountType: res.coupon.discountType,
      discountAmount: res.discountAmount,
      applicableInfo: res.applicableInfo, // ← add this
    })
  } catch {
    setCoupon(null)
  }
}, 400)

    return () => clearTimeout(timer)
  }, [subtotal, cartItemsPayload])

  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items])

const cart = useMemo(
  () => ({
    items,
    subtotal,
    discount: coupon?.discountAmount ?? 0,
    total: Math.max(0, subtotal - (coupon?.discountAmount ?? 0)),
    coupon,
    applicableInfo: coupon?.applicableInfo ?? null,
  }),
  [items, subtotal, coupon],
)

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      isOpen,
      cartOpen,
      close,
      addItem,
      addingItem,
      updateItemQty,
      removeItem,
      applyCoupon,
      applyingCoupon,
      removeCoupon,
    }),
    [cart, itemCount, isOpen, cartOpen, close, addItem, addingItem, updateItemQty, removeItem, applyCoupon, applyingCoupon, removeCoupon],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}