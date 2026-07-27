// // // // "use client"

// // // // import { useState } from "react"
// // // // import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react"
// // // // import { imgUrl } from "@/Server"
// // // // import { useStorefront } from "./storefront-context"

// // // // /* ---------------------------------------------------------------------------
// // // //    Miraki storefront sections. Each component receives the `props` object of
// // // //    its canvas section verbatim — the canvas JSON is the single source of truth.
// // // // --------------------------------------------------------------------------- */

// // // // const COUNTRIES = [
// // // //   { code: "AE", label: "UAE" },
// // // //   { code: "OM", label: "Oman" },
// // // //   { code: "IN", label: "India" },
// // // // ]

// // // // export function AnnouncementBar({ text }) {
// // // //   return (
// // // //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// // // //       {text}
// // // //     </div>
// // // //   )
// // // // }

// // // // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// // // //   const { countryCode, substore, switchCountry } = useStorefront()
// // // //   const [open, setOpen] = useState(false)
// // // //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// // // //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// // // //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// // // //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// // // //   const logoSrc = imgUrl(substore?.settings?.logoUrl)

// // // //   return (
// // // //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-bg">
// // // //       <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
// // // //         {/* Left nav (desktop) */}
// // // //         <nav aria-label="Primary" className="hidden flex-1 items-center gap-8 lg:flex">
// // // //           {nav.map((item) => (
// // // //             <a
// // // //               key={item.label}
// // // //               href={item.href}
// // // //               className="font-sf-display text-lg text-sf-ink transition-colors hover:text-sf-brand"
// // // //             >
// // // //               {item.label}
// // // //             </a>
// // // //           ))}
// // // //         </nav>

// // // //         {/* Mobile menu button */}
// // // //         <button
// // // //           type="button"
// // // //           className="text-sf-ink lg:hidden"
// // // //           aria-expanded={open}
// // // //           aria-label={open ? "Close menu" : "Open menu"}
// // // //           onClick={() => setOpen((v) => !v)}
// // // //         >
// // // //           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
// // // //         </button>

// // //         // {/* Center brand — uploaded substore logo when available, else wordmark */}
// // //         // <a
// // //         //   href="/"
// // //         //   className="flex h-14 w-[220px] shrink-0 items-center justify-center overflow-hidden text-center"
// // //         //   aria-label={`${brand} home`}
// // //         // >
// // //         //   {logoSrc ? (
// // //         //     <img
// // //         //       src={logoSrc || "/placeholder.svg"}
// // //         //       alt={substore?.settings?.storeName || brand}
// // //         //       className="h-[14] w-[200px] object-cover object-center"
// // //         //       decoding="async"
// // //         //     />
// // //         //   ) : (
// // //         //     <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// // //         //   )}
// // //         //   {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// // //         // </a>

// // // //         {/* Right nav + icons */}
// // // //         <div className="flex flex-1 items-center justify-end gap-5">
// // // //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// // // //             {navRight.map((item) => (
// // // //               <a
// // // //                 key={item.label}
// // // //                 href={item.href}
// // // //                 className="font-sf-display text-lg text-sf-ink transition-colors hover:text-sf-brand"
// // // //               >
// // // //                 {item.label}
// // // //               </a>
// // // //             ))}
// // // //           </nav>
// // // //           <button type="button" aria-label="Search" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // //             <Search className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //           {showCountrySwitcher ? (
// // // //             <label className="flex items-center gap-1">
// // // //               <span className="sr-only">Country</span>
// // // //               <select
// // // //                 value={active.code}
// // // //                 onChange={(e) => switchCountry(e.target.value)}
// // // //                 className="cursor-pointer border-none bg-transparent text-sm font-medium text-sf-ink outline-none hover:text-sf-brand"
// // // //               >
// // // //                 {COUNTRIES.map((c) => (
// // // //                   <option key={c.code} value={c.code}>
// // // //                     {c.label}
// // // //                   </option>
// // // //                 ))}
// // // //               </select>
// // // //             </label>
// // // //           ) : null}
// // // //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // //             <User className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // //             <Heart className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //           <button type="button" aria-label="Shopping bag" className="text-sf-ink hover:text-sf-brand">
// // // //             <ShoppingBag className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile nav drawer */}
// // // //       {open ? (
// // // //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-bg px-4 py-4 lg:hidden">
// // // //           <ul className="flex flex-col gap-3">
// // // //             {[...nav, ...navRight].map((item) => (
// // // //               <li key={item.label}>
// // // //                 <a
// // // //                   href={item.href}
// // // //                   onClick={() => setOpen(false)}
// // // //                   className="font-sf-display text-xl text-sf-ink hover:text-sf-brand"
// // // //                 >
// // // //                   {item.label}
// // // //                 </a>
// // // //               </li>
// // // //             ))}
// // // //           </ul>
// // // //         </nav>
// // // //       ) : null}
// // // //     </header>
// // // //   )
// // // // }

// // // // export function Hero({ headline, ctas = [], image, imageAlt }) {
// // // //   return (
// // // //     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
// // // //       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
// // // //       <img
// // // //         src={image || "/placeholder.svg"}
// // // //         alt={imageAlt || ""}
// // // //         width="1600"
// // // //         height="900"
// // // //         fetchPriority="high"
// // // //         decoding="async"
// // // //         className="absolute inset-0 size-full object-cover object-[70%_center]"
// // // //       />
// // // //       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
// // // //       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
// // // //         <div className="max-w-xl">
// // // //           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
// // // //             {headline}
// // // //           </h1>
// // // //           <div className="mt-8 flex flex-col items-start gap-4">
// // // //             {ctas.map((cta) => (
// // // //               <a
// // // //                 key={cta.label}
// // // //                 href={cta.href}
// // // //                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
// // // //               >
// // // //                 {cta.label}
// // // //               </a>
// // // //             ))}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </section>
// // // //   )
// // // // }

// // // // export function CategoryTiles({ title, sub, cta, items = [] }) {
// // // //   return (
// // // //     <section id="jewelry" className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // //       <div className="text-center">
// // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // //           {title}
// // // //         </h2>
// // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // //       </div>
// // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // //         {items.map((item) => (
// // // //           <a key={item.name} href={item.href} className="group block">
// // // //             <div className="overflow-hidden bg-sf-surface">
// // // //               <img
// // // //                 src={item.image || "/placeholder.svg"}
// // // //                 alt={item.name}
// // // //                 width="600"
// // // //                 height="750"
// // // //                 loading="lazy"
// // // //                 decoding="async"
// // // //                 className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // //               />
// // // //             </div>
// // // //             <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">{item.name}</p>
// // // //           </a>
// // // //         ))}
// // // //       </div>
// // // //       {cta ? (
// // // //         <div className="mt-10 text-center">
// // // //           <a
// // // //             href={cta.href}
// // // //             className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// // // //           >
// // // //             {cta.label}
// // // //           </a>
// // // //         </div>
// // // //       ) : null}
// // // //     </section>
// // // //   )
// // // // }

// // // // export function StoryBand({ title, cards = [] }) {
// // // //   return (
// // // //     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
// // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // //           {title}
// // // //         </h2>
// // // //         <div className="mt-10 grid gap-6 md:grid-cols-3">
// // // //           {cards.map((card) => (
// // // //             <article key={card.title} className="group flex flex-col bg-sf-bg">
// // // //               <div className="overflow-hidden">
// // // //                 <img
// // // //                   src={card.image || "/placeholder.svg"}
// // // //                   alt={card.title}
// // // //                   width="600"
// // // //                   height="720"
// // // //                   loading="lazy"
// // // //                   decoding="async"
// // // //                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // //                 />
// // // //               </div>
// // // //               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
// // // //                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
// // // //                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
// // // //                 {card.cta ? (
// // // //                   <a
// // // //                     href={card.cta.href}
// // // //                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
// // // //                   >
// // // //                     {card.cta.label}
// // // //                   </a>
// // // //                 ) : null}
// // // //               </div>
// // // //             </article>
// // // //           ))}
// // // //         </div>
// // // //       </div>
// // // //     </section>
// // // //   )
// // // // }

// // // // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// // // //   const { formatPrice } = useStorefront()
// // // //   const [activeTab, setActiveTab] = useState(0)

// // // //   return (
// // // //     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // //       <div className="text-center">
// // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // //           {title}
// // // //         </h2>
// // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // //       </div>

// // // //       {tabs.length ? (
// // // //         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
// // // //           {tabs.map((tab, i) => (
// // // //             <button
// // // //               key={tab}
// // // //               role="tab"
// // // //               aria-selected={i === activeTab}
// // // //               onClick={() => setActiveTab(i)}
// // // //               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
// // // //                 i === activeTab
// // // //                   ? "bg-sf-brand text-sf-brand-foreground"
// // // //                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
// // // //               }`}
// // // //             >
// // // //               {tab}
// // // //             </button>
// // // //           ))}
// // // //         </div>
// // // //       ) : null}

// // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // //         {products.map((product) => (
// // // //           <article key={product.name} className="group">
// // // //             <div className="relative overflow-hidden bg-sf-surface">
// // // //               {product.tag ? (
// // // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // // //                   {product.tag}
// // // //                 </span>
// // // //               ) : null}
// // // //               <img
// // // //                 src={product.image || "/placeholder.svg"}
// // // //                 alt={product.name}
// // // //                 width="600"
// // // //                 height="600"
// // // //                 loading="lazy"
// // // //                 decoding="async"
// // // //                 className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // //               />
// // // //             </div>
// // // //             <div className="mt-3 text-center">
// // // //               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
// // // //               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
// // // //                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
// // // //                 {product.compareAtPrice ? (
// // // //                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
// // // //                 ) : null}
// // // //               </p>
// // // //             </div>
// // // //           </article>
// // // //         ))}
// // // //       </div>
// // // //     </section>
// // // //   )
// // // // }

// // // // export function BannerDuo({ items = [] }) {
// // // //   return (
// // // //     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
// // // //       {items.map((item) => (
// // // //         <article key={item.title} className="group relative isolate overflow-hidden">
// // // //           <img
// // // //             src={item.image || "/placeholder.svg"}
// // // //             alt={item.title}
// // // //             width="800"
// // // //             height="560"
// // // //             loading="lazy"
// // // //             decoding="async"
// // // //             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // //           />
// // // //           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
// // // //             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
// // // //             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
// // // //             {item.cta ? (
// // // //               <a
// // // //                 href={item.cta.href}
// // // //                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
// // // //               >
// // // //                 {item.cta.label}
// // // //               </a>
// // // //             ) : null}
// // // //           </div>
// // // //         </article>
// // // //       ))}
// // // //     </section>
// // // //   )
// // // // }

// // // // export function Testimonials({ title, items = [] }) {
// // // //   return (
// // // //     <section className="bg-sf-brand py-16 lg:py-20">
// // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
// // // //           {title}
// // // //         </h2>
// // // //         <div className="mt-10 grid gap-8 md:grid-cols-3">
// // // //           {items.map((item) => (
// // // //             <figure key={item.author} className="flex flex-col gap-4 text-center">
// // // //               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
// // // //                 &ldquo;{item.quote}&rdquo;
// // // //               </blockquote>
// // // //               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
// // // //                 {item.author}
// // // //               </figcaption>
// // // //             </figure>
// // // //           ))}
// // // //         </div>
// // // //       </div>
// // // //     </section>
// // // //   )
// // // // }

// // // // export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
// // // //   const [email, setEmail] = useState("")
// // // //   const [subscribed, setSubscribed] = useState(false)

// // // //   function onSubmit(e) {
// // // //     e.preventDefault()
// // // //     if (email.trim()) setSubscribed(true)
// // // //   }

// // // //   return (
// // // //     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
// // // //       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
// // // //         {/* Newsletter */}
// // // //         <div className="mx-auto max-w-lg text-center">
// // // //           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
// // // //           {subscribed ? (
// // // //             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
// // // //           ) : (
// // // //             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
// // // //               <label htmlFor="sf-newsletter" className="sr-only">
// // // //                 Email address
// // // //               </label>
// // // //               <input
// // // //                 id="sf-newsletter"
// // // //                 type="email"
// // // //                 required
// // // //                 value={email}
// // // //                 onChange={(e) => setEmail(e.target.value)}
// // // //                 placeholder="Your email"
// // // //                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
// // // //               />
// // // //               <button
// // // //                 type="submit"
// // // //                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
// // // //               >
// // // //                 {newsletterCta}
// // // //               </button>
// // // //             </form>
// // // //           )}
// // // //         </div>

// // // //         {/* Link columns */}
// // // //         <div className="mt-14 grid gap-10 sm:grid-cols-3">
// // // //           {columns.map((col) => (
// // // //             <nav key={col.title} aria-label={col.title}>
// // // //               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
// // // //               <ul className="mt-4 flex flex-col gap-2">
// // // //                 {col.links.map((link) => (
// // // //                   <li key={link.label}>
// // // //                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
// // // //                       {link.label}
// // // //                     </a>
// // // //                   </li>
// // // //                 ))}
// // // //               </ul>
// // // //             </nav>
// // // //           ))}
// // // //         </div>

// // // //         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
// // // //       </div>
// // // //     </footer>
// // // //   )
// // // // }

// // // // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // // // export const SECTION_REGISTRY = {
// // // //   announcement: AnnouncementBar,
// // // //   header: Header,
// // // //   hero: Hero,
// // // //   categoryTiles: CategoryTiles,
// // // //   storyBand: StoryBand,
// // // //   productCarousel: ProductCarousel,
// // // //   bannerDuo: BannerDuo,
// // // //   testimonials: Testimonials,
// // // //   footer: Footer,
// // // // }


// // // "use client"

// // // import { useState } from "react"
// // // import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
// // // import { imgUrl } from "@/Server"
// // // import { useStorefront } from "./storefront-context"

// // // /* ---------------------------------------------------------------------------
// // //    Miraki storefront sections. Each component receives the `props` object of
// // //    its canvas section verbatim — the canvas JSON is the single source of truth.
// // // --------------------------------------------------------------------------- */

// // // const COUNTRIES = [
// // //   { code: "AE", label: "UAE" },
// // //   { code: "OM", label: "Oman" },
// // //   { code: "IN", label: "India" },
// // // ]

// // // export function AnnouncementBar({ text, show }) {
// // //   // Visibility is controlled from the canvas JSON: the announcement renders
// // //   // ONLY when the section's props include `"show": true`. If the flag is
// // //   // missing or false in the canvas, the bar is hidden in the UI.
// // //   if (show !== true || !text) return null
// // //   return (
// // //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// // //       {text}
// // //     </div>
// // //   )
// // // }

// // // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// // //   const { countryCode, substore, switchCountry } = useStorefront()
// // //   const [open, setOpen] = useState(false)
// // //   const [logoFailed, setLogoFailed] = useState(false)
// // //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// // //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// // //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// // //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// // //   // If the file is missing/404s we fall back to the MIRAKI wordmark.
// // //   const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

// // //   return (
// // //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
// // //       <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
// // //         {/* Left nav (desktop) */}
// // //         <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
// // //           {nav.map((item) => (
// // //             <a
// // //               key={item.label}
// // //               href={item.href}
// // //               className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// // //             >
// // //               {item.label}
// // //             </a>
// // //           ))}
// // //         </nav>

// // //         {/* Mobile menu button */}
// // //         <button
// // //           type="button"
// // //           className="text-sf-ink lg:hidden"
// // //           aria-expanded={open}
// // //           aria-label={open ? "Close menu" : "Open menu"}
// // //           onClick={() => setOpen((v) => !v)}
// // //         >
// // //           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
// // //         </button>

