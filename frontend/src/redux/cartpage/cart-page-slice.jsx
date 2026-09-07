import { createSlice } from "@reduxjs/toolkit"

const STORAGE_KEY = "storefront_cart"

const loadFromStorage = () => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveToStorage = (items) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    // sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error("Failed to save cart:", error)
  }
}

const getItemId = (item) => {
  if (!item) return null
  if (typeof item === "string") return item
  return item._id || item.id || null
}

const getCartItemKey = (productId, variantId) => {
  return variantId ? `${productId}_${variantId}` : productId
}

const validateVariantQuantity = (variant, requestedQuantity, existingQuantity = 0) => {
  if (!variant) return { valid: true, quantity: requestedQuantity, error: null }

  const totalQuantity = existingQuantity + requestedQuantity
  const { stock, minLimit, maxLimit, allowOutOfStock } = variant

  if (!allowOutOfStock) {
    if (typeof stock === "number" && stock <= 0) {
      return {
        valid: false,
        quantity: 0,
        error: "This item is out of stock",
      }
    }
    if (typeof stock === "number" && totalQuantity > stock) {
      const allowedQuantity = stock - existingQuantity
      if (allowedQuantity <= 0) {
        return {
          valid: false,
          quantity: 0,
          error: `Only ${stock} available in stock`,
        }
      }
      return {
        valid: true,
        quantity: allowedQuantity,
        error: `Only ${allowedQuantity} more available (stock: ${stock})`,
        capped: true,
      }
    }
  }

  // Check minimum limit
  if (minLimit && totalQuantity < minLimit) {
    return {
      valid: false,
      quantity: 0,
      error: `Minimum order quantity is ${minLimit}`,
    }
  }

  // Check maximum limit
  if (maxLimit && totalQuantity > maxLimit) {
    const allowedQuantity = maxLimit - existingQuantity
    if (allowedQuantity <= 0) {
      return {
        valid: false,
        quantity: 0,
        error: `Maximum order quantity of ${maxLimit} reached`,
      }
    }
    return {
      valid: true,
      quantity: allowedQuantity,
      error: `Only ${allowedQuantity} more can be added (max: ${maxLimit})`,
      capped: true,
    }
  }

  return { valid: true, quantity: requestedQuantity, error: null }
}

