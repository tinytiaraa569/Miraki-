"use client"

import { useCallback, useSyncExternalStore } from "react"

// Tiny external store so every component using the hook stays in sync.
// Preference can be "light" | "dark" | "system"; the resolved theme is
// always "light" | "dark".
let listeners = []

const media =
  typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null

function getPreference() {
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {
    /* storage unavailable */
  }
  // No saved preference — fall back to whatever is currently applied.
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function resolve(preference) {
  if (preference === "system") return media?.matches ? "dark" : "light"
  return preference
}

function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function apply() {
  document.documentElement.classList.toggle("dark", resolve(getPreference()) === "dark")
  for (const l of listeners) l()
}

// Re-apply when the OS theme changes and the user follows the system.
media?.addEventListener("change", () => {
  if (getPreference() === "system") apply()
})

function subscribe(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function setTheme(next) {
  try {
    localStorage.setItem("theme", next)
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
  apply()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark")
  const preference = useSyncExternalStore(subscribe, getPreference, () => "dark")

  const toggleTheme = useCallback(() => {
    setTheme(getTheme() === "dark" ? "light" : "dark")
  }, [])

  return { theme, preference, toggleTheme, setTheme }
}