// // //         {/* Center brand — uploaded substore logo when available, else wordmark */}
// // //         <a
// // //           href="/"
// // //            className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
// // //           aria-label={`${brand} home`}
// // //         >
// // //           {logoSrc ? (
// // //             <img
// // //               src={logoSrc || "/placeholder.svg"}
// // //               alt={substore?.settings?.storeName || brand}
// // //               className="h-[14] w-[200px] object-cover object-center"
// // //               decoding="async"
// // //             />
// // //           ) : (
// // //             <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// // //           )}
// // //           {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// // //         </a>

// // //         {/* Right nav + icons */}
// // //         <div className="flex flex-1 items-center justify-end gap-6">
// // //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// // //             {navRight.map((item) => (
// // //               <a
// // //                 key={item.label}
// // //                 href={item.href}
// // //                 className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// // //               >
// // //                 {item.label}
// // //               </a>
// // //             ))}
// // //           </nav>
// // //           <button
// // //             type="button"
// // //             className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
// // //           >
// // //             Search
// // //           </button>
// // //           {showCountrySwitcher ? (
// // //             <label className="relative flex items-center">
// // //               <span className="sr-only">Country</span>
// // //               <select
// // //                 value={active.code}
// // //                 onChange={(e) => switchCountry(e.target.value)}
// // //                 className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
// // //               >
// // //                 {COUNTRIES.map((c) => (
// // //                   <option key={c.code} value={c.code}>
// // //                     {c.label}
// // //                   </option>
// // //                 ))}
// // //               </select>
// // //               <ChevronDown
// // //                 className="pointer-events-none absolute right-0 size-4 text-sf-ink"
// // //                 aria-hidden="true"
// // //               />
// // //             </label>
// // //           ) : null}
// // //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // //             <User className="size-5" aria-hidden="true" />
// // //           </button>
// // //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // //             <Heart className="size-5" aria-hidden="true" />
// // //           </button>
// // //           <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
// // //             <ShoppingBag className="size-5" aria-hidden="true" />
// // //             <span
// // //               aria-hidden="true"
// // //               className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
// // //             >
// // //               1
// // //             </span>
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Mobile nav drawer */}
// // //       {open ? (
// // //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
// // //           <ul className="flex flex-col gap-3">
// // //             {[...nav, ...navRight].map((item) => (
// // //               <li key={item.label}>
// // //                 <a
// // //                   href={item.href}
// // //                   onClick={() => setOpen(false)}
// // //                   className="font-sans text-base text-sf-ink hover:text-sf-brand"
// // //                 >
// // //                   {item.label}
// // //                 </a>
// // //               </li>
// // //             ))}
// // //           </ul>
// // //         </nav>
// // //       ) : null}
// // //     </header>
// // //   )
// // // }

// // // export function Hero({ headline, ctas = [], image, imageAlt }) {
// // //   return (
// // //     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
// // //       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
// // //       <img
// // //         src={image || "/placeholder.svg"}
// // //         alt={imageAlt || ""}
// // //         width="1600"
// // //         height="900"
// // //         fetchPriority="high"
// // //         decoding="async"
// // //         className="absolute inset-0 size-full object-cover object-[70%_center]"
// // //       />
// // //       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
// // //       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
// // //         <div className="max-w-xl">
// // //           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
// // //             {headline}
// // //           </h1>
// // //           <div className="mt-8 flex flex-col items-start gap-4">
// // //             {ctas.map((cta) => (
// // //               <a
// // //                 key={cta.label}
// // //                 href={cta.href}
// // //                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
// // //               >
// // //                 {cta.label}
// // //               </a>
// // //             ))}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </section>
// // //   )
// // // }

// // // export function CategoryTiles({ title, sub, cta, items = [] }) {
// // //   return (
// // //     <section id="jewelry" className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // //       <div className="text-center">
// // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // //           {title}
// // //         </h2>
// // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // //       </div>
// // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // //         {items.map((item) => (
// // //           <a key={item.name} href={item.href} className="group block">
// // //             <div className="overflow-hidden bg-sf-surface">
// // //               <img
// // //                 src={item.image || "/placeholder.svg"}
// // //                 alt={item.name}
// // //                 width="600"
// // //                 height="750"
// // //                 loading="lazy"
// // //                 decoding="async"
// // //                 className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // //               />
// // //             </div>
// // //             <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">{item.name}</p>
// // //           </a>
// // //         ))}
// // //       </div>
// // //       {cta ? (
// // //         <div className="mt-10 text-center">
// // //           <a
// // //             href={cta.href}
// // //             className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// // //           >
// // //             {cta.label}
// // //           </a>
// // //         </div>
// // //       ) : null}
// // //     </section>
// // //   )
// // // }

// // // export function StoryBand({ title, cards = [] }) {
// // //   return (
// // //     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
// // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // //           {title}
// // //         </h2>
// // //         <div className="mt-10 grid gap-6 md:grid-cols-3">
// // //           {cards.map((card) => (
// // //             <article key={card.title} className="group flex flex-col bg-sf-bg">
// // //               <div className="overflow-hidden">
// // //                 <img
// // //                   src={card.image || "/placeholder.svg"}
// // //                   alt={card.title}
// // //                   width="600"
// // //                   height="720"
// // //                   loading="lazy"
// // //                   decoding="async"
// // //                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // //                 />
// // //               </div>
// // //               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
// // //                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
// // //                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
// // //                 {card.cta ? (
// // //                   <a
// // //                     href={card.cta.href}
// // //                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
// // //                   >
// // //                     {card.cta.label}
// // //                   </a>
// // //                 ) : null}
// // //               </div>
// // //             </article>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     </section>
// // //   )
// // // }

// // // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// // //   const { formatPrice } = useStorefront()
// // //   const [activeTab, setActiveTab] = useState(0)

// // //   return (
// // //     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // //       <div className="text-center">
// // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // //           {title}
// // //         </h2>
// // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // //       </div>

// // //       {tabs.length ? (
// // //         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
// // //           {tabs.map((tab, i) => (
// // //             <button
// // //               key={tab}
// // //               role="tab"
// // //               aria-selected={i === activeTab}
// // //               onClick={() => setActiveTab(i)}
// // //               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
// // //                 i === activeTab
// // //                   ? "bg-sf-brand text-sf-brand-foreground"
// // //                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
// // //               }`}
// // //             >
// // //               {tab}
// // //             </button>
// // //           ))}
// // //         </div>
// // //       ) : null}

// // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // //         {products.map((product) => (
// // //           <article key={product.name} className="group">
// // //             <div className="relative overflow-hidden bg-sf-surface">
// // //               {product.tag ? (
// // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // //                   {product.tag}
// // //                 </span>
// // //               ) : null}
// // //               <img
// // //                 src={product.image || "/placeholder.svg"}
// // //                 alt={product.name}
// // //                 width="600"
// // //                 height="600"
// // //                 loading="lazy"
// // //                 decoding="async"
// // //                 className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // //               />
// // //             </div>
// // //             <div className="mt-3 text-center">
// // //               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
// // //               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
// // //                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
// // //                 {product.compareAtPrice ? (
// // //                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
// // //                 ) : null}
// // //               </p>
// // //             </div>
// // //           </article>
// // //         ))}
// // //       </div>
// // //     </section>
// // //   )
// // // }

// // // export function BannerDuo({ items = [] }) {
// // //   return (
// // //     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
// // //       {items.map((item) => (
// // //         <article key={item.title} className="group relative isolate overflow-hidden">
// // //           <img
// // //             src={item.image || "/placeholder.svg"}
// // //             alt={item.title}
// // //             width="800"
// // //             height="560"
// // //             loading="lazy"
// // //             decoding="async"
// // //             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // //           />
// // //           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
// // //             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
// // //             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
// // //             {item.cta ? (
// // //               <a
// // //                 href={item.cta.href}
// // //                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
// // //               >
// // //                 {item.cta.label}
// // //               </a>
// // //             ) : null}
// // //           </div>
// // //         </article>
// // //       ))}
// // //     </section>
// // //   )
// // // }

