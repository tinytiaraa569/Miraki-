"use client"

import { useState, useRef, useEffect } from "react"
import { useStorefront } from "@/components/storefront/storefront-context"
import { LANGUAGES } from "@/lib/store-data"

export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useStorefront()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (availableLocales.length < 2) return null 


  const options = availableLocales
    .map((code) => LANGUAGES.find((l) => l.code === code))
    .filter(Boolean)

  const current = options.find((l) => l.code === locale)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-sf-ink/20 px-3 py-1.5 text-xs font-medium tracking-wide text-sf-ink hover:bg-sf-surface"
      >
        {current?.name ?? locale.toUpperCase()}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-sf-ink/10 bg-sf-bg py-1 shadow-lg"
        >
          {options.map((lang) => (
            <li key={lang.code}>
              <button
                role="option"
                aria-selected={locale === lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  locale === lang.code
                    ? "bg-sf-ink/5 font-medium text-sf-ink"
                    : "text-sf-ink/70 hover:bg-sf-surface"
                }`}
              >
                {lang.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}