"use client"

import { useState } from "react"
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSellerAuth } from "@/hooks/use-seller-auth"
import { ApiError } from "@/lib/api"

function GlassInput({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full min-w-0 rounded-lg border border-transparent bg-white/5 px-3 py-1 text-sm text-white outline-none transition-colors duration-200",
        "placeholder:text-white/30 focus:border-white/20 focus:bg-white/10",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export function SellerLoginPage() {
  const { login } = useSellerAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      // useSellerAuth revalidated /seller/me — App switches to the Hub.
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 429 ? "Too many attempts. Try again later." : err.message)
      } else {
        setError("Unable to reach the server.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black p-4">
      <style>{`
        @keyframes seller-card-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Warm ambient background — distinct from the platform's blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1f4d3a]/60 via-[#0d2b1f]/90 to-black/40" aria-hidden="true" />
      <div
        className="absolute top-0 left-1/2 h-[60vh] w-[120vh] -translate-x-1/2 rounded-b-[50%] bg-[#14382a]/70 blur-[80px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md" style={{ animation: "seller-card-in 0.7s ease-out both" }}>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 space-y-1 text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-xl border border-white/10 bg-white/10">
              <Store className="size-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent text-balance">
              Seller Hub
            </h1>
            <p className="text-xs text-white/60">Sign in to manage your stores and business profile</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-3">
              <div className="relative flex items-center overflow-hidden rounded-lg">
                <Mail
                  className={cn(
                    "absolute left-3 size-4 transition-colors duration-200",
                    focusedInput === "email" ? "text-white" : "text-white/40",
                  )}
                  aria-hidden="true"
                />
                <GlassInput
                  id="seller-email"
                  type="email"
                  autoComplete="username"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-3 pl-10"
                  required
                  aria-label="Email address"
                />
              </div>

              <div className="relative flex items-center overflow-hidden rounded-lg">
                <Lock
                  className={cn(
                    "absolute left-3 size-4 transition-colors duration-200",
                    focusedInput === "password" ? "text-white" : "text-white/40",
                  )}
                  aria-hidden="true"
                />
                <GlassInput
                  id="seller-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-10 pl-10"
                  required
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-white/40 transition-colors duration-200 hover:text-white" />
                  ) : (
                    <Eye className="size-4 text-white/40 transition-colors duration-200 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!email || !password || submitting}
              className="group/button relative mt-1 w-full cursor-pointer transition-transform duration-200 hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-60"
            >
              <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-[#0d2b1f] transition-all duration-200">
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                    Sign in
                    <ArrowRight
                      className="size-3.5 transition-transform duration-200 group-hover/button:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </div>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Access is logged and audited. Unauthorized use is prohibited.
        </p>
      </div>
    </main>
  )
}
