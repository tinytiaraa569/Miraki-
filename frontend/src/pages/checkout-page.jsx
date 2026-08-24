"use client"

import { useState } from "react"
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Home,
  Loader2,
  Lock,
  Minus,
  Plus,
  Sprout,
  Trash2,
  TreePine,
} from "lucide-react"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { CartProvider, useCart } from "@/components/storefront/cart-context"
import { Link } from "react-router-dom"




const SF_MAROON = "#740031"

const CAUSES = [
  { id: "plant_tree", label: "Plant a Tree", icon: TreePine },
  { id: "kids_education", label: "Kids Education", icon: GraduationCap },
  { id: "housing_fund", label: "Housing Fund", icon: Home },
  { id: "childrens_books", label: "Children's Books", icon: BookOpen },
]

const CHARITIES = [
  { id: "tree", label: "Plant a Tree", src: "/images/charity/plant-tree.svg" },
  { id: "education", label: "Kids Education", src: "/images/charity/kids-education.svg" },
  { id: "nursing", label: "Nursing Home", src: "/images/charity/nursing-home.svg" },
  { id: "shelter", label: "Children's Shelter", src: "/images/charity/children-shelter.svg" },
]

function CheckoutHeader() {
  return (
    <header className="border-b border-sf-brand/20 bg-sf-surface py-4">
      <h1 className="text-center font-sf-display text-xl tracking-widest" style={{ color: SF_MAROON }}>
        MIRAKI
      </h1>
    </header>
  )
}