// // // export function Testimonials({ title, items = [] }) {
// // //   return (
// // //     <section className="bg-sf-brand py-16 lg:py-20">
// // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
// // //           {title}
// // //         </h2>
// // //         <div className="mt-10 grid gap-8 md:grid-cols-3">
// // //           {items.map((item) => (
// // //             <figure key={item.author} className="flex flex-col gap-4 text-center">
// // //               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
// // //                 &ldquo;{item.quote}&rdquo;
// // //               </blockquote>
// // //               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
// // //                 {item.author}
// // //               </figcaption>
// // //             </figure>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     </section>
// // //   )
// // // }

// // // export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
// // //   const [email, setEmail] = useState("")
// // //   const [subscribed, setSubscribed] = useState(false)

// // //   function onSubmit(e) {
// // //     e.preventDefault()
// // //     if (email.trim()) setSubscribed(true)
// // //   }

// // //   return (
// // //     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
// // //       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
// // //         {/* Newsletter */}
// // //         <div className="mx-auto max-w-lg text-center">
// // //           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
// // //           {subscribed ? (
// // //             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
// // //           ) : (
// // //             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
// // //               <label htmlFor="sf-newsletter" className="sr-only">
// // //                 Email address
// // //               </label>
// // //               <input
// // //                 id="sf-newsletter"
// // //                 type="email"
// // //                 required
// // //                 value={email}
// // //                 onChange={(e) => setEmail(e.target.value)}
// // //                 placeholder="Your email"
// // //                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
// // //               />
// // //               <button
// // //                 type="submit"
// // //                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
// // //               >
// // //                 {newsletterCta}
// // //               </button>
// // //             </form>
// // //           )}
// // //         </div>

// // //         {/* Link columns */}
// // //         <div className="mt-14 grid gap-10 sm:grid-cols-3">
// // //           {columns.map((col) => (
// // //             <nav key={col.title} aria-label={col.title}>
// // //               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
// // //               <ul className="mt-4 flex flex-col gap-2">
// // //                 {col.links.map((link) => (
// // //                   <li key={link.label}>
// // //                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
// // //                       {link.label}
// // //                     </a>
// // //                   </li>
// // //                 ))}
// // //               </ul>
// // //             </nav>
// // //           ))}
// // //         </div>

// // //         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
// // //       </div>
// // //     </footer>
// // //   )
// // // }

// // // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // // export const SECTION_REGISTRY = {
// // //   announcement: AnnouncementBar,
// // //   header: Header,
// // //   hero: Hero,
// // //   categoryTiles: CategoryTiles,
// // //   storyBand: StoryBand,
// // //   productCarousel: ProductCarousel,
// // //   bannerDuo: BannerDuo,
// // //   testimonials: Testimonials,
// // //   footer: Footer,
// // // }


// // "use client"

// // import { useState } from "react"
// // import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
// // import { imgUrl } from "@/Server"
// // import { useStorefront } from "./storefront-context"

// // /* ---------------------------------------------------------------------------
// //    Miraki storefront sections. Each component receives the `props` object of
// //    its canvas section verbatim — the canvas JSON is the single source of truth.
// // --------------------------------------------------------------------------- */

// // const COUNTRIES = [
// //   { code: "AE", label: "UAE" },
// //   { code: "OM", label: "Oman" },
// //   { code: "IN", label: "India" },
// // ]

// // export function AnnouncementBar({ text, show }) {
// //   // Visibility is controlled from the canvas JSON: the announcement renders
// //   // ONLY when the section's props include `"show": true`. If the flag is
// //   // missing or false in the canvas, the bar is hidden in the UI.
// //   if (show !== true || !text) return null
// //   return (
// //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// //       {text}
// //     </div>
// //   )
// // }

// // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// //   const { countryCode, substore, switchCountry } = useStorefront()
// //   const [open, setOpen] = useState(false)
// //   const [logoFailed, setLogoFailed] = useState(false)
// //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// //   // If the file is missing/404s we fall back to the MIRAKI wordmark.
// //   const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

// //   return (
// //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
// //       <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
// //         {/* Left nav (desktop) */}
// //         <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
// //           {nav.map((item) => (
// //             <a
// //               key={item.label}
// //               href={item.href}
// //               className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// //             >
// //               {item.label}
// //             </a>
// //           ))}
// //         </nav>

// //         {/* Mobile menu button */}
// //         <button
// //           type="button"
// //           className="text-sf-ink lg:hidden"
// //           aria-expanded={open}
// //           aria-label={open ? "Close menu" : "Open menu"}
// //           onClick={() => setOpen((v) => !v)}
// //         >
// //           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
// //         </button>

// //         {/* Center brand — uploaded substore logo when available, else wordmark */}
// //         <a
// //           href="/"
// //           className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
// //           aria-label={`${brand} home`}
// //         >
// //           {logoSrc ? (
// //             <img
// //               src={logoSrc || "/placeholder.svg"}
// //               alt={substore?.settings?.storeName || brand}
// //               className="h-[14] w-[200px] object-cover object-center"
// //               decoding="async"
// //             />
// //           ) : (
// //             <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// //           )}
// //           {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// //         </a>

// //         {/* Right nav + icons */}
// //         <div className="flex flex-1 items-center justify-end gap-6">
// //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// //             {navRight.map((item) => (
// //               <a
// //                 key={item.label}
// //                 href={item.href}
// //                 className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// //               >
// //                 {item.label}
// //               </a>
// //             ))}
// //           </nav>
// //           <button
// //             type="button"
// //             className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
// //           >
// //             Search
// //           </button>
// //           {showCountrySwitcher ? (
// //             <label className="relative flex items-center">
// //               <span className="sr-only">Country</span>
// //               <select
// //                 value={active.code}
// //                 onChange={(e) => switchCountry(e.target.value)}
// //                 className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
// //               >
// //                 {COUNTRIES.map((c) => (
// //                   <option key={c.code} value={c.code}>
// //                     {c.label}
// //                   </option>
// //                 ))}
// //               </select>
// //               <ChevronDown
// //                 className="pointer-events-none absolute right-0 size-4 text-sf-ink"
// //                 aria-hidden="true"
// //               />
// //             </label>
// //           ) : null}
// //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// //             <User className="size-5" aria-hidden="true" />
// //           </button>
// //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// //             <Heart className="size-5" aria-hidden="true" />
// //           </button>
// //           <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
// //             <ShoppingBag className="size-5" aria-hidden="true" />
// //             <span
// //               aria-hidden="true"
// //               className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
// //             >
// //               1
// //             </span>
// //           </button>
// //         </div>
// //       </div>

// //       {/* Mobile nav drawer */}
// //       {open ? (
// //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
// //           <ul className="flex flex-col gap-3">
// //             {[...nav, ...navRight].map((item) => (
// //               <li key={item.label}>
// //                 <a
// //                   href={item.href}
// //                   onClick={() => setOpen(false)}
// //                   className="font-sans text-base text-sf-ink hover:text-sf-brand"
// //                 >
// //                   {item.label}
// //                 </a>
// //               </li>
// //             ))}
// //           </ul>
// //         </nav>
// //       ) : null}
// //     </header>
// //   )
// // }

// // export function Hero({ headline, ctas = [], image, imageAlt }) {
// //   return (
// //     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
// //       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
// //       <img
// //         src={image || "/placeholder.svg"}
// //         alt={imageAlt || ""}
// //         width="1600"
// //         height="900"
// //         fetchPriority="high"
// //         decoding="async"
// //         className="absolute inset-0 size-full object-cover object-[70%_center]"
// //       />
// //       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
// //       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
// //         <div className="max-w-xl">
// //           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
// //             {headline}
// //           </h1>
// //           <div className="mt-8 flex flex-col items-start gap-4">
// //             {ctas.map((cta) => (
// //               <a
// //                 key={cta.label}
// //                 href={cta.href}
// //                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
// //               >
// //                 {cta.label}
// //               </a>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </section>
// //   )
// // }

