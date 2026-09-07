import { configureStore } from "@reduxjs/toolkit"
import cartReducer from './cartpage/cart-page-slice'
import wishlistReducer from "./wishlist/wishlist-slice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      wishlist: wishlistReducer,
      cart: cartReducer,
    },
  })
}
