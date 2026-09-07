"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Heart,
  Home,
  Play,
  Loader2,
  Lock,
  Minus,
  Plus,
  Sprout,
  Trash2,
  TreePine,
} from "lucide-react";
import { api, fetcher } from "@/lib/api";
import {
  StorefrontProvider,
  useStorefront,
} from "@/components/storefront/storefront-context";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/cart/use-cart";
import { useWishlist } from "@/hooks/wishlist/use-wishlist";
import { ExpressCheckout, SECTION_REGISTRY , PaymentOptions } from "@/components/storefront/sections";
const SF_MAROON = "#740031";

const CAUSES = [
  { id: "plant_tree", label: "Plant a Tree", icon: TreePine },
  { id: "kids_education", label: "Kids Education", icon: GraduationCap },
  { id: "housing_fund", label: "Housing Fund", icon: Home },
  { id: "childrens_books", label: "Children's Books", icon: BookOpen },
];

const CHARITIES = [
  { id: "tree", label: "Plant a Tree", src: "/images/charity/plant-tree.svg" },
  {
    id: "education",
    label: "Kids Education",
    src: "/images/charity/kids-education.svg",
  },
  {
    id: "nursing",
    label: "Nursing Home",
    src: "/images/charity/nursing-home.svg",
  },
  {
    id: "shelter",
    label: "Children's Shelter",
    src: "/images/charity/children-shelter.svg",
  },
];

const NON_VARIANT_OPTION_TYPES = ["textarea", "date", "checkbox", "text"];

function CheckoutHeader() {
  return (
    <header className="border-b border-sf-brand/20 bg-sf-surface py-4">
      <h1
        className="text-center font-sf-display text-xl tracking-widest"
        style={{ color: SF_MAROON }}
      >
        MIRAKI
      </h1>
    </header>
  );
}

