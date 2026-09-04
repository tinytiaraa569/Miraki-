"use client"

import { useRef, useEffect } from "react"
import { Provider } from "react-redux"
import { makeStore } from "./store"
import { hydrateCart } from "./cartpage/cart-page-slice"
import { hydrate } from "./wishlist/wishlist-slice"


export function StoreProvider({ children }) {
  const storeRef = useRef(null)

  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.dispatch(hydrate())
      storeRef.current.dispatch(hydrateCart())
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}
