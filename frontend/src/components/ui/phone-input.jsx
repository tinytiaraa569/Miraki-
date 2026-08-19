import * as React from "react"
import { ChevronDown } from "lucide-react"
import RPNInput, { getCountryCallingCode, parsePhoneNumber } from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// PHONE INPUT — international phone field: flag + dial-code country picker on
// the left, a normal text field on the right. Built on `react-phone-number-input`
// (bundled libphonenumber-js) so it validates + formats and emits clean E.164
// (e.g. "+15855551234"). The country dropdown is composed from our own shadcn
// Popover / ScrollArea (no cmdk dependency) and renders the library's SVG flags
// — so flags show correctly on Windows, unlike flag emoji.
//
// Reusable: drop <PhoneInput value onChange /> anywhere. `onChange` receives the
// E.164 string ("" when empty), NOT a DOM event.
// ---------------------------------------------------------------------------

// libphonenumber throws for the odd non-geographic entry — never let that break
// a render.
function callingCode(country) {
  try {
    return country ? getCountryCallingCode(country) : ""
  } catch {
    return ""
  }
}

// Legacy / hand-typed numbers may be stored in national format (e.g. "5855666666"
// or "(585) 566-6666") rather than E.164. The picker only detects a country from
// an E.164 value, so a national number leaves the flag blank. Parse it against
// the default country and hand the component a normalized "+15855666666" for
// DISPLAY only — we never push this back up, so the field isn't marked dirty and
// the stored value is untouched until the user actually edits it.
function toDisplayValue(value, defaultCountry) {
  if (!value) return undefined
  if (value.startsWith("+")) return value
  try {
    const parsed = parsePhoneNumber(value, defaultCountry)
    if (parsed?.number) return parsed.number
  } catch {
    // fall through — show the raw value rather than nothing
  }
  return value
}

function FlagComponent({ country, countryName }) {
  const Flag = country ? flags[country] : null
  return (
    <span className="flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
      {Flag ? <Flag title={countryName} /> : null}
    </span>
  )
}

// react-phone-number-input calls this as `countrySelectComponent`, handing us
// { value: <selected ISO code>, onChange, options: [{ value, label }], disabled }.
function CountrySelect({ disabled, value, onChange, options }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  // Drop the "International" (no-country) entry; keep only real countries.
  const countries = React.useMemo(() => options.filter((o) => o.value), [options])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    const digits = q.replace(/^\+/, "")
    return countries.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        callingCode(o.value).includes(digits),
    )
  }, [countries, query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="flex h-9 gap-1 rounded-e-none rounded-s-md border-r-0 border-input px-3 focus:z-10"
          aria-label="Select country calling code"
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0">
        <div className="border-b p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code"
            className="h-8"
          />
        </div>
        <ScrollArea className="w-96 min-w-96 h-64">
          {/* pr-2.5 reserves room for the overlay scrollbar so the dial-code
              column on the right is never clipped. */}
          <div className="p-1 pr-2.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No country found.</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                    setQuery("")
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    o.value === value && "bg-accent",
                  )}
                >
                  <FlagComponent country={o.value} countryName={o.label} />
                  <span className="flex-1 truncate">{o.label}</span>
                  <span className="text-muted-foreground">+{callingCode(o.value)}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

// The text field on the right — our shadcn Input with its left edge squared off
// so it joins the country button seamlessly, plus a little extra padding on the
// right so the typed number never sits flush against the border.
const PhoneTextInput = React.forwardRef(function PhoneTextInput({ className, ...props }, ref) {
  return <Input ref={ref} className={cn("min-w-0 flex-1 rounded-s-none pr-4", className)} {...props} />
})

export const PhoneInput = React.forwardRef(function PhoneInput(
  { className, value, onChange, defaultCountry = "US", disabled, id, placeholder, ...props },
  ref,
) {
  return (
    <RPNInput
      ref={ref}
      id={id}
      className={cn("flex w-full items-center", className)}
      value={toDisplayValue(value, defaultCountry)}
      onChange={(next) => onChange?.(next || "")}
      defaultCountry={defaultCountry}
      international
      countryCallingCodeEditable={false}
      flags={flags}
      countrySelectComponent={CountrySelect}
      inputComponent={PhoneTextInput}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  )
})
