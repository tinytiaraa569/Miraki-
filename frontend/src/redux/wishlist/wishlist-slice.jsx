import { createSlice } from "@reduxjs/toolkit"

const STORAGE_KEY = "storefront_wishlist"

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
    console.error("Failed to save wishlist:", error)
  }
}

const getItemId = (item) => item._id || item.id

const initialState = {
  items: [],
  isHydrated: false,
}

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    hydrate: (state) => {
      state.items = loadFromStorage()
      state.isHydrated = true
    },
    addItem: (state, action) => {
      const payloadId = getItemId(action.payload)
      const exists = state.items.some((item) => getItemId(item) === payloadId)
      if (!exists) {
        state.items.push(action.payload)
        saveToStorage(state.items)
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => getItemId(item) !== action.payload)
      saveToStorage(state.items)
    },
    toggleItem: (state, action) => {
      const payloadId = getItemId(action.payload)
      const exists = state.items.some((item) => getItemId(item) === payloadId)
      if (exists) {
        state.items = state.items.filter((item) => getItemId(item) !== payloadId)
      } else {
        state.items.push(action.payload)
      }
      saveToStorage(state.items)
    },
    clearWishlist: (state) => {
      state.items = []
      saveToStorage(state.items)
    },
  },
})

export const { hydrate, addItem, removeItem, toggleItem, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