// // export function CategoryTiles({ title, sub, cta, items = [] }) {
// //   return (
// //     <section id="jewelry" className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// //       <div className="text-center">
// //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// //           {title}
// //         </h2>
// //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// //       </div>
// //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// //         {items.map((item) => (
// //           <a key={item.name} href={item.href} className="group block">
// //             <div className="relative aspect-[4/5] overflow-hidden bg-sf-surface">
// //               {/* Primary image — fades out on hover when an alternate is provided */}
// //               <img
// //                 src={item.image || "/placeholder.svg"}
// //                 alt={item.name}
// //                 width="600"
// //                 height="750"
// //                 loading="lazy"
// //                 decoding="async"
// //                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// //                   item.hoverImage ? "group-hover:opacity-0" : ""
// //                 }`}
// //               />
// //               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// //               {item.hoverImage ? (
// //                 <img
// //                   src={item.hoverImage || "/placeholder.svg"}
// //                   alt=""
// //                   aria-hidden="true"
// //                   width="600"
// //                   height="750"
// //                   loading="lazy"
// //                   decoding="async"
// //                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// //                 />
// //               ) : null}
// //             </div>
// //             <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">{item.name}</p>
// //           </a>
// //         ))}
// //       </div>
// //       {cta ? (
// //         <div className="mt-10 text-center">
// //           <a
// //             href={cta.href}
// //             className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// //           >
// //             {cta.label}
// //           </a>
// //         </div>
// //       ) : null}
// //     </section>
// //   )
// // }

// // export function StoryBand({ title, cards = [] }) {
// //   return (
// //     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
// //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// //           {title}
// //         </h2>
// //         <div className="mt-10 grid gap-6 md:grid-cols-3">
// //           {cards.map((card) => (
// //             <article key={card.title} className="group flex flex-col bg-sf-bg">
// //               <div className="overflow-hidden">
// //                 <img
// //                   src={card.image || "/placeholder.svg"}
// //                   alt={card.title}
// //                   width="600"
// //                   height="720"
// //                   loading="lazy"
// //                   decoding="async"
// //                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// //                 />
// //               </div>
// //               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
// //                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
// //                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
// //                 {card.cta ? (
// //                   <a
// //                     href={card.cta.href}
// //                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
// //                   >
// //                     {card.cta.label}
// //                   </a>
// //                 ) : null}
// //               </div>
// //             </article>
// //           ))}
// //         </div>
// //       </div>
// //     </section>
// //   )
// // }

// // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// //   const { formatPrice } = useStorefront()
// //   const [activeTab, setActiveTab] = useState(0)

// //   return (
// //     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// //       <div className="text-center">
// //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// //           {title}
// //         </h2>
// //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// //       </div>

// //       {tabs.length ? (
// //         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
// //           {tabs.map((tab, i) => (
// //             <button
// //               key={tab}
// //               role="tab"
// //               aria-selected={i === activeTab}
// //               onClick={() => setActiveTab(i)}
// //               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
// //                 i === activeTab
// //                   ? "bg-sf-brand text-sf-brand-foreground"
// //                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
// //               }`}
// //             >
// //               {tab}
// //             </button>
// //           ))}
// //         </div>
// //       ) : null}

// //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// //         {products.map((product) => (
// //           <article key={product.name} className="group">
// //             <div className="relative aspect-square overflow-hidden bg-sf-surface">
// //               {product.tag ? (
// //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// //                   {product.tag}
// //                 </span>
// //               ) : null}
// //               {/* Primary image — fades out on hover when an alternate is provided */}
// //               <img
// //                 src={product.image || "/placeholder.svg"}
// //                 alt={product.name}
// //                 width="600"
// //                 height="600"
// //                 loading="lazy"
// //                 decoding="async"
// //                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// //                   product.hoverImage ? "group-hover:opacity-0" : ""
// //                 }`}
// //               />
// //               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// //               {product.hoverImage ? (
// //                 <img
// //                   src={product.hoverImage || "/placeholder.svg"}
// //                   alt=""
// //                   aria-hidden="true"
// //                   width="600"
// //                   height="600"
// //                   loading="lazy"
// //                   decoding="async"
// //                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// //                 />
// //               ) : null}
// //             </div>
// //             <div className="mt-3 text-center">
// //               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
// //               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
// //                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
// //                 {product.compareAtPrice ? (
// //                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
// //                 ) : null}
// //               </p>
// //             </div>
// //           </article>
// //         ))}
// //       </div>
// //     </section>
// //   )
// // }

// // export function BannerDuo({ items = [] }) {
// //   return (
// //     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
// //       {items.map((item) => (
// //         <article key={item.title} className="group relative isolate overflow-hidden">
// //           <img
// //             src={item.image || "/placeholder.svg"}
// //             alt={item.title}
// //             width="800"
// //             height="560"
// //             loading="lazy"
// //             decoding="async"
// //             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// //           />
// //           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
// //             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
// //             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
// //             {item.cta ? (
// //               <a
// //                 href={item.cta.href}
// //                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
// //               >
// //                 {item.cta.label}
// //               </a>
// //             ) : null}
// //           </div>
// //         </article>
// //       ))}
// //     </section>
// //   )
// // }

// // export function Testimonials({ title, items = [] }) {
// //   return (
// //     <section className="bg-sf-brand py-16 lg:py-20">
// //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
// //           {title}
// //         </h2>
// //         <div className="mt-10 grid gap-8 md:grid-cols-3">
// //           {items.map((item) => (
// //             <figure key={item.author} className="flex flex-col gap-4 text-center">
// //               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
// //                 &ldquo;{item.quote}&rdquo;
// //               </blockquote>
// //               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
// //                 {item.author}
// //               </figcaption>
// //             </figure>
// //           ))}
// //         </div>
// //       </div>
// //     </section>
// //   )
// // }

// // export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
// //   const [email, setEmail] = useState("")
// //   const [subscribed, setSubscribed] = useState(false)

// //   function onSubmit(e) {
// //     e.preventDefault()
// //     if (email.trim()) setSubscribed(true)
// //   }

// //   return (
// //     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
// //       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
// //         {/* Newsletter */}
// //         <div className="mx-auto max-w-lg text-center">
// //           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
// //           {subscribed ? (
// //             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
// //           ) : (
// //             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
// //               <label htmlFor="sf-newsletter" className="sr-only">
// //                 Email address
// //               </label>
// //               <input
// //                 id="sf-newsletter"
// //                 type="email"
// //                 required
// //                 value={email}
// //                 onChange={(e) => setEmail(e.target.value)}
// //                 placeholder="Your email"
// //                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
// //               />
// //               <button
// //                 type="submit"
// //                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
// //               >
// //                 {newsletterCta}
// //               </button>
// //             </form>
// //           )}
// //         </div>

// //         {/* Link columns */}
// //         <div className="mt-14 grid gap-10 sm:grid-cols-3">
// //           {columns.map((col) => (
// //             <nav key={col.title} aria-label={col.title}>
// //               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
// //               <ul className="mt-4 flex flex-col gap-2">
// //                 {col.links.map((link) => (
// //                   <li key={link.label}>
// //                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
// //                       {link.label}
// //                     </a>
// //                   </li>
// //                 ))}
// //               </ul>
// //             </nav>
// //           ))}
// //         </div>

// //         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
// //       </div>
// //     </footer>
// //   )
// // }

// // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // export const SECTION_REGISTRY = {
// //   announcement: AnnouncementBar,
// //   header: Header,
// //   hero: Hero,
// //   categoryTiles: CategoryTiles,
// //   storyBand: StoryBand,
// //   productCarousel: ProductCarousel,
// //   bannerDuo: BannerDuo,
// //   testimonials: Testimonials,
// //   footer: Footer,
// // }


// "use client"

// import { useRef, useState } from "react"
// import { motion } from "motion/react"
// import { ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
// import { imgUrl } from "@/Server"
// import { useStorefront } from "./storefront-context"

