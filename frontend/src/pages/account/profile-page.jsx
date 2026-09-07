"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { KeyRound, Pencil, X, Check } from "lucide-react"
import { AccountLayout } from "@/components/storefront/account-layout"
// Swap this for whatever thunk/action actually persists profile edits.
// import { updateProfile } from "@/redux/auth/auth-slice"

/* ---------------------------------------------------------------------------
   AccountProfilePage — /account/profile. All chrome (Header, sidebar, Footer,
   CartDrawer) lives in AccountLayout; this component only renders the
   Personal Information card from the reference screenshot.
--------------------------------------------------------------------------- */

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-sf-muted">{label}</p>
      {value ? (
        <p className="mt-1 text-sm text-sf-ink">{value}</p>
      ) : (
        <p className="mt-1 text-sm font-medium text-sf-brand">Please Update</p>
      )}
    </div>
  )
}

export default function AccountProfilePage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth?.user) || {}

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
  })

  function onSignOut() {
    // dispatch(logout())
  }

  function onSave(e) {
    e.preventDefault()
    // dispatch(updateProfile(form))
    setEditing(false)
  }

  return (
    <AccountLayout title="My Profile" onSignOut={onSignOut}>
      <h1 className="font-sf-display text-xl text-sf-ink">My Profile</h1>

      <div className="mt-6 rounded-lg border border-sf-line bg-sf-bg p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sf-display text-sm font-semibold text-sf-ink">Personal Information</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-sf-brand px-4 py-2 text-xs font-medium tracking-wide text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
            >
              Change Password
              <KeyRound className="size-3.5" aria-hidden="true" />
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel editing"
                className="inline-flex items-center gap-2 rounded-md border border-sf-line px-4 py-2 text-xs font-medium tracking-wide text-sf-ink uppercase transition-colors hover:bg-sf-surface"
              >
                Cancel
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-md bg-sf-brand px-4 py-2 text-xs font-medium tracking-wide text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
              >
                Edit
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={onSave} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-sf-muted">First Name</span>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="rounded-md border border-sf-line bg-sf-paper px-3 py-2 text-sm text-sf-ink outline-none focus:border-sf-brand"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-sf-muted">Last Name</span>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Add your last name"
                className="rounded-md border border-sf-line bg-sf-paper px-3 py-2 text-sm text-sf-ink outline-none placeholder:text-sf-muted focus:border-sf-brand"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-sf-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-md border border-sf-line bg-sf-paper px-3 py-2 text-sm text-sf-ink outline-none focus:border-sf-brand"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-sf-muted">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-md border border-sf-line bg-sf-paper px-3 py-2 text-sm text-sf-ink outline-none focus:border-sf-brand"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-sf-brand px-6 py-2.5 text-xs font-medium tracking-wide text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
              >
                Save Changes
                <Check className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field label="First Name" value={form.firstName} />
            <Field label="Last Name" value={form.lastName} />
            <Field label="Email" value={form.email} />
            <Field label="Phone" value={form.phone} />
          </div>
        )}
      </div>
    </AccountLayout>
  )
}