function CauseSection({ selectedCause, onSelect }) {
  return (
    <section className="flex flex-col items-center gap-4 border-b border-sf-brand/10 pb-6 text-center">
      <h2 className="text-xl font-semibold font-['Times-New-Roman'] text-sf-ink">
        Choose Your Cause, We&apos;ll Make the Donation
      </h2>
      <div className="flex flex-wrap justify-center gap-8">
        {CHARITIES.map((cause) => {
          const active = selectedCause === cause.id;
          return (
            <button
              key={cause.id}
              type="button"
              onClick={() => onSelect(cause.id)}
              className="flex flex-col items-center gap-2 text-xs text-sf-ink"
            >
              <span className="flex transition-colors">
                <img
                  src={cause.src || "/placeholder.svg"}
                  alt={cause.label}
                  width="96"
                  height="96"
                  loading="lazy"
                  className={`h-16 w-auto transition-opacity`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}


function TextField({ placeholder, className = "", ...props }) {
  return (
    <input
      placeholder={placeholder}
      className={`h-10 w-full rounded-md border border-sf-brand/25 bg-transparent px-3 text-sm text-sf-ink outline-none placeholder:text-sf-muted focus:border-sf-brand ${className}`}
      {...props}
    />
  );
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
  );
}

function ContactSection({ email, setEmail, emailOptIn, setEmailOptIn }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sf-ink">Contact</h2>
        <a
          href="/account/login"
          className="text-xs underline"
          style={{ color: SF_MAROON }}
        >
          Log in
        </a>
      </div>
      <TextField
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <CheckboxRow
        label="Email me with news and offers"
        checked={emailOptIn}
        onChange={setEmailOptIn}
      />
    </section>
  );
}

function DeliverySection({ delivery, setDelivery, smsOptIn, setSmsOptIn }) {
  function set(key, value) {
    setDelivery((d) => ({ ...d, [key]: value }));
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
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sf-muted"
          aria-hidden="true"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          placeholder="First name"
          value={delivery.firstName}
          onChange={(e) => set("firstName", e.target.value)}
        />
        <TextField
          placeholder="Last name"
          value={delivery.lastName}
          onChange={(e) => set("lastName", e.target.value)}
        />
      </div>

      <TextField
        placeholder="Address"
        value={delivery.address}
        onChange={(e) => set("address", e.target.value)}
      />
      <TextField
        placeholder="Apartment (optional)"
        value={delivery.apartment}
        onChange={(e) => set("apartment", e.target.value)}
      />

      <div className="grid grid-cols-3 gap-3">
        <TextField
          placeholder="City"
          value={delivery.city}
          onChange={(e) => set("city", e.target.value)}
        />
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
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sf-muted"
            aria-hidden="true"
          />
        </div>
        <TextField
          placeholder="ZIP code"
          value={delivery.zip}
          onChange={(e) => set("zip", e.target.value)}
        />
      </div>

      <TextField
        type="tel"
        placeholder="Phone"
        value={delivery.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <CheckboxRow
        label="Text me with news and offers"
        checked={smsOptIn}
        onChange={setSmsOptIn}
      />
    </section>
  );
}

function formatOptionValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(formatOptionValue).join(", ");
  if (typeof value === "object")
    return value.valueLabel ?? value.label ?? value.value ?? value.name ?? "";
  return String(value);
}

function CartSummaryItem({ item, applicableInfo }) {
  const { formatPrice } = useStorefront();
  const { increment, decrement, removeItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();

  const name = item.product?.name || "Item";
  const alias = item.product?.alias;
  const image =
    item.image || item.product?.images?.[0]?.url || "/placeholder.svg";
  const unitPrice =
    item.displayPrice ?? item.variant?.price ?? item.product?.price ?? 0;
  const options = (item.selectedOptions || [])
    .filter(
      (option) =>
        !NON_VARIANT_OPTION_TYPES.includes(option.type?.toLowerCase()),
    )
    .map((option) => [
      option.name,
      option.label ?? option.name,
      formatOptionValue(option.valueLabel ?? option.value),
    ]);
  const wished = isInWishlist(item.product?._id);

  const isDiscounted =
    applicableInfo &&
    !applicableInfo.allItemsEligible &&
    applicableInfo.eligibleProductIds?.includes(item.productId);

  return (
    <li className="flex gap-3 py-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-white">
        <img src={image} alt={name} className="size-full object-cover" />
        <span className="absolute right-0 top-0 hidden size-5 items-center justify-center rounded-full bg-sf-ink text-xs font-medium text-white md:flex">
          {item.quantity}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${alias}`}
            className="truncate text-md font-semibold font-['Times-New-Roman'] text-sf-ink"
          >
            {name}{" "}
            {isDiscounted ? (
              <span
                className="ml-1 text-[10px] font-normal"
                style={{ color: SF_MAROON }}
              >
                · discount applied
              </span>
            ) : null}
          </Link>
          <span className="shrink-0 text-xs font-semibold text-sf-ink">
            {formatPrice(unitPrice * item.quantity)}
          </span>
        </div>
        <div className="flex justify-between pt-2 items-start">
          <div className="gap-1 flex flex-col">
            {options.map(([key, label, valueText]) => (
              <p key={key} className="text-[11px] text-sf-muted">
                {label}: {valueText}
              </p>
            ))}
          </div>
          <div className="mt-1 flex items-center flex-col gap-2">
            <div className="flex items-center gap-1.5 rounded border border-sf-brand/20 text-sf-ink">
            <button
              type="button"
              onClick={() => decrement(item.productId, item.variantId)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-5 place-items-center disabled:opacity-30"
            >
              <Minus className="size-3" aria-hidden="true" />
            </button>
            <span className="w-3 text-center text-[11px]">{item.quantity}</span>
            <button
              type="button"
              onClick={() => increment(item.productId, item.variantId)}
              aria-label="Increase quantity"
              className="grid size-5 place-items-center"
            >
              <Plus className="size-3" aria-hidden="true" />
            </button>
          </div>
            <button
              type="button"
              onClick={() => toggle(item.product)}
              aria-label={
                wished
                  ? `Remove ${item.name} from wishlist`
                  : `Add ${item.name} to wishlist`
              }
              aria-pressed={wished}
              className="grid "
            >
              <Heart
                className={`size-4 transition-colors ${wished ? "fill-sf-brand text-sf-brand" : "text-sf-ink"}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.productId, item.variantId)}
              aria-label={`Remove ${name}`}
              style={{ color: SF_MAROON }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function GiftMessageBox() {
  const [message, setMessage] = useState("");
  return (
    <div className="flex items-center gap-2">
      <textarea
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Personalized gift message"
        className="h-9 flex-1 pt-2 rounded-md border border-sf-brand/20 bg-white px-3 text-xs text-sf-ink outline-none placeholder:text-sf-muted focus:border-sf-brand"
      />
      <button
        type="button"
        className="h-9 shrink-0 rounded-md border border-sf-brand/30 px-3 text-xs font-medium text-sf-ink hover:bg-sf-brand/5"
      >
        Add
      </button>
    </div>
  );
}

function unwrapResponse(res) {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    res.data &&
    typeof res.data === "object"
  ) {
    return res.data;
  }
  return res;
}

function extractErrorMessage(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.data?.error ||
    err?.data?.message ||
    (typeof err?.message === "string" && err.message.trim()
      ? err.message
      : null) ||
    fallback
  );
}

function getEligibleProductNames(items, applicableInfo) {
  if (!applicableInfo?.eligibleProductIds?.length) return [];
  const idSet = new Set(applicableInfo.eligibleProductIds.map(String));
  return items
    .filter((item) => idSet.has(String(item.productId)))
    .map((item) => item.product?.name || "Item");
}

function CouponBox({
  cartTotal,
  items,
  appliedCoupon,
  setAppliedCoupon,
  discount,
  setDiscount,
  applicableInfo,
  setApplicableInfo,
}) {
  const { formatPrice } = useStorefront();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchAvailable() {
      setLoadingAvailable(true);
      try {
        const data = await fetcher("/storefront/coupons/available");
        if (active) setAvailableCoupons(data?.coupons || []);
      } catch (err) {
        console.error("Error fetching available coupons:", err);
      } finally {
        if (active) setLoadingAvailable(false);
      }
    }
    fetchAvailable();
    return () => {
      active = false;
    };
  }, []);

  function resetCoupon() {
    setDiscount(0);
    setAppliedCoupon(null);
    setApplicableInfo(null);
  }

  function toApplyItems() {
    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price:
        item.displayPrice ?? item.variant?.price ?? item.product?.price ?? 0,
    }));
  }

  async function applyCouponCode(rawCode) {
    const value = (rawCode ?? code).trim();
    if (!value) {
      setMessage("Please enter a coupon code");
      setError(true);
      return;
    }
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const res = await api.post("/storefront/coupons/apply", {
        code: value,
        cartTotal,
        items: toApplyItems(),
      });

      const data = unwrapResponse(res);
      setDiscount(data.discountAmount || 0);
      setAppliedCoupon({ code: data.coupon?.code || value.toUpperCase() });
      setApplicableInfo(data.applicableInfo || null);
      setMessage("Coupon applied!");
      setError(false);
      setCode(data.coupon?.code || value);
    } catch (err) {
      resetCoupon();
      setMessage(extractErrorMessage(err, "Failed to apply coupon"));
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    resetCoupon();
    setMessage("");
    setError(false);
    setCode("");
  }

  if (appliedCoupon) {
    const eligibleNames = getEligibleProductNames(items, applicableInfo);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md border border-sf-brand/20 bg-white px-3 py-2 text-xs">
          <span className="font-semibold tracking-wide text-sf-ink">
            {appliedCoupon.code} applied
            {discount ? ` · you saved ${formatPrice(discount)}` : ""}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="underline"
            style={{ color: SF_MAROON }}
          >
            Remove
          </button>
        </div>
        {applicableInfo && !applicableInfo.allItemsEligible ? (
          <p className="text-[11px] text-sf-muted">
            Applies to {applicableInfo.eligibleItemsCount} of{" "}
            {applicableInfo.totalItemsCount} item
            {applicableInfo.totalItemsCount === 1 ? "" : "s"}
            {eligibleNames.length ? `: ${eligibleNames.join(", ")}` : ""} (
            {formatPrice(applicableInfo.applicableSubtotal)} eligible)
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyCouponCode();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) {
              setMessage("");
              setError(false);
            }
          }}
          placeholder="Discount Code or Gift Card"
          className="h-9 flex-1 rounded-md border border-sf-brand/20 bg-white px-3 text-xs uppercase text-sf-ink outline-none placeholder:text-sf-muted placeholder:normal-case focus:border-sf-brand"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex h-9 shrink-0 items-center justify-center rounded-md border border-sf-brand/30 px-3 text-xs font-medium text-sf-ink hover:bg-sf-brand/5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            "Apply"
          )}
        </button>
      </form>
      {message ? (
        <p
          className={`text-[11px] ${error ? "text-red-600" : "text-green-600"}`}
        >
          {message}
        </p>
      ) : null}

      {availableCoupons.length > 0 ? (
        <div className="mt-1 border-t border-sf-brand/10 pt-2">
          <button
            type="button"
            onClick={() => setShowAvailable((s) => !s)}
            className="flex w-full items-center justify-between text-xs text-sf-ink"
          >
            <span>View available coupons ({availableCoupons.length})</span>
            <ChevronDown
              className={`size-3.5 transition-transform ${showAvailable ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {showAvailable ? (
            <div className="mt-2 flex flex-col gap-2">
              {loadingAvailable ? (
                <div className="flex justify-center py-2">
                  <Loader2
                    className="size-4 animate-spin text-sf-muted"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                availableCoupons.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => applyCouponCode(c.code)}
                    className="flex flex-col gap-0.5 rounded-md border border-dashed border-sf-brand/25 px-3 py-2 text-left text-xs hover:border-sf-brand"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold text-sf-ink">
                        {c.code}
                      </span>
                      <span
                        className="rounded bg-sf-brand/10 px-1.5 py-0.5 text-[10px]"
                        style={{ color: SF_MAROON }}
                      >
                        {c.displayDiscount}
                      </span>
                    </span>
                    {c.description ? (
                      <span className="text-[11px] text-sf-muted">
                        {c.description}
                      </span>
                    ) : null}
                    {c.hasConditions ? (
                      <span className="text-[10px] text-orange-500">
                        Conditions apply
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CartSummary({
  items,
  subtotal,
  discount,
  total,
  appliedCoupon,
  applicableInfo,
  email,
  couponProps,
}) {
  const { formatPrice, substore } = useStorefront();

  return (
    <aside className="flex flex-col gap-4 rounded-md border border-sf-brand/20 p-5">
      <h2 className="font-['Times-New-Roman']  text-xl font-semibold text-center text-sf-ink">
        Cart Summary
      </h2>

      <ul className="divide-y divide-sf-brand/10">
        {items.map((item) => (
          <CartSummaryItem
            key={item.cartItemKey}
            item={item}
            applicableInfo={applicableInfo}
          />
        ))}
      </ul>

      <GiftMessageBox />
      <CouponBox {...couponProps} cartTotal={subtotal} items={items} />

      <div className="flex flex-col gap-1.5 border-t border-sf-brand/10 pt-3 text-xs font-semibold">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between" style={{ color: SF_MAROON }}>
            <span>
              Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}
            </span>
            <span>-{formatPrice(discount)}</span>
          </div>
        ) : null}
        {discount > 0 && applicableInfo && !applicableInfo.allItemsEligible ? (
          <p className="text-[11px] text-sf-muted -mt-1">
            Applies to {applicableInfo.eligibleItemsCount} of{" "}
            {applicableInfo.totalItemsCount} item
            {applicableInfo.totalItemsCount === 1 ? "" : "s"}
            {(() => {
              const names = getEligibleProductNames(items, applicableInfo);
              return names.length ? `: ${names.join(", ")}` : "";
            })()}{" "}
            ({formatPrice(applicableInfo.applicableSubtotal)} eligible)
          </p>
        ) : null}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="max-w-[60%] text-right text-sf-muted">
            Enter address to see options
          </span>
        </div>
        <div className="flex justify-between border-t border-sf-brand/10 pt-1.5 text-sm font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <p className="text-sm text-sf-muted">
        {substore?.settings?.storeName || "Miraki Jewels"} will contribute 1% of
        your purchase to removing CO2 from the atmosphere.
      </p>
    </aside>
  );
}



function CheckoutContent() {
  const { items } = useCart();
  const { canvas } = useStorefront();

  // const PaymentOptions = SECTION_REGISTRY.paymentOptions;

  const paymentOptionsProps =
    canvas?.sections?.find((s) => s.type === "paymentOptions")?.props ?? {};
  const paymentMethods = paymentOptionsProps.methods ?? [];
  const expressCheckoutItems = paymentOptionsProps.expressCheckout ?? [];
  const secureNote = paymentOptionsProps.secureNote ?? "Secure and Encrypted";

  const [selectedCause, setSelectedCause] = useState(null);
  const [email, setEmail] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
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
  });
  const [method, setMethod] = useState(
    paymentMethods.find((m) => m.enabled !== false)?.id ?? "card",
  );
  const [card, setCard] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    name: "",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [applicableInfo, setApplicableInfo] = useState(null);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.displayPrice ??
            item.variant?.price ??
            item.product?.price ??
            0) *
            item.quantity,
        0,
      ),
    [items],
  );
  const total = Math.max(subtotal - discount, 0);

  useEffect(() => {
    if (!appliedCoupon) return;
    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.post("/storefront/coupons/apply", {
          code: appliedCoupon.code,
          cartTotal: subtotal,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price:
              item.displayPrice ??
              item.variant?.price ??
              item.product?.price ??
              0,
          })),
        });
        const data = unwrapResponse(res);
        setDiscount(data.discountAmount || 0);
        setApplicableInfo(data.applicableInfo || null);
      } catch (err) {
        if (err.response?.status !== 429) {
          setAppliedCoupon(null);
          setDiscount(0);
          setApplicableInfo(null);
        }
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [subtotal, items.length, appliedCoupon]);

  async function handlePayNow() {
    if (!agreed) return;
    setPlacing(true);
    try {
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-sf-paper text-sf-ink">
      <CheckoutHeader />

      <div className="mx-auto grid max-w-5xl lg:max-w-6xl xl:max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1.3fr_1fr] lg:divide-x lg:divide-sf-brand/15">
        <div className="flex flex-col gap-8 lg:pr-10 order-2 lg:order-1">
          <CauseSection
            selectedCause={selectedCause}
            onSelect={setSelectedCause}
          />

          <ExpressCheckout items={expressCheckoutItems} />

          <ContactSection
            email={email}
            setEmail={setEmail}
            emailOptIn={emailOptIn}
            setEmailOptIn={setEmailOptIn}
          />
          <DeliverySection
            delivery={delivery}
            setDelivery={setDelivery}
            smsOptIn={smsOptIn}
            setSmsOptIn={setSmsOptIn}
          />

          <PaymentOptions
            methods={paymentMethods}
            secureNote={secureNote}
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
              {placing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
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
          <CartSummary
            items={items}
            subtotal={subtotal}
            discount={discount}
            total={total}
            appliedCoupon={appliedCoupon}
            applicableInfo={applicableInfo}
            email={email}
            couponProps={{
              appliedCoupon,
              setAppliedCoupon,
              discount,
              setDiscount,
              applicableInfo,
              setApplicableInfo,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <StorefrontProvider>
      <main>
        <CheckoutContent />
      </main>
    </StorefrontProvider>
  );
}
