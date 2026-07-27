"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"

const RULES = [
  { id: "length", label: "At least 12 characters", test: (p) => p.length >= 12 },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "One number", test: (p) => /\d/.test(p) },
  { id: "symbol", label: "One symbol", test: (p) => /[^a-zA-Z0-9]/.test(p) },
]

/* ------------------------------------------------------------------ */
/*  Local glass-styled input (same treatment as the login page)        */
/* ------------------------------------------------------------------ */
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

function FormError({ message }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Submit button with hover glow (same as login page)                 */
/* ------------------------------------------------------------------ */
function GlowButton({ children, loading, disabled, ...props }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="group/button relative mt-1 w-full cursor-pointer transition-transform duration-200 hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-60"
      {...props}
    >
      <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-70" />
      <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-[#0b1030] transition-all duration-200">
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <span className="flex items-center justify-center gap-1.5 text-sm font-semibold">
            {children}
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover/button:translate-x-1"
              aria-hidden="true"
            />
          </span>
        )}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export function ActivatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  // "verifying" | "invalid" | "form" | "submitting" | "done"
  const [phase, setPhase] = useState("verifying")
  const [info, setInfo] = useState(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function verify() {
      if (!token) {
        setPhase("invalid")
        return
      }
      try {
        const res = await api.get(`/activate/verify?token=${encodeURIComponent(token)}`)
        if (!cancelled) {
          setInfo(res)
          setPhase("form")
        }
      } catch {
        if (!cancelled) setPhase("invalid")
      }
    }
    verify()
    return () => {
      cancelled = true
    }
  }, [token])

  const ruleResults = RULES.map((r) => ({ ...r, ok: r.test(password) }))
  const allRulesPass = ruleResults.every((r) => r.ok)
  const confirmMatches = confirm.length > 0 && password === confirm
  const canSubmit = allRulesPass && confirmMatches && phase === "form"

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setPhase("submitting")
    try {
      await api.post("/activate", { token, password })
      setPhase("done")
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setPhase("invalid")
      } else {
        setError(err instanceof ApiError ? err.message : "Unable to reach the server.")
        setPhase("form")
      }
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black p-4">
      {/* Scoped keyframes for the ambient animations */}
      <style>{`
        @keyframes login-glow-pulse {
          0%, 100% { opacity: 0.35; transform: translateX(-50%) scale(0.98); }
          50% { opacity: 0.6; transform: translateX(-50%) scale(1.03); }
        }
        @keyframes login-border-sweep {
          0% { left: -50%; opacity: 0.3; }
          50% { opacity: 0.8; }
          100% { left: 100%; opacity: 0.3; }
        }
        @keyframes login-card-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-logo-in {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Background gradient effect */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#2b3a8f]/60 via-[#141b4d]/90 to-black/40"
        aria-hidden="true"
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Ambient glow shapes */}
      <div
        className="absolute top-0 left-1/2 h-[60vh] w-[120vh] -translate-x-1/2 rounded-b-[50%] bg-[#1b2568]/70 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 h-[60vh] w-[100vh] rounded-b-full bg-[#232f7d]/90 blur-[60px]"
        aria-hidden="true"
        style={{ animation: "login-glow-pulse 12s ease-in-out infinite" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md" style={{ animation: "login-card-in 0.8s ease-out both" }}>
        <div className="group relative">
          {/* Animated border sweep */}
          <div className="absolute -inset-[0.5px] overflow-hidden rounded-2xl" aria-hidden="true">
            <div
              className="absolute top-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ animation: "login-border-sweep 5s ease-in-out infinite" }}
            />
          </div>

          {/* Glass card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
            {/* Logo and header */}
            <div className="mb-5 space-y-1 text-center">
              <div
                className="mx-auto mb-3 flex h-20 w-56 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white px-4"
                style={{ animation: "login-logo-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
              >
                <img
                  src="/images/logo-full.png"
                  alt="Secure Access Tech"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent text-balance">
                {phase === "done" ? "Account Activated" : "Seller Activation"}
              </h1>
              <p className="flex items-center justify-center gap-1.5 text-xs text-white/60">
                <ShieldCheck className="size-3.5 text-white/50" aria-hidden="true" />
                {phase === "done" ? "You're all set" : "Set up your owner account"}
              </p>
            </div>

            {/* ---------------- Verifying ---------------- */}
            {phase === "verifying" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="size-6 animate-spin text-white/50" aria-hidden="true" />
                <p className="text-sm text-white/60">Verifying your activation link…</p>
              </div>
            )}

            {/* ---------------- Invalid ---------------- */}
            {phase === "invalid" && (
              <div className="flex flex-col gap-4">
                <FormError message="This activation link is invalid, expired, or has already been used." />
                <p className="text-sm leading-relaxed text-white/60">
                  Activation links are single-use and expire after 15 minutes. Contact your platform administrator to
                  request a new activation link.
                </p>
              </div>
            )}

            {/* ---------------- Form ---------------- */}
            {(phase === "form" || phase === "submitting") && info && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <p className="text-sm leading-relaxed text-white/60">
                  Activating the owner account for <span className="font-medium text-white">{info.businessName}</span>
                </p>

                <div className="space-y-3">
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Mail className="absolute left-3 size-4 text-white/40" aria-hidden="true" />
                    <GlassInput
                      id="activate-email"
                      type="email"
                      autoComplete="username"
                      value={info.email}
                      disabled
                      className="pr-3 pl-10"
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
                      id="activate-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      className="pr-10 pl-10"
                      required
                      autoFocus
                      aria-label="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
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

                  <ul
                    className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                    aria-label="Password requirements"
                  >
                    {ruleResults.map((rule) => (
                      <li key={rule.id} className="flex items-center gap-2 text-xs">
                        {rule.ok ? (
                          <Check className="size-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <X className="size-3.5 text-white/30" aria-hidden="true" />
                        )}
                        <span className={rule.ok ? "text-white" : "text-white/50"}>{rule.label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock
                      className={cn(
                        "absolute left-3 size-4 transition-colors duration-200",
                        focusedInput === "confirm" ? "text-white" : "text-white/40",
                      )}
                      aria-hidden="true"
                    />
                    <GlassInput
                      id="activate-confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onFocus={() => setFocusedInput("confirm")}
                      onBlur={() => setFocusedInput(null)}
                      className="pr-3 pl-10"
                      required
                      aria-label="Confirm password"
                    />
                  </div>
                  {confirm.length > 0 && !confirmMatches && (
                    <p className="text-xs text-red-300">Passwords do not match</p>
                  )}
                </div>

                {error && <FormError message={error} />}

                <GlowButton loading={phase === "submitting"} disabled={!canSubmit}>
                  Activate account
                </GlowButton>
              </form>
            )}

            {/* ---------------- Done ---------------- */}
            {phase === "done" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-emerald-200">
                    Your owner account for <span className="font-medium text-white">{info?.businessName}</span> is now
                    active.
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  You can now sign in to your Seller Hub with your email and the password you just set.
                </p>
                <GlowButton type="button" onClick={() => navigate("/", { replace: true })}>
                  Go to sign in
                </GlowButton>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Activation links are single-use and expire after 15 minutes.
        </p>
      </div>
    </main>
  )
}