const initialState = {
  items: [],
  isHydrated: false,
  lastError: null, // Added to track validation errors
  isOpen: false, 
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state) => {
      state.items = loadFromStorage()
      state.isHydrated = true
    },
    clearCartError: (state) => {
      state.lastError = null
    },
    addToCart: (state, action) => {
      const { product, variant, quantity = 1, selectedOptions, producttype } = action.payload
      console.log(" addToCart payload:", { product, variant, quantity, producttype })

      const productId = getItemId(product) || product?._id || product?.id
      console.log(" Extracted productId:", productId)

      if (!productId) {
        console.warn("addToCart called with invalid product (no _id or id)", product)
        state.lastError = "Invalid product"
        return
      }

      const variantId = variant?._id || variant?.id || null
      const cartItemKey = getCartItemKey(productId, variantId)

      const existingIndex = state.items.findIndex((item) => item.cartItemKey === cartItemKey)
      const existingQuantity = existingIndex !== -1 ? state.items[existingIndex].quantity : 0

      const validation = validateVariantQuantity(variant, quantity, existingQuantity)

      if (!validation.valid) {
        console.warn(" Cart validation failed:", validation.error)
        state.lastError = validation.error
        return
      }

      // Clear any previous error on successful add
      state.lastError = validation.capped ? validation.error : null

      const quantityToAdd = validation.quantity

      const cartImage =
        variant?.images?.[0]?.url ||
        product?.images?.find((img) => img.isPrimary)?.url ||
        product?.images?.[0]?.url ||
        null

      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += quantityToAdd
        console.log(" Updated existing cart item quantity:", state.items[existingIndex].quantity)
      } else {
        state.items.push({
          cartItemKey,
          productId,
          variantId,
          producttype,
          product: { ...product },
          variant: variant ? { ...variant } : null,
          selectedOptions: selectedOptions || variant?.optionValues || {},
          image: cartImage,
          displayPrice: variant?.price ?? product?.price,
          quantity: quantityToAdd,
          addedAt: Date.now(),
        })
        console.log(" Added new item to cart")
      }

      saveToStorage(state.items)
    },
    incrementQuantity: (state, action) => {
      const { productId, variantId } = action.payload
      const cartItemKey = getCartItemKey(productId, variantId)
      const item = state.items.find((item) => item.cartItemKey === cartItemKey)

      if (item) {
        const validation = validateVariantQuantity(item.variant, 1, item.quantity)

        if (!validation.valid) {
          console.warn(" Increment validation failed:", validation.error)
          state.lastError = validation.error
          return
        }

        state.lastError = validation.capped ? validation.error : null
        item.quantity += validation.quantity
        saveToStorage(state.items)
      }
    },
    updateQuantity: (state, action) => {
      const { productId, variantId, quantity } = action.payload
      const cartItemKey = getCartItemKey(productId, variantId)
      const existingIndex = state.items.findIndex((item) => item.cartItemKey === cartItemKey)

      if (existingIndex !== -1) {
        if (quantity <= 0) {
          state.items.splice(existingIndex, 1)
          state.lastError = null
        } else {
          const item = state.items[existingIndex]
          const validation = validateVariantQuantity(item.variant, quantity, 0)

          if (!validation.valid) {
            console.warn(" Update quantity validation failed:", validation.error)
            state.lastError = validation.error
            return
          }

          state.lastError = validation.capped ? validation.error : null
          state.items[existingIndex].quantity = validation.quantity
        }
        saveToStorage(state.items)
      }
    },
    removeFromCart: (state, action) => {
      const { productId, variantId } = action.payload
      const cartItemKey = getCartItemKey(productId, variantId)
      state.items = state.items.filter((item) => item.cartItemKey !== cartItemKey)
      state.lastError = null
      saveToStorage(state.items)
    },
    decrementQuantity: (state, action) => {
      const { productId, variantId } = action.payload
      const cartItemKey = getCartItemKey(productId, variantId)
      const existingIndex = state.items.findIndex((item) => item.cartItemKey === cartItemKey)

      if (existingIndex !== -1) {
        const item = state.items[existingIndex]
        const newQuantity = item.quantity - 1

        if (item.variant?.minLimit && newQuantity < item.variant.minLimit && newQuantity > 0) {
          state.lastError = `Minimum order quantity is ${item.variant.minLimit}`
          return
        }

        if (newQuantity <= 0) {
          state.items.splice(existingIndex, 1)
        } else {
          item.quantity = newQuantity
        }
        state.lastError = null
        saveToStorage(state.items)
      }
    },
    clearCart: (state) => {
      state.items = []
      state.lastError = null
      saveToStorage(state.items)
    },
    openCart: (state) => { state.isOpen = true },
    closeCart: (state) => { state.isOpen = false },
    toggleCart: (state) => { state.isOpen = true },
  },
})

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartError = (state) => state.cart.lastError
export const selectCartItemCount = (state) => state.cart.items.reduce((total, item) => total + item.quantity, 0)
export const selectCartDisplayTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.displayPrice * item.quantity, 0)
export const selectIsInCart = (items, productId, variantId = null) => {
  if (!productId || !items || !Array.isArray(items)) return false
  const cartItemKey = getCartItemKey(productId, variantId)
  return items.some((item) => item.cartItemKey === cartItemKey)
}
export const selectCartItemQuantity = (items, productId, variantId = null) => {
  if (!productId || !items || !Array.isArray(items)) return 0
  const cartItemKey = getCartItemKey(productId, variantId)
  const item = items.find((item) => item.cartItemKey === cartItemKey)
  return item?.quantity || 0
}

export const {
  hydrateCart,
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
} = cartSlice.actions

export default cartSlice.reducer
