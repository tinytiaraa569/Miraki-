"use client"

import { useCallback, useEffect, useRef } from "react"

import {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  clearCartError,
  openCart,
  closeCart,
  toggleCart,
  selectIsInCart,
  selectCartItemQuantity,
  selectCartItemCount,
  selectCartDisplayTotal,
  selectCartError,
} from "@/redux/cartpage/cart-page-slice"

import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"

export function useCart() {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.cart.items)
  const isCartHydrated = useSelector((state) => state.cart.isHydrated)
  const totalQuantity = useSelector(selectCartItemCount)
  const displayTotal = useSelector(selectCartDisplayTotal)
  const cartError = useSelector(selectCartError)
  const itemCount = items?.length || 0

  const isOpen = useSelector((state) => state.cart.isOpen)


  const shownErrorRef = useRef(null)

  useEffect(() => {
    if (cartError && shownErrorRef.current !== cartError) {
      shownErrorRef.current = cartError
      toast.error(cartError)
      const timer = setTimeout(() => {
        dispatch(clearCartError())
      }, 100)
      return () => clearTimeout(timer)
    }
    if (!cartError) {
      shownErrorRef.current = null
    }
  }, [cartError, dispatch])

  const addItem = useCallback(
    (product, variant = null, quantity = 1, selectedOptions = null, producttype) => {
      dispatch(addToCart({ product, variant, quantity, selectedOptions, producttype }))
    },
    [dispatch],
  )

  const removeItem = useCallback(
    (productId, variantId = null) => {
      dispatch(removeFromCart({ productId, variantId }))
    },
    [dispatch],
  )

  const setQuantity = useCallback(
    (productId, variantId, quantity) => {
      dispatch(updateQuantity({ productId, variantId, quantity }))
    },
    [dispatch],
  )

  const increment = useCallback(
    (productId, variantId = null) => {
      dispatch(incrementQuantity({ productId, variantId }))
    },
    [dispatch],
  )

  const decrement = useCallback(
    (productId, variantId = null) => {
      dispatch(decrementQuantity({ productId, variantId }))
    },
    [dispatch],
  )

  const clear = useCallback(() => dispatch(clearCart()), [dispatch])

  const clearError = useCallback(() => dispatch(clearCartError()), [dispatch])

  const isInCart = useCallback(
    (productId, variantId = null) => {
      return selectIsInCart(items, productId, variantId)
    },
    [items],
  )

  const getQuantity = useCallback(
    (productId, variantId = null) => {
      return selectCartItemQuantity(items, productId, variantId)
    },
    [items],
  )

  const open = useCallback(() => dispatch(openCart()), [dispatch])
  const close = useCallback(() => dispatch(closeCart()), [dispatch])
  const toggle = useCallback(() => dispatch(toggleCart()), [dispatch])

  return {
    items,
    itemCount,
    totalQuantity,
    displayTotal,
    isCartHydrated,
    cartError,
    isOpen,
    addItem,
    removeItem,
    setQuantity,
    increment,
    decrement,
    clear,
    clearError,
    isInCart,
    getQuantity,
    open,
    close,
    toggle,
    
  }
}
