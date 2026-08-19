"use client"

import { useState } from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStoreAdminAuth } from "@/hooks/use-storeadmin-auth"
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

export function SellerLoginPage() {
  const storeAdminAuth = useStoreAdminAuth()
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
      const mode = await storeAdminAuth.login(email, password)
      if (mode === null) {
        return
      }
      if (mode === "enroll") {
        const res = await storeAdminAuth.setup2fa()
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
      await storeAdminAuth.verify2fa(code)
    } catch (err) {
      fail(err)
      setCode("")
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

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bc0753]/60 via-[#740031]/90 to-black/35" aria-hidden="true" />
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
        aria-hidden="true"
      />
      {/* Static + animated glow */}
      <div
        className="absolute top-0 left-1/2 h-[60vh] w-[120vh] -translate-x-1/2 rounded-b-[50%] bg-[#740031]/70 blur-[80px]"
        aria-hidden="true"
      />
      <motion.div
        className="absolute top-0 left-1/2 h-[60vh] w-[100vh] -translate-x-1/2 rounded-b-full bg-[#740031]/90 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md" style={{ animation: "seller-card-in 0.7s ease-out both" }}>
        <div className="relative">
          <div className="absolute -inset-[0.5px] overflow-hidden rounded-2xl" aria-hidden="true">
            <motion.div
              className="absolute top-0 left-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
              transition={{
                left: { duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 },
                opacity: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" },
              }}
            />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 space-y-1 text-center">
              <div className="mx-auto mb-3 flex h-20 w-56 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-white px-3">
                <img src="/images/logo/logo.png" alt="Miraki Jewels" className=" h-20 w-56 object-contain scale-200" />
              </div>
            <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent text-balance">
              {step === "password" && "Miraki Jewels"}
              {step === "enroll" && "Secure Your Account"}
              {step === "code" && "Verification Code"}
            </h1>
            <p className="text-xs text-white/60">
              {step === "password" && "Sign in to manage your stores and business profile"}
              {step === "enroll" && "Two-factor authentication setup"}
              {step === "code" && "Enter your 6-digit code to continue"}
            </p>
          </div>

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

              {error && <FormError message={error} />}

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
          )}

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

              <button
                type="button"
                onClick={() => setStep("code")}
                className="relative mt-1 w-full cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
              >
                <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white text-sm font-semibold text-[#0d2b1f]">
                  I&apos;ve scanned it — enter code
                </div>
              </button>
            </div>
          )}

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

              <button
                type="submit"
                disabled={code.length !== 6 || submitting}
                className="group/button relative mt-1 w-full cursor-pointer transition-transform duration-200 hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-60"
              >
                <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white text-sm font-semibold text-[#0d2b1f]">
                  {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Verify and sign in"}
                </div>
              </button>

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
