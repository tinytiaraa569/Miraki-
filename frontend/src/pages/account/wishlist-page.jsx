"use client"

import { Link } from "react-router-dom"
import { Eye, Heart, HeartOff, Trash2 } from "lucide-react"
import { AccountLayout } from "@/components/storefront/account-layout"
import { useWishlist } from "@/hooks/wishlist/use-wishlist"
import { useStorefront } from "@/components/storefront/storefront-context"



function WishlistContent() {
  const { items, toggle,remove, isInWishlist } = useWishlist()
  const { formatPrice } = useStorefront()

  if (items.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <HeartOff className="size-8 text-sf-muted" aria-hidden="true" />
        <p className="text-sm text-sf-muted">Nothing here yet — tap the heart on any piece to save it.</p>
        <Link
          to="/jewelry"
          className="mt-2 inline-block border border-sf-brand px-6 py-2.5 text-xs tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
        >
          Browse Jewelry
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const id = item._id || item.id
        const href = item.alias ? `/product/${item.alias}` : null
        const Card = href ? Link : "article"
        const cardProps = href ? { to: href } : {}
        const wished = isInWishlist(id)
        return (
          <div key={id} className="group">
            <div className="relative aspect-square overflow-hidden bg-sf-surface">
              <Card className="absolute inset-0 block" {...cardProps}>
                <img
                  src={item.mainImg || item.image || "/placeholder.svg"}
                  alt={item.name}
                  width="600"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Card>
                <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Remove ${item.name} from wishlist`}
                className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-sf-paper/90 shadow-sm backdrop-blur transition-colors hover:bg-sf-paper"
              >
                <Trash2 className="size-4 text-red-500" aria-hidden="true" />
              </button>
              <div className="absolute  right-3 top-14 z-10 flex flex-col justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {href ? (
                  <Link
                    to={href}
                    aria-label={`View ${item.name}`}
                    className="grid size-9 place-items-center rounded-full bg-sf-paper/90 shadow-sm backdrop-blur transition-colors hover:bg-sf-paper"
                  >
                    <Eye className="size-4 text-sf-ink" aria-hidden="true" />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-label={wished ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                  aria-pressed={wished}
                  className="grid size-9 place-items-center rounded-full bg-sf-paper/90 shadow-sm backdrop-blur transition-colors hover:bg-sf-paper"
                >
                  <Heart
                    className={`size-4 transition-colors ${wished ? "fill-sf-brand text-sf-brand" : "text-sf-ink"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            <p className="mt-3 truncate text-sm text-sf-ink">{item.name}</p>
            <p className="text-sm text-sf-ink">{formatPrice ? formatPrice(item.price) : `$${item.price}`}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function AccountWishlistPage() {
  function onSignOut() {
    // dispatch(logout())
  }

  return (
    <AccountLayout title="My Wishlist" onSignOut={onSignOut}>
      <h1 className="font-sf-display text-xl font-bold text-sf-ink">My Wishlist</h1>
      <WishlistContent />
    </AccountLayout>
  )
}