function CauseSection({ selectedCause, onSelect }) {
  return (
    <section className="flex flex-col items-center gap-4 border-b border-sf-brand/10 pb-6 text-center">
      <h2 className="text-xl font-semibold font-['Times-New-Roman'] text-sf-ink">Choose Your Cause, We&apos;ll Make the Donation</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {CHARITIES.map((cause) => {
          const Icon = cause.icon
          const active = selectedCause === cause.id
          return (
            <button
              key={cause.id}
              type="button"
              onClick={() => onSelect(cause.id)}
              className="flex flex-col items-center gap-2 text-xs text-sf-ink"
            >
              <span
                className="flex  transition-colors"
               
              >
               <img
                            src={cause.src || "/placeholder.svg"}
                            alt={cause.label}
                            width="96"
                            height="96"
                            loading="lazy"
                            className={`h-16 w-auto transition-opacity`}
                          />
              </span>
              {/* {cause.label} */}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ExpressCheckout() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-center text-xl font-['Times-New-Roman'] font-semibold text-sf-ink">Express Checkout</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-white text-sm font-medium border border-black"
        >
         <img
                            src={"/images/payment/apple-pay.svg"}
                            alt="Apple Pay"
                            width="96"
                            height="96"
                            loading="lazy"
                            className={`h-12 w-auto transition-opacity`}
                          />
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-md bg-white text-sm font-bold border border-black"
        >
         <img
                            src={"/images/payment/paypal.svg"}
                            alt="PayPal"
                            width="96"
                            height="96"
                            loading="lazy"
                            className={`h-16 w-auto transition-opacity`}
                          />
        </button>
      </div>
      <div className="flex items-center gap-3 text-md font-['Times-New-Roman'] font-semibold ">
        <div className="h-px flex-1 bg-sf-brand/15" />
        OR
        <div className="h-px flex-1 bg-sf-brand/15" />
      </div>
    </section>
  )
}

function TextField({ placeholder, className = "", ...props }) {
  return (
    <input
      placeholder={placeholder}
      className={`h-10 w-full rounded-md border border-sf-brand/25 bg-transparent px-3 text-sm text-sf-ink outline-none placeholder:text-sf-muted focus:border-sf-brand ${className}`}
      {...props}
    />
  )
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs text-sf-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded border-sf-brand/40 accent-[color:var(--sf-maroon,#740031)]"
      />
      {label}
    </label>
  )
}

function ContactSection({ email, setEmail, emailOptIn, setEmailOptIn }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sf-ink">Contact</h2>
        <a href="/account/login" className="text-xs underline" style={{ color: SF_MAROON }}>
          Log in
        </a>
      </div>
      <TextField type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <CheckboxRow
        label="Email me with news and offers"
        checked={emailOptIn}
        onChange={setEmailOptIn}
      />
    </section>
  )
}

function DeliverySection({ delivery, setDelivery, smsOptIn, setSmsOptIn }) {
  function set(key, value) {
    setDelivery((d) => ({ ...d, [key]: value }))
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-sf-ink">Delivery</h2>

      <div className="relative">
        <select
          value={delivery.country}
          onChange={(e) => set("country", e.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-sf-brand/25 bg-transparent px-3 text-sm text-sf-ink outline-none focus:border-sf-brand"
        >
          <option value="US">United States</option>
          <option value="AE">United Arab Emirates</option>
          <option value="IN">India</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sf-muted" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField placeholder="First name" value={delivery.firstName} onChange={(e) => set("firstName", e.target.value)} />
        <TextField placeholder="Last name" value={delivery.lastName} onChange={(e) => set("lastName", e.target.value)} />
      </div>

      <TextField placeholder="Address" value={delivery.address} onChange={(e) => set("address", e.target.value)} />
      <TextField placeholder="Apartment (optional)" value={delivery.apartment} onChange={(e) => set("apartment", e.target.value)} />

      <div className="grid grid-cols-3 gap-3">
        <TextField placeholder="City" value={delivery.city} onChange={(e) => set("city", e.target.value)} />
        <div className="relative">
          <select
            value={delivery.state}
            onChange={(e) => set("state", e.target.value)}
            className="h-10 w-full appearance-none rounded-md border border-sf-brand/25 bg-transparent px-3 text-sm text-sf-ink outline-none focus:border-sf-brand"
          >
            <option value="">State</option>
            <option value="CA">CA</option>
            <option value="NY">NY</option>
            <option value="TX">TX</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sf-muted" aria-hidden="true" />
        </div>
        <TextField placeholder="ZIP code" value={delivery.zip} onChange={(e) => set("zip", e.target.value)} />
      </div>

      <TextField type="tel" placeholder="Phone" value={delivery.phone} onChange={(e) => set("phone", e.target.value)} />
      <CheckboxRow label="Text me with news and offers" checked={smsOptIn} onChange={setSmsOptIn} />
    </section>
  )
}

function PaymentMethodOption({ icon, label, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-sm text-sf-ink transition-colors ${
        active ? "border-sf-brand" : "border-sf-brand/20"
      }`}
    >
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full border-2"
        style={{ borderColor: active ? SF_MAROON : "#c9c9c9" }}
      >
        {active ? <span className="size-2 rounded-full" style={{ backgroundColor: SF_MAROON }} /> : null}
      </span>
      {icon}
      {label}
    </button>
  )
}

function PaymentSection({ method, setMethod, card, setCard, billingSameAsShipping, setBillingSameAsShipping, agreed, setAgreed }) {
  function set(key, value) {
    setCard((c) => ({ ...c, [key]: value }))
  }

  return (
    <section className="flex flex-col gap-3 border-t border-sf-brand/15 pt-6">
      <h2 className="text-sm font-semibold text-sf-ink">Payment Options</h2>

      <PaymentMethodOption
        icon={<Lock className="size-3.5 text-sf-muted" aria-hidden="true" />}
        label="Credit Card"
        active={method === "card"}
        onSelect={() => setMethod("card")}
      />

      {method === "card" ? (
        <div className="flex flex-col gap-3 rounded-md border border-sf-brand/15  p-3">
          <div className="relative">
            <TextField
              placeholder="Card Number"
              value={card.number}
              onChange={(e) => set("number", e.target.value)}
              className="pr-9"
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-sf-muted" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TextField placeholder="MM" value={card.expMonth} onChange={(e) => set("expMonth", e.target.value)} />
            <TextField placeholder="YY" value={card.expYear} onChange={(e) => set("expYear", e.target.value)} />
            <TextField placeholder="CVV" value={card.cvv} onChange={(e) => set("cvv", e.target.value)} />
          </div>
          <TextField placeholder="Name on the Card" value={card.name} onChange={(e) => set("name", e.target.value)} />
          <CheckboxRow
            label="Use shipping address as billing address"
            checked={billingSameAsShipping}
            onChange={setBillingSameAsShipping}
          />
        </div>
      ) : null}

      <PaymentMethodOption
        icon={<span className="grid size-5 place-items-center rounded bg-[#B2FCE4] text-[10px] font-bold text-black">A</span>}
        label="Afterpay"
        active={method === "afterpay"}
        onSelect={() => setMethod("afterpay")}
      />
      <PaymentMethodOption
        icon={<span className="grid size-5 place-items-center rounded-full bg-[#4A4AF4] text-[10px] font-bold text-white">a</span>}
        label="Affirm"
        active={method === "affirm"}
        onSelect={() => setMethod("affirm")}
      />
      <PaymentMethodOption
        icon={<span className="grid size-5 place-items-center rounded-full bg-[#00D64F] text-[10px] font-bold text-white">▶</span>}
        label="Link"
        active={method === "link"}
        onSelect={() => setMethod("link")}
      />

      <p className="mt-1 text-xs text-sf-muted">Secure and Encrypted</p>

      <CheckboxRow
        label="I agree to the terms and conditions"
        checked={agreed}
        onChange={setAgreed}
      />
    </section>
  )
}

function CartSummaryItem({ item }) {
const { formatPrice } = useStorefront()
  const { cart, updateItemQty, removeItem } = useCart()
  const options = item.options || []
  const isDiscounted =
    cart.applicableInfo && !cart.applicableInfo.allItemsEligible &&
    cart.applicableInfo.eligibleProductIds?.includes(item.productId)
  


  return (
    <li className="flex gap-3 py-3">
     <div
    
      className="relative size-14 shrink-0 overflow-hidden rounded-md bg-white">
  <img
    src={item.image || "/placeholder.svg"}
    alt={item.name}
    className="size-full object-cover"
  />

  <span className="absolute right-0 top-0 hidden size-5 items-center justify-center rounded-full bg-sf-ink text-xs font-medium text-white md:flex">
    {item.quantity}
  </span>
</div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${item.alias}`}
            className="truncate text-md font-semibold font-['Times-New-Roman'] text-sf-ink"
          >
            {item.name} {isDiscounted ? (
  <span className="ml-1 text-[10px] font-normal" style={{ color: SF_MAROON }}>
    · discount applied
  </span>
) : null}
          </Link>
          <span className="shrink-0 text-xs font-semibold text-sf-ink">{formatPrice(item.price * item.quantity)}</span>
        </div>
        {options.map((o) => (
          <p key={o.label ?? o.name} className="text-[11px] text-sf-muted">
            {o.label ?? o.name}: {o.valueLabel ?? o.value}
          </p>
        ))}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded border border-sf-brand/20 text-sf-ink">
            <button
              type="button"
              onClick={() => updateItemQty(item.itemId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-5 place-items-center disabled:opacity-30"
            >
              <Minus className="size-3" aria-hidden="true" />
            </button>
            <span className="w-3 text-center text-[11px]">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateItemQty(item.itemId, item.quantity + 1)}
              aria-label="Increase quantity"
              className="grid size-5 place-items-center"
            >
              <Plus className="size-3" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.itemId)}
            aria-label={`Remove ${item.name}`}
            style={{ color: SF_MAROON }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}

function GiftMessageBox() {
  const [message, setMessage] = useState("")
  return (
    <div className="flex items-center gap-2">
      <textarea
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Personalized gift message"
        className="h-9 flex-1 rounded-md border border-sf-brand/20 bg-white px-3 text-xs text-sf-ink outline-none placeholder:text-sf-muted focus:border-sf-brand"
      />
      <button
        type="button"
        className="h-9 shrink-0 rounded-md border border-sf-brand/30 px-3 text-xs font-medium text-sf-ink hover:bg-sf-brand/5"
      >
        Add
      </button>
    </div>
  )
}

function CouponBox() {
  const { substore } = useStorefront()
  const { cart, applyCoupon, applyingCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  async function handleApply(e) {
    e.preventDefault()
    if (!code.trim()) return
    setError("")
    try {
      await applyCoupon(code, substore?._id)
      setCode("")
    } catch (err) {
      setError(err.message || "Couldn't apply that code")
    }
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between rounded-md border border-sf-brand/20 bg-white px-3 py-2 text-xs">
        <span className="font-semibold tracking-wide text-sf-ink">{cart.coupon.code} applied</span>
        <button type="button" onClick={removeCoupon} className="underline" style={{ color: SF_MAROON }}>
          Remove
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (error) setError("")
          }}
          placeholder="Discount Code or Gift Card"
          className="h-9 flex-1 rounded-md border border-sf-brand/20 bg-white px-3 text-xs uppercase text-sf-ink outline-none placeholder:text-sf-muted placeholder:normal-case focus:border-sf-brand"
        />
        <button
          type="submit"
          disabled={applyingCoupon || !code.trim()}
          className="flex h-9 shrink-0 items-center justify-center rounded-md border border-sf-brand/30 px-3 text-xs font-medium text-sf-ink hover:bg-sf-brand/5 disabled:opacity-50"
        >
          {applyingCoupon ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : "Apply"}
        </button>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </form>
  )
}

function CartSummary() {
  const { formatPrice, substore } = useStorefront()
  const { cart } = useCart()
  const shippingLabel = cart.shippingAddressLabel || "Enter address to see options"

  return (
    <aside className="flex flex-col gap-4 rounded-md border border-sf-brand/20 p-5">
      <h2 className="font-['Times-New-Roman']  text-xl font-semibold text-center text-sf-ink">Cart Summary</h2>

      <ul className="divide-y divide-sf-brand/10">
        {cart.items.map((item) => (
          <CartSummaryItem key={item.itemId} item={item} />
        ))}
      </ul>

      <GiftMessageBox />
      <CouponBox />

      <div className="flex flex-col gap-1.5 border-t border-sf-brand/10 pt-3 text-xs font-semibold">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
       {cart.discount > 0 ? (
  <div className="flex justify-between" style={{ color: SF_MAROON }}>
    <span>Discount{cart.coupon ? ` (${cart.coupon.code})` : ""}</span>
    <span>-{formatPrice(cart.discount)}</span>
  </div>
) : null}
{cart.discount > 0 && cart.applicableInfo && !cart.applicableInfo.allItemsEligible ? (
  <p className="text-[11px] text-sf-muted -mt-1">
    Applies to {cart.applicableInfo.eligibleItemsCount} of {cart.applicableInfo.totalItemsCount} items
    ({formatPrice(cart.applicableInfo.applicableSubtotal)} eligible)
  </p>
) : null}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="max-w-[60%] text-right text-sf-muted">{shippingLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatPrice(cart.tax || 0)}</span>
        </div>
        <div className="flex justify-between border-t border-sf-brand/10 pt-1.5 text-sm font-semibold">
          <span>Total</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
      </div>

      <p className="text-sm text-sf-muted">
        {(substore?.settings?.storeName || "Miraki Jewels")} will contribute 1% of your purchase to removing CO2 from
        the atmosphere.
      </p>
    </aside>
  )
}

function CheckoutContent() {
  const [selectedCause, setSelectedCause] = useState(null)
  const [email, setEmail] = useState("")
  const [emailOptIn, setEmailOptIn] = useState(false)
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [delivery, setDelivery] = useState({
    country: "US",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  })
  const [method, setMethod] = useState("card")
  const [card, setCard] = useState({ number: "", expMonth: "", expYear: "", cvv: "", name: "" })
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [placing, setPlacing] = useState(false)

  async function handlePayNow() {
    if (!agreed) return
    setPlacing(true)
    try {
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-sf-paper text-sf-ink">
      <CheckoutHeader />

      <div className="mx-auto grid max-w-5xl lg:max-w-6xl xl:max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1.3fr_1fr] lg:divide-x lg:divide-sf-brand/15">
        <div className="flex flex-col gap-8 lg:pr-10 order-2 lg:order-1">
          <CauseSection selectedCause={selectedCause} onSelect={setSelectedCause} />
          <ExpressCheckout />
          <ContactSection email={email} setEmail={setEmail} emailOptIn={emailOptIn} setEmailOptIn={setEmailOptIn} />
          <DeliverySection delivery={delivery} setDelivery={setDelivery} smsOptIn={smsOptIn} setSmsOptIn={setSmsOptIn} />
          <PaymentSection
            method={method}
            setMethod={setMethod}
            card={card}
            setCard={setCard}
            billingSameAsShipping={billingSameAsShipping}
            setBillingSameAsShipping={setBillingSameAsShipping}
            agreed={agreed}
            setAgreed={setAgreed}
          />

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePayNow}
              disabled={!agreed || placing}
              className="flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: SF_MAROON }}
            >
              {placing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Pay Now
            </button>
            <p className="text-center text-[11px] text-sf-muted">
              By placing your order you agree to our{" "}
              <a href="/terms" className="underline">
                Terms and Conditions
              </a>
              ,{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/returns" className="underline">
                Returns Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="lg:pl-10 order-1 lg:order-2 ">
          <CartSummary />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <StorefrontProvider>
      <CartProvider>

      <main>
        <CheckoutContent />
      </main>
      </CartProvider>
    </StorefrontProvider>
  )
}