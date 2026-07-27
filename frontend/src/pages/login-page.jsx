"use client"

import { useState } from "react"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  ScanLine,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"

/* ------------------------------------------------------------------ */
/*  Local glass-styled input (kept in this file only)                  */
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
/*  Submit button with hover glow                                      */
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
export function LoginPage() {
  const { login, setup2fa, verify2fa } = useAuth()
  const [step, setStep] = useState("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [code, setCode] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [secret, setSecret] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function fail(err) {
    if (err instanceof ApiError) {
      setError(err.status === 429 ? "Too many attempts. Try again later." : err.message)
    } else {
      setError("Unable to reach the server.")
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const mode = await login(email, password)
      if (mode === null) {
        // Two-step verification is disabled — session already issued; useAuth
        // revalidated /auth/me and App switches to the dashboard.
        return
      }
      if (mode === "enroll") {
        const res = await setup2fa()
        setQrDataUrl(res.qrDataUrl)
        setSecret(res.secret)
        setStep("enroll")
      } else {
        setStep("code")
      }
    } catch (err) {
      fail(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCode(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verify2fa(code)
      // useAuth revalidates /auth/me — App switches to the dashboard.
    } catch (err) {
      fail(err)
      setCode("")
    } finally {
      setSubmitting(false)
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#2b3a8f]/60 via-[#141b4d]/90 to-black/40" aria-hidden="true" />

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
      <div
        className="relative z-10 w-full max-w-md"
        style={{ animation: "login-card-in 0.8s ease-out both" }}
      >
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
                {step === "password" && "Platform Control"}
                {step === "enroll" && "Secure Your Account"}
                {step === "code" && "Verification Code"}
              </h1>
              <p className="flex items-center justify-center gap-1.5 text-xs text-white/60">
                <ShieldCheck className="size-3.5 text-white/50" aria-hidden="true" />
                {step === "password" && "Superadmin access only — step 1 of 2"}
                {step === "enroll" && "Two-factor authentication setup"}
                {step === "code" && "Step 2 of 2 — enter your 6-digit code"}
              </p>
            </div>

            {/* ---------------- Step 1: credentials ---------------- */}
            {step === "password" && (
              <form onSubmit={handlePassword} className="space-y-4" noValidate>
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
                      id="email"
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
                      id="password"
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

                {error && <FormError message={error} />}

                <GlowButton loading={submitting} disabled={!email || !password}>
                  Continue
                </GlowButton>
              </form>
            )}

            {/* ---------------- Step: 2FA enrollment ---------------- */}
            {step === "enroll" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <ScanLine className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-white/60">
                    Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy), then
                    continue. You can turn this off later in Settings.
                  </p>
                </div>

                {qrDataUrl && (
                  <div className="flex justify-center rounded-lg border border-white/10 bg-white p-4">
                    <img src={qrDataUrl || "/placeholder.svg"} alt="TOTP enrollment QR code" width={200} height={200} />
                  </div>
                )}

                {secret && (
                  <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3">
                    <span className="text-xs text-white/50">Manual entry key</span>
                    <span className="font-mono text-xs break-all text-white">{secret}</span>
                  </div>
                )}

                <GlowButton onClick={() => setStep("code")} type="button">
                  I&apos;ve scanned it — enter code
                </GlowButton>
              </div>
            )}

            {/* ---------------- Step 2: verification code ---------------- */}
            {step === "code" && (
              <form onSubmit={handleCode} className="space-y-4" noValidate>
                <div className="relative flex items-center overflow-hidden rounded-lg">
                  <KeyRound
                    className={cn(
                      "absolute left-3 size-4 transition-colors duration-200",
                      focusedInput === "totp" ? "text-white" : "text-white/40",
                    )}
                    aria-hidden="true"
                  />
                  <GlassInput
                    id="totp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onFocus={() => setFocusedInput("totp")}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-10 text-center font-mono text-lg tracking-[0.5em]"
                    required
                    autoFocus
                    aria-label="6-digit verification code"
                  />
                </div>

                {error && <FormError message={error} />}

                <GlowButton loading={submitting} disabled={code.length !== 6}>
                  Verify and sign in
                </GlowButton>

                <button
                  type="button"
                  onClick={() => {
                    setStep("password")
                    setCode("")
                    setError(null)
                  }}
                  className="w-full cursor-pointer text-center text-xs text-white/50 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
                >
                  Start over
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Access is logged and audited. Unauthorized use is prohibited.
        </p>
      </div>
    </main>
  )
}