// /* ---------------------------------------------------------------------------
//    Miraki storefront sections. Each component receives the `props` object of
//    its canvas section verbatim — the canvas JSON is the single source of truth.
// --------------------------------------------------------------------------- */

// const COUNTRIES = [
//   { code: "AE", label: "UAE" },
//   { code: "OM", label: "Oman" },
//   { code: "IN", label: "India" },
// ]

// export function AnnouncementBar({ text, show }) {
//   // Visibility is controlled from the canvas JSON: the announcement renders
//   // ONLY when the section's props include `"show": true`. If the flag is
//   // missing or false in the canvas, the bar is hidden in the UI.
//   if (show !== true || !text) return null
//   return (
//     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
//       {text}
//     </div>
//   )
// }

// export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
//   const { countryCode, substore, switchCountry } = useStorefront()
//   const [open, setOpen] = useState(false)
//   const [logoFailed, setLogoFailed] = useState(false)
//   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

//   // When the resolved substore (e.g. the India store) has an uploaded logo,
//   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
//   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
//   // If the file is missing/404s we fall back to the MIRAKI wordmark.
//   const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

//   return (
//     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
//       <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
//         {/* Left nav (desktop) */}
//         <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
//           {nav.map((item) => (
//             <a
//               key={item.label}
//               href={item.href}
//               className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
//             >
//               {item.label}
//             </a>
//           ))}
//         </nav>

//         {/* Mobile menu button */}
//         <button
//           type="button"
//           className="text-sf-ink lg:hidden"
//           aria-expanded={open}
//           aria-label={open ? "Close menu" : "Open menu"}
//           onClick={() => setOpen((v) => !v)}
//         >
//           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
//         </button>

//         {/* Center brand — uploaded substore logo when available, else wordmark */}
//         <a
//           href="/"
//           className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
//           aria-label={`${brand} home`}
//         >
//           {logoSrc ? (
//             <img
//               src={logoSrc || "/placeholder.svg"}
//               alt={substore?.settings?.storeName || brand}
//               className="h-[14] w-[200px] object-cover object-center"
//               decoding="async"
//             />
//           ) : (
//             <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
//           )}
//           {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
//         </a>

//         {/* Right nav + icons */}
//         <div className="flex flex-1 items-center justify-end gap-6">
//           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
//             {navRight.map((item) => (
//               <a
//                 key={item.label}
//                 href={item.href}
//                 className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
//               >
//                 {item.label}
//               </a>
//             ))}
//           </nav>
//           <button
//             type="button"
//             className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
//           >
//             Search
//           </button>
//           {showCountrySwitcher ? (
//             <label className="relative flex items-center">
//               <span className="sr-only">Country</span>
//               <select
//                 value={active.code}
//                 onChange={(e) => switchCountry(e.target.value)}
//                 className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
//               >
//                 {COUNTRIES.map((c) => (
//                   <option key={c.code} value={c.code}>
//                     {c.label}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown
//                 className="pointer-events-none absolute right-0 size-4 text-sf-ink"
//                 aria-hidden="true"
//               />
//             </label>
//           ) : null}
//           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
//             <User className="size-5" aria-hidden="true" />
//           </button>
//           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
//             <Heart className="size-5" aria-hidden="true" />
//           </button>
//           <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
//             <ShoppingBag className="size-5" aria-hidden="true" />
//             <span
//               aria-hidden="true"
//               className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
//             >
//               1
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* Mobile nav drawer */}
//       {open ? (
//         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
//           <ul className="flex flex-col gap-3">
//             {[...nav, ...navRight].map((item) => (
//               <li key={item.label}>
//                 <a
//                   href={item.href}
//                   onClick={() => setOpen(false)}
//                   className="font-sans text-base text-sf-ink hover:text-sf-brand"
//                 >
//                   {item.label}
//                 </a>
//               </li>
//             ))}
//           </ul>
//         </nav>
//       ) : null}
//     </header>
//   )
// }

// export function Hero({ headline, ctas = [], image, imageAlt }) {
//   return (
//     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
//       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
//       <img
//         src={image || "/placeholder.svg"}
//         alt={imageAlt || ""}
//         width="1600"
//         height="900"
//         fetchPriority="high"
//         decoding="async"
//         className="absolute inset-0 size-full object-cover object-[70%_center]"
//       />
//       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
//       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
//         <div className="max-w-xl">
//           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
//             {headline}
//           </h1>
//           <div className="mt-8 flex flex-col items-start gap-4">
//             {ctas.map((cta) => (
//               <a
//                 key={cta.label}
//                 href={cta.href}
//                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
//               >
//                 {cta.label}
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }

// export function CategoryTiles({ title, sub, cta, items = [] }) {
//   const scrollerRef = useRef(null)

//   const scrollBy = (dir) => {
//     const el = scrollerRef.current
//     if (!el) return
//     // Scroll by roughly one card width so items snap neatly into view.
//     const amount = el.clientWidth * 0.8
//     el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" })
//   }

//   return (
//     <section id="jewelry" className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
//       {/* Full-bleed heading row: rule extends to the right viewport edge (not cut at the container) */}
//       {/* Slides in from the right and scales up into place when it enters the viewport */}
//       <motion.div
//         className="flex items-center gap-3 px-4 sm:gap-6 sm:pr-0 lg:pl-8"
//         initial={{ opacity: 0, x: 120, scale: 0.8 }}
//         whileInView={{ opacity: 1, x: 0, scale: 1 }}
//         viewport={{ once: true, amount: 0.6 }}
//         transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
//       >
//         {/* Invisible left spacer balances the right rule so the heading stays centered */}
//         <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
//         <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
//           {title}
//         </h2>
//         <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
//       </motion.div>

//       <div className="mx-auto mt-10 max-w-[1600px] px-6 sm:px-10 lg:px-14 xl:px-16">
//         {/* Horizontal side-scroll carousel */}
//         <div className="relative">
//           <button
//             type="button"
//             onClick={() => scrollBy("prev")}
//             aria-label="Previous"
//             className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:left-0 lg:-translate-x-4"
//           >
//             <ChevronLeft className="size-6" />
//           </button>
//           <button
//             type="button"
//             onClick={() => scrollBy("next")}
//             aria-label="Next"
//             className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:right-0 lg:translate-x-4"
//           >
//             <ChevronRight className="size-6" />
//           </button>

//           <div
//             ref={scrollerRef}
//             className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 lg:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
//           >
//             {items.map((item) => (
//               <a
//                 key={item.name}
//                 href={item.href}
//                 className="group block w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3rem)/3)]"
//               >
//                 <div className="relative aspect-square overflow-hidden bg-sf-bg shadow-sm">
//                   {/* Primary image — fades out on hover when an alternate is provided */}
//                   <img
//                     src={item.image || "/placeholder.svg"}
//                     alt={item.name}
//                     width="600"
//                     height="600"
//                     loading="lazy"
//                     decoding="async"
//                     className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
//                       item.hoverImage ? "group-hover:opacity-0" : ""
//                     }`}
//                   />
//                   {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
//                   {item.hoverImage ? (
//                     <img
//                       src={item.hoverImage || "/placeholder.svg"}
//                       alt=""
//                       aria-hidden="true"
//                       width="600"
//                       height="600"
//                       loading="lazy"
//                       decoding="async"
//                       className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
//                     />
//                   ) : null}
//                 </div>
//                 <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">
//                   {item.name}
//                 </p>
//               </a>
//             ))}
//           </div>
//         </div>

//         {sub ? (
//           <p className="mx-auto mt-12 max-w-none text-center font-sf-display text-xl leading-relaxed text-sf-ink text-pretty sm:text-2xl lg:whitespace-nowrap">
//             {sub}
//           </p>
//         ) : null}
//         {cta ? (
//           <div className="mt-8 text-center">
//             <a
//               href={cta.href}
//               className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
//             >
//               {cta.label}
//             </a>
//           </div>
//         ) : null}
//       </div>
//     </section>
//   )
// }

