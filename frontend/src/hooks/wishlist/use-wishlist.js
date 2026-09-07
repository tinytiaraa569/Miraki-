"use client"

import { useCallback } from "react"
import { addItem, removeItem, toggleItem, clearWishlist } from "@/redux/wishlist/wishlist-slice"

import { useDispatch, useSelector } from "react-redux"


export function useWishlist() {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.wishlist.items)
  const isHydrated = useSelector((state) => state.wishlist.isHydrated)
  const count = items.length

  const add = useCallback(
    (product) => {
      dispatch(addItem(product))
    },
    [dispatch],
  )

  const remove = useCallback(
    (productId) => {
      dispatch(removeItem(productId))
    },
    [dispatch],
  )

  const toggle = useCallback(
    (product) => {
      dispatch(toggleItem(product))
    },
    [dispatch],
  )

  const clear = useCallback(() => {
    dispatch(clearWishlist())
  }, [dispatch])

  const isInWishlist = useCallback(
    (productId) => {
      return items.some((item) => item.id || item._id === productId)
    },
    [items],
  )

  return {
    items,
    count,
    isHydrated,
    add,
    remove,
    toggle,
    clear,
    isInWishlist,
  }
}
