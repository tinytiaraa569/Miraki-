"use client"

import { Link, useLocation } from "react-router-dom"
import { User, Truck, MapPin, Heart, Wallet, LogOut } from "lucide-react"
import { useSelector } from "react-redux"

/* ---------------------------------------------------------------------------
   AccountSidebar — left rail rendered by AccountLayout on every /account/*
   page (Profile, Orders, Addresses, Wishlist, Wallets). Active state is
   derived from the current route.
--------------------------------------------------------------------------- */

const NAV_ITEMS = [
  { href: "/account/profile", label: "Profile", sub: "Add your personal info", icon: User },
  { href: "/account/orders", label: "Orders", sub: "Track your recent orders", icon: Truck },
  { href: "/account/addresses", label: "Addresses", sub: "Save multiple addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", sub: "Check your wishlist", icon: Heart },
  { href: "/account/wallets", label: "Wallets", sub: "Check your wallet", icon: Wallet },
]

export function AccountSidebar({ onSignOut }) {
  const { pathname } = useLocation()
  const user = useSelector((state) => state.auth?.user) || {}
  const name = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name
  return (
    <aside className="w-full shrink-0 border-b border-sf-line md:w-72 lg:border-b-0 lg:border-r">
      {/* Account summary */}
      <div className="flex items-center gap-3 border-b border-sf-line px-6 py-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sf-surface text-sf-ink">
          <User className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-sf-display text-xl font-bold text-sf-ink">{name || "My Account"}</p>
          <p className="truncate text-xs text-sf-muted">{user.email}</p>
          <p className="truncate text-xs text-sf-muted">{user.phone}</p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Account" className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-start gap-3 border-b border-sf-line px-6 py-4 transition-colors "
            >
              <Icon
                className={`mt-0.5 size-6 shrink-0 ${active ? "text-sf-brand" : "text-sf-ink"}`}
                aria-hidden="true"
              />
              <span>
                <span
                  className={`block font-sf-display text-lg font-bold ${
                    active ? "text-sf-brand" : "text-sf-ink"
                  }`}
                >
                  {item.label}
                </span>
                <span className="block text-sm font-sf-display text-sf-ink">{item.sub}</span>
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={onSignOut}
          className="flex items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-sf-surface/60"
        >
          <LogOut className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
          <span>
            <span className="block font-sf-display text-md font-semibold text-red-600">Sign Out</span>
            <span className="block text-xs text-sf-muted">Sign out your account</span>
          </span>
        </button>
      </nav>
    </aside>
  )
}