// export function StoryBand({ title, cards = [] }) {
//   return (
//     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
//       <div className="mx-auto max-w-7xl px-4 lg:px-8">
//         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
//           {title}
//         </h2>
//         <div className="mt-10 grid gap-6 md:grid-cols-3">
//           {cards.map((card) => (
//             <article key={card.title} className="group flex flex-col bg-sf-bg">
//               <div className="overflow-hidden">
//                 <img
//                   src={card.image || "/placeholder.svg"}
//                   alt={card.title}
//                   width="600"
//                   height="720"
//                   loading="lazy"
//                   decoding="async"
//                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
//                 />
//               </div>
//               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
//                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
//                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
//                 {card.cta ? (
//                   <a
//                     href={card.cta.href}
//                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
//                   >
//                     {card.cta.label}
//                   </a>
//                 ) : null}
//               </div>
//             </article>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
//   const { formatPrice } = useStorefront()
//   const [activeTab, setActiveTab] = useState(0)

//   return (
//     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
//       <div className="text-center">
//         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
//           {title}
//         </h2>
//         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
//       </div>

//       {tabs.length ? (
//         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
//           {tabs.map((tab, i) => (
//             <button
//               key={tab}
//               role="tab"
//               aria-selected={i === activeTab}
//               onClick={() => setActiveTab(i)}
//               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
//                 i === activeTab
//                   ? "bg-sf-brand text-sf-brand-foreground"
//                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>
//       ) : null}

//       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
//         {products.map((product) => (
//           <article key={product.name} className="group">
//             <div className="relative aspect-square overflow-hidden bg-sf-surface">
//               {product.tag ? (
//                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
//                   {product.tag}
//                 </span>
//               ) : null}
//               {/* Primary image — fades out on hover when an alternate is provided */}
//               <img
//                 src={product.image || "/placeholder.svg"}
//                 alt={product.name}
//                 width="600"
//                 height="600"
//                 loading="lazy"
//                 decoding="async"
//                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
//                   product.hoverImage ? "group-hover:opacity-0" : ""
//                 }`}
//               />
//               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
//               {product.hoverImage ? (
//                 <img
//                   src={product.hoverImage || "/placeholder.svg"}
//                   alt=""
//                   aria-hidden="true"
//                   width="600"
//                   height="600"
//                   loading="lazy"
//                   decoding="async"
//                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
//                 />
//               ) : null}
//             </div>
//             <div className="mt-3 text-center">
//               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
//               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
//                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
//                 {product.compareAtPrice ? (
//                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
//                 ) : null}
//               </p>
//             </div>
//           </article>
//         ))}
//       </div>
//     </section>
//   )
// }

// export function BannerDuo({ items = [] }) {
//   return (
//     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
//       {items.map((item) => (
//         <article key={item.title} className="group relative isolate overflow-hidden">
//           <img
//             src={item.image || "/placeholder.svg"}
//             alt={item.title}
//             width="800"
//             height="560"
//             loading="lazy"
//             decoding="async"
//             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
//           />
//           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
//             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
//             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
//             {item.cta ? (
//               <a
//                 href={item.cta.href}
//                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
//               >
//                 {item.cta.label}
//               </a>
//             ) : null}
//           </div>
//         </article>
//       ))}
//     </section>
//   )
// }

// export function Testimonials({ title, items = [] }) {
//   return (
//     <section className="bg-sf-brand py-16 lg:py-20">
//       <div className="mx-auto max-w-7xl px-4 lg:px-8">
//         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
//           {title}
//         </h2>
//         <div className="mt-10 grid gap-8 md:grid-cols-3">
//           {items.map((item) => (
//             <figure key={item.author} className="flex flex-col gap-4 text-center">
//               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
//                 &ldquo;{item.quote}&rdquo;
//               </blockquote>
//               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
//                 {item.author}
//               </figcaption>
//             </figure>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
//   const [email, setEmail] = useState("")
//   const [subscribed, setSubscribed] = useState(false)

//   function onSubmit(e) {
//     e.preventDefault()
//     if (email.trim()) setSubscribed(true)
//   }

//   return (
//     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
//       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
//         {/* Newsletter */}
//         <div className="mx-auto max-w-lg text-center">
//           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
//           {subscribed ? (
//             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
//           ) : (
//             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
//               <label htmlFor="sf-newsletter" className="sr-only">
//                 Email address
//               </label>
//               <input
//                 id="sf-newsletter"
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Your email"
//                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
//               />
//               <button
//                 type="submit"
//                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
//               >
//                 {newsletterCta}
//               </button>
//             </form>
//           )}
//         </div>

//         {/* Link columns */}
//         <div className="mt-14 grid gap-10 sm:grid-cols-3">
//           {columns.map((col) => (
//             <nav key={col.title} aria-label={col.title}>
//               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
//               <ul className="mt-4 flex flex-col gap-2">
//                 {col.links.map((link) => (
//                   <li key={link.label}>
//                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
//                       {link.label}
//                     </a>
//                   </li>
//                 ))}
//               </ul>
//             </nav>
//           ))}
//         </div>

//         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
//       </div>
//     </footer>
//   )
// }

// /** Section registry: canvas `type` → component. Unknown types render nothing. */
// export const SECTION_REGISTRY = {
//   announcement: AnnouncementBar,
//   header: Header,
//   hero: Hero,
//   categoryTiles: CategoryTiles,
//   storyBand: StoryBand,
//   productCarousel: ProductCarousel,
//   bannerDuo: BannerDuo,
//   testimonials: Testimonials,
//   footer: Footer,
// }

"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
import { imgUrl } from "@/Server"
import { useStorefront } from "./storefront-context"

/* ---------------------------------------------------------------------------
   Miraki storefront sections. Each component receives the `props` object of
   its canvas section verbatim — the canvas JSON is the single source of truth.
--------------------------------------------------------------------------- */

const COUNTRIES = [
  { code: "AE", label: "UAE" },
  { code: "OM", label: "Oman" },
  { code: "IN", label: "India" },
]

export function AnnouncementBar({ text, show }) {
  // Visibility is controlled from the canvas JSON: the announcement renders
  // ONLY when the section's props include `"show": true`. If the flag is
  // missing or false in the canvas, the bar is hidden in the UI.
  if (show !== true || !text) return null
  return (
    <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
      {text}
    </div>
  )
}

