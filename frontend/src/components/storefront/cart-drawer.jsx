"use client"

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useStorefront } from "@/components/storefront/storefront-context"
import { useCart } from "@/hooks/cart/use-cart"
import { Link } from "react-router-dom"

const SF_MAROON = "#740031"
const NON_VARIANT_OPTION_TYPES = ["textarea", "date", "checkbox", "text"]


function CartLineItem({ item }) {
  const { formatPrice } = useStorefront()
  const { increment, decrement, removeItem } = useCart()

  const options = item.selectedOptions || []
  const name = item.product?.name
  const alias = item.product?.alias

  return (
    <li className="flex gap-3 py-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-sf-surface">
        <img src={item.image || "/placeholder.svg"} alt={name} width="80" height="80" className="size-full object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${alias}`} className="truncate text-md font-semibold text-sf-ink">
            {name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            aria-label={`Remove ${name}`}
            className="shrink-0 transition-colors hover:opacity-70"
            style={{ color: SF_MAROON }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

      {options.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {options
              .filter(
                (o) =>
                  !NON_VARIANT_OPTION_TYPES.includes(o.type?.toLowerCase())
              )
              .map((o) => (
                <p key={o.label ?? o.name} className="text-md text-sf-ink">
                  <span className="font-semibold">{o.label ?? o.name}</span>
                  <span>: {o.valueLabel ?? o.value}</span>
                </p>
              ))}
          </div>
        ) : null}

        <span className="mt-0.5 text-md font-bold" style={{ color: SF_MAROON }}>
          {formatPrice(item.displayPrice)}
        </span>

        <div className="mt-1 flex items-center gap-2 rounded-md border border-sf-brand/20 w-fit">
          <button
            type="button"
            onClick={() => decrement(item.productId, item.variantId)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
            className="grid size-7 place-items-center text-sf-ink disabled:opacity-30"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span className="w-4 text-center text-md text-sf-ink">{item.quantity}</span>
          <button
            type="button"
            onClick={() => increment(item.productId, item.variantId)}
            aria-label="Increase quantity"
            className="grid size-7 place-items-center text-sf-ink"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}

export function CartDrawer() {
  const { formatPrice } = useStorefront()
  const { items, displayTotal, isOpen, close } = useCart()
  const hasItems = items.length > 0

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col font-['Times_New_Roman'] bg-sf-paper shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-primary-foreground px-5 py-4">
          <h2 className="text-lg text-sf-ink">Your Shopping Bag</h2>
          <button type="button" onClick={close} aria-label="Close cart" className="text-sf-muted hover:text-sf-brand">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {!hasItems ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <ShoppingBag className="size-8 text-sf-muted" aria-hidden="true" />
              <p className="text-sm text-sf-muted">Your cart is empty</p>
            </div>
          ) : (
            <ul className="divide-y divide-sf-brand/10">
              {items.map((item) => (
                <CartLineItem key={item.cartItemKey} item={item} />
              ))}
            </ul>
          )}
        </div>

        {hasItems ? (
          <div className="flex flex-col gap-3 bg-primary-foreground px-5 py-4">
            <div className="flex items-center justify-between text-sm text-sf-ink">
              <span>Total</span>
              <span className="text-base font-bold">{formatPrice(displayTotal)}</span>
            </div>
            <div className="border-t border-sf-brand/15" />
            <Link
              to="/checkout"
              className="w-full cursor-pointer px-6 py-3.5 text-center text-sm font-medium tracking-widest text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: SF_MAROON }}
            >
              View Cart
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  )
}