export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
  const { countryCode, substore, switchCountry } = useStorefront()
  const [open, setOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

  // When the resolved substore (e.g. the India store) has an uploaded logo,
  // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
  // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
  // If the file is missing/404s we fall back to the MIRAKI wordmark.
  const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

  return (
    <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
        {/* Left nav (desktop) */}
        <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="text-sf-ink lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        {/* Center brand — uploaded substore logo when available, else wordmark */}
        <a
          href="/"
          className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
          aria-label={`${brand} home`}
        >
          {logoSrc ? (
            <img
              src={logoSrc || "/placeholder.svg"}
              alt={substore?.settings?.storeName || brand}
              className="h-[14] w-[200px] object-cover object-center"
              decoding="async"
            />
          ) : (
            <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
          )}
          {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
        </a>

        {/* Right nav + icons */}
        <div className="flex flex-1 items-center justify-end gap-6">
          <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
            {navRight.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
          >
            Search
          </button>
          {showCountrySwitcher ? (
            <label className="relative flex items-center">
              <span className="sr-only">Country</span>
              <select
                value={active.code}
                onChange={(e) => switchCountry(e.target.value)}
                className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-0 size-4 text-sf-ink"
                aria-hidden="true"
              />
            </label>
          ) : null}
          <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
            <User className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
            <Heart className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
            >
              1
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open ? (
        <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {[...nav, ...navRight].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-sans text-base text-sf-ink hover:text-sf-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}

export function Hero({ headline, ctas = [], image, imageAlt }) {
  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
      {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
      <img
        src={image || "/placeholder.svg"}
        alt={imageAlt || ""}
        width="1600"
        height="900"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
        <div className="max-w-xl">
          <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <div className="mt-8 flex flex-col items-start gap-4">
            {ctas.map((cta) => (
              <a
                key={cta.label}
                href={cta.href}
                className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
              >
                {cta.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function CategoryTiles({ title, sub, cta, items = [] }) {
  const scrollerRef = useRef(null)

  const scrollBy = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    // Scroll by roughly one card width so items snap neatly into view.
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" })
  }

  return (
    <section id="jewelry" className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
      {/* Full-bleed heading row: rule extends to the right viewport edge (not cut at the container) */}
      {/* Slides in from the right and scales up into place when it enters the viewport */}
      <motion.div
        className="flex items-center gap-3 px-4 sm:gap-6 sm:pr-0 lg:pl-8"
        initial={{ opacity: 0, x: 120, scale: 0.8 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Invisible left spacer balances the right rule so the heading stays centered */}
        <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
        <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
          {title}
        </h2>
        <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
      </motion.div>

      <div className="mx-auto mt-10 max-w-[1600px] px-6 sm:px-10 lg:px-14 xl:px-16">
        {/* Horizontal side-scroll carousel */}
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy("prev")}
            aria-label="Previous"
            className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:left-0 lg:-translate-x-4"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy("next")}
            aria-label="Next"
            className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:right-0 lg:translate-x-4"
          >
            <ChevronRight className="size-6" />
          </button>

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 lg:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group block w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3rem)/3)]"
              >
                <div className="relative aspect-square overflow-hidden bg-sf-bg shadow-sm">
                  {/* Primary image — fades out on hover when an alternate is provided */}
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width="600"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
                      item.hoverImage ? "group-hover:opacity-0" : ""
                    }`}
                  />
                  {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
                  {item.hoverImage ? (
                    <img
                      src={item.hoverImage || "/placeholder.svg"}
                      alt=""
                      aria-hidden="true"
                      width="600"
                      height="600"
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : null}
                </div>
                <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">
                  {item.name}
                </p>
              </a>
            ))}
          </div>
        </div>

        {sub ? (
          <p className="mx-auto mt-12 max-w-none text-center font-sf-display text-xl leading-relaxed text-sf-ink text-pretty sm:text-2xl lg:whitespace-nowrap">
            {sub}
          </p>
        ) : null}
        {cta ? (
          <div className="mt-8 text-center">
            <a
              href={cta.href}
              className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
            >
              {cta.label}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function StoryBand({ title, eyebrow, cards = [] }) {
  return (
    <section id="engagement" className="overflow-x-clip bg-sf-bg py-16 lg:py-24">
      {/* Staggered decorative heading: title slides in from the left, eyebrow from the right */}
      <div className="flex flex-col gap-3 px-4 lg:px-8">
        {/* Title row: solid rule extends to the left; invisible spacer keeps it centered */}
        <motion.div
          className="flex items-center gap-4 sm:gap-6"
          initial={{ opacity: 0, x: -120, scale: 0.8 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
          <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
            {title}
          </h2>
          <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
        </motion.div>

        {/* Eyebrow row: invisible spacer on the left; solid rule extends to the right */}
        {eyebrow ? (
          <motion.div
            className="flex items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, x: 120, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
            <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
              {eyebrow}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
          </motion.div>
        ) : null}
      </div>

      {/* Alternating editorial rows: large image on one side, story + CTA on the other */}
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-16 px-6 sm:px-10 lg:mt-14 lg:gap-0 lg:px-8">
        {cards.map((card, i) => {
          const reversed = i % 2 === 1
          return (
            <div key={card.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {/* Image */}
              <motion.div
                className={`group overflow-hidden ${reversed ? "lg:order-2" : ""}`}
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={card.image || "/placeholder.svg"}
                  alt={card.title}
                  width="720"
                  height="900"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </motion.div>

              {/* Content */}
              <motion.div
                className={`flex flex-col items-start ${reversed ? "lg:order-1 lg:pr-6" : "lg:pl-6"}`}
                initial={{ opacity: 0, x: reversed ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-10 bg-sf-brand" />
                  <span className="font-sf-display text-sm tracking-[0.3em] text-sf-brand/70 uppercase">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-sf-display text-3xl leading-tight text-sf-brand text-balance md:text-4xl">
                  {card.title}
                </h3>
                <div className="mt-5 flex max-w-md flex-col gap-4">
                  {String(card.sub || "")
                    .split("\n\n")
                    .filter(Boolean)
                    .map((para, p) => (
                      <p key={p} className="text-lg leading-relaxed text-sf-muted text-pretty">
                        {para}
                      </p>
                    ))}
                </div>
                {card.cta ? (
                  <a
                    href={card.cta.href}
                    className="mt-8 inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
                  >
                    {card.cta.label}
                  </a>
                ) : null}
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
  const { formatPrice } = useStorefront()
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
      {/* Staggered decorative heading: title slides in from the left, sub-eyebrow from the right */}
      <div className="flex flex-col gap-3 px-4 lg:px-8">
        <motion.div
          className="flex items-center gap-4 sm:gap-6"
          initial={{ opacity: 0, x: -120, scale: 0.8 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
          <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
            {title}
          </h2>
          <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
        </motion.div>

        {sub ? (
          <motion.div
            className="flex items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, x: 120, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span aria-hidden="true" className="h-px flex-1 opacity-0" />
            <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
              {sub}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
          </motion.div>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
      <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
        {products.map((product) => {
          const restImg = product.mainImg || product.image || "/placeholder.svg"
          const hoverImg = product.hoveredImg || product.hoverImage || null
          const label = product.category || product.name
          return (
            <article key={product.name} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-sf-surface">
                {/* Rest image — dimmed + slightly desaturated, fades out on hover when an alternate exists */}
                <img
                  src={restImg || "/placeholder.svg"}
                  alt={label}
                  width="800"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 size-full object-cover brightness-90 saturate-[0.85] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-100 group-hover:saturate-100 ${
                    hoverImg ? "group-hover:opacity-0" : ""
                  }`}
                />
                {/* Hovered image — crossfades in with a subtle zoom */}
                {hoverImg ? (
                  <img
                    src={hoverImg || "/placeholder.svg"}
                    alt=""
                    aria-hidden="true"
                    width="800"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:opacity-100"
                  />
                ) : null}
                {/* Dark veil — lifts away on hover to unveil the photo */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/20 to-black/10 opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0"
                />
                {/* Centered category label overlay */}
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <span className="border-b border-white/80 pb-1 font-sf-display text-xl tracking-[0.2em] text-white uppercase text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:tracking-[0.3em] md:text-2xl">
                    {label}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      </div>
    </section>
  )
}

export function BannerDuo({ items = [] }) {
  return (
    <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
      {items.map((item) => (
        <article key={item.title} className="group relative isolate overflow-hidden">
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.title}
            width="800"
            height="560"
            loading="lazy"
            decoding="async"
            className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
            <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
            <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
            {item.cta ? (
              <a
                href={item.cta.href}
                className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
              >
                {item.cta.label}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}

export function Testimonials({ title, items = [] }) {
  return (
    <section className="bg-sf-brand py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
          {title}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <figure key={item.author} className="flex flex-col gap-4 text-center">
              <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
                {item.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  function onSubmit(e) {
    e.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <footer id="contact" className="border-t border-sf-line bg-sf-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        {/* Newsletter */}
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
          {subscribed ? (
            <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 flex gap-0">
              <label htmlFor="sf-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="sf-newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
              >
                {newsletterCta}
              </button>
            </form>
          )}
        </div>

        {/* Link columns */}
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
      </div>
    </footer>
  )
}

/** Section registry: canvas `type` → component. Unknown types render nothing. */
export const SECTION_REGISTRY = {
  announcement: AnnouncementBar,
  header: Header,
  hero: Hero,
  categoryTiles: CategoryTiles,
  storyBand: StoryBand,
  productCarousel: ProductCarousel,
  bannerDuo: BannerDuo,
  testimonials: Testimonials,
  footer: Footer,
}

