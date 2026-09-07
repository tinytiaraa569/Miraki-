// // // // // // "use client"

// // // // // // import { useState } from "react"
// // // // // // import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react"
// // // // // // import { imgUrl } from "@/Server"
// // // // // // import { useStorefront } from "./storefront-context"

// // // // // // /* ---------------------------------------------------------------------------
// // // // // //    Miraki storefront sections. Each component receives the `props` object of
// // // // // //    its canvas section verbatim — the canvas JSON is the single source of truth.
// // // // // // --------------------------------------------------------------------------- */

// // // // // // const COUNTRIES = [
// // // // // //   { code: "AE", label: "UAE" },
// // // // // //   { code: "OM", label: "Oman" },
// // // // // //   { code: "IN", label: "India" },
// // // // // // ]

// // // // // // export function AnnouncementBar({ text }) {
// // // // // //   return (
// // // // // //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// // // // // //       {text}
// // // // // //     </div>
// // // // // //   )
// // // // // // }

// // // // // // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// // // // // //   const { countryCode, substore, switchCountry } = useStorefront()
// // // // // //   const [open, setOpen] = useState(false)
// // // // // //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// // // // // //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// // // // // //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// // // // // //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// // // // // //   const logoSrc = imgUrl(substore?.settings?.logoUrl)

// // // // // //   return (
// // // // // //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-bg">
// // // // // //       <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
// // // // // //         {/* Left nav (desktop) */}
// // // // // //         <nav aria-label="Primary" className="hidden flex-1 items-center gap-8 lg:flex">
// // // // // //           {nav.map((item) => (
// // // // // //             <a
// // // // // //               key={item.label}
// // // // // //               href={item.href}
// // // // // //               className="font-sf-display text-lg text-sf-ink transition-colors hover:text-sf-brand"
// // // // // //             >
// // // // // //               {item.label}
// // // // // //             </a>
// // // // // //           ))}
// // // // // //         </nav>

// // // // // //         {/* Mobile menu button */}
// // // // // //         <button
// // // // // //           type="button"
// // // // // //           className="text-sf-ink lg:hidden"
// // // // // //           aria-expanded={open}
// // // // // //           aria-label={open ? "Close menu" : "Open menu"}
// // // // // //           onClick={() => setOpen((v) => !v)}
// // // // // //         >
// // // // // //           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
// // // // // //         </button>

// // // // //         // {/* Center brand — uploaded substore logo when available, else wordmark */}
// // // // //         // <a
// // // // //         //   href="/"
// // // // //         //   className="flex h-14 w-[220px] shrink-0 items-center justify-center overflow-hidden text-center"
// // // // //         //   aria-label={`${brand} home`}
// // // // //         // >
// // // // //         //   {logoSrc ? (
// // // // //         //     <img
// // // // //         //       src={logoSrc || "/placeholder.svg"}
// // // // //         //       alt={substore?.settings?.storeName || brand}
// // // // //         //       className="h-[14] w-[200px] object-cover object-center"
// // // // //         //       decoding="async"
// // // // //         //     />
// // // // //         //   ) : (
// // // // //         //     <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// // // // //         //   )}
// // // // //         //   {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// // // // //         // </a>

// // // // // //         {/* Right nav + icons */}
// // // // // //         <div className="flex flex-1 items-center justify-end gap-5">
// // // // // //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// // // // // //             {navRight.map((item) => (
// // // // // //               <a
// // // // // //                 key={item.label}
// // // // // //                 href={item.href}
// // // // // //                 className="font-sf-display text-lg text-sf-ink transition-colors hover:text-sf-brand"
// // // // // //               >
// // // // // //                 {item.label}
// // // // // //               </a>
// // // // // //             ))}
// // // // // //           </nav>
// // // // // //           <button type="button" aria-label="Search" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // // // //             <Search className="size-5" aria-hidden="true" />
// // // // // //           </button>
// // // // // //           {showCountrySwitcher ? (
// // // // // //             <label className="flex items-center gap-1">
// // // // // //               <span className="sr-only">Country</span>
// // // // // //               <select
// // // // // //                 value={active.code}
// // // // // //                 onChange={(e) => switchCountry(e.target.value)}
// // // // // //                 className="cursor-pointer border-none bg-transparent text-sm font-medium text-sf-ink outline-none hover:text-sf-brand"
// // // // // //               >
// // // // // //                 {COUNTRIES.map((c) => (
// // // // // //                   <option key={c.code} value={c.code}>
// // // // // //                     {c.label}
// // // // // //                   </option>
// // // // // //                 ))}
// // // // // //               </select>
// // // // // //             </label>
// // // // // //           ) : null}
// // // // // //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // // // //             <User className="size-5" aria-hidden="true" />
// // // // // //           </button>
// // // // // //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // // // //             <Heart className="size-5" aria-hidden="true" />
// // // // // //           </button>
// // // // // //           <button type="button" aria-label="Shopping bag" className="text-sf-ink hover:text-sf-brand">
// // // // // //             <ShoppingBag className="size-5" aria-hidden="true" />
// // // // // //           </button>
// // // // // //         </div>
// // // // // //       </div>

// // // // // //       {/* Mobile nav drawer */}
// // // // // //       {open ? (
// // // // // //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-bg px-4 py-4 lg:hidden">
// // // // // //           <ul className="flex flex-col gap-3">
// // // // // //             {[...nav, ...navRight].map((item) => (
// // // // // //               <li key={item.label}>
// // // // // //                 <a
// // // // // //                   href={item.href}
// // // // // //                   onClick={() => setOpen(false)}
// // // // // //                   className="font-sf-display text-xl text-sf-ink hover:text-sf-brand"
// // // // // //                 >
// // // // // //                   {item.label}
// // // // // //                 </a>
// // // // // //               </li>
// // // // // //             ))}
// // // // // //           </ul>
// // // // // //         </nav>
// // // // // //       ) : null}
// // // // // //     </header>
// // // // // //   )
// // // // // // }

// // // // // // export function Hero({ headline, ctas = [], image, imageAlt }) {
// // // // // //   return (
// // // // // //     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
// // // // // //       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
// // // // // //       <img
// // // // // //         src={image || "/placeholder.svg"}
// // // // // //         alt={imageAlt || ""}
// // // // // //         width="1600"
// // // // // //         height="900"
// // // // // //         fetchPriority="high"
// // // // // //         decoding="async"
// // // // // //         className="absolute inset-0 size-full object-cover object-[70%_center]"
// // // // // //       />
// // // // // //       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
// // // // // //       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
// // // // // //         <div className="max-w-xl">
// // // // // //           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
// // // // // //             {headline}
// // // // // //           </h1>
// // // // // //           <div className="mt-8 flex flex-col items-start gap-4">
// // // // // //             {ctas.map((cta) => (
// // // // // //               <a
// // // // // //                 key={cta.label}
// // // // // //                 href={cta.href}
// // // // // //                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
// // // // // //               >
// // // // // //                 {cta.label}
// // // // // //               </a>
// // // // // //             ))}
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function CategoryTiles({ title, sub, cta, items = [] }) {
// // // // // //   return (
// // // // // //     <section id="jewelry" className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // // // //       <div className="text-center">
// // // // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // // //           {title}
// // // // // //         </h2>
// // // // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // // // //       </div>
// // // // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // // // //         {items.map((item) => (
// // // // // //           <a key={item.name} href={item.href} className="group block">
// // // // // //             <div className="overflow-hidden bg-sf-surface">
// // // // // //               <img
// // // // // //                 src={item.image || "/placeholder.svg"}
// // // // // //                 alt={item.name}
// // // // // //                 width="600"
// // // // // //                 height="750"
// // // // // //                 loading="lazy"
// // // // // //                 decoding="async"
// // // // // //                 className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // // //               />
// // // // // //             </div>
// // // // // //             <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">{item.name}</p>
// // // // // //           </a>
// // // // // //         ))}
// // // // // //       </div>
// // // // // //       {cta ? (
// // // // // //         <div className="mt-10 text-center">
// // // // // //           <a
// // // // // //             href={cta.href}
// // // // // //             className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// // // // // //           >
// // // // // //             {cta.label}
// // // // // //           </a>
// // // // // //         </div>
// // // // // //       ) : null}
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function StoryBand({ title, cards = [] }) {
// // // // // //   return (
// // // // // //     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
// // // // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // // //           {title}
// // // // // //         </h2>
// // // // // //         <div className="mt-10 grid gap-6 md:grid-cols-3">
// // // // // //           {cards.map((card) => (
// // // // // //             <article key={card.title} className="group flex flex-col bg-sf-bg">
// // // // // //               <div className="overflow-hidden">
// // // // // //                 <img
// // // // // //                   src={card.image || "/placeholder.svg"}
// // // // // //                   alt={card.title}
// // // // // //                   width="600"
// // // // // //                   height="720"
// // // // // //                   loading="lazy"
// // // // // //                   decoding="async"
// // // // // //                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // // //                 />
// // // // // //               </div>
// // // // // //               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
// // // // // //                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
// // // // // //                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
// // // // // //                 {card.cta ? (
// // // // // //                   <a
// // // // // //                     href={card.cta.href}
// // // // // //                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
// // // // // //                   >
// // // // // //                     {card.cta.label}
// // // // // //                   </a>
// // // // // //                 ) : null}
// // // // // //               </div>
// // // // // //             </article>
// // // // // //           ))}
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// // // // // //   const { formatPrice } = useStorefront()
// // // // // //   const [activeTab, setActiveTab] = useState(0)

// // // // // //   return (
// // // // // //     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // // // //       <div className="text-center">
// // // // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // // //           {title}
// // // // // //         </h2>
// // // // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // // // //       </div>

// // // // // //       {tabs.length ? (
// // // // // //         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
// // // // // //           {tabs.map((tab, i) => (
// // // // // //             <button
// // // // // //               key={tab}
// // // // // //               role="tab"
// // // // // //               aria-selected={i === activeTab}
// // // // // //               onClick={() => setActiveTab(i)}
// // // // // //               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
// // // // // //                 i === activeTab
// // // // // //                   ? "bg-sf-brand text-sf-brand-foreground"
// // // // // //                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
// // // // // //               }`}
// // // // // //             >
// // // // // //               {tab}
// // // // // //             </button>
// // // // // //           ))}
// // // // // //         </div>
// // // // // //       ) : null}

// // // // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // // // //         {products.map((product) => (
// // // // // //           <article key={product.name} className="group">
// // // // // //             <div className="relative overflow-hidden bg-sf-surface">
// // // // // //               {product.tag ? (
// // // // // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // // // // //                   {product.tag}
// // // // // //                 </span>
// // // // // //               ) : null}
// // // // // //               <img
// // // // // //                 src={product.image || "/placeholder.svg"}
// // // // // //                 alt={product.name}
// // // // // //                 width="600"
// // // // // //                 height="600"
// // // // // //                 loading="lazy"
// // // // // //                 decoding="async"
// // // // // //                 className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // // //               />
// // // // // //             </div>
// // // // // //             <div className="mt-3 text-center">
// // // // // //               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
// // // // // //               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
// // // // // //                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
// // // // // //                 {product.compareAtPrice ? (
// // // // // //                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
// // // // // //                 ) : null}
// // // // // //               </p>
// // // // // //             </div>
// // // // // //           </article>
// // // // // //         ))}
// // // // // //       </div>
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function BannerDuo({ items = [] }) {
// // // // // //   return (
// // // // // //     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
// // // // // //       {items.map((item) => (
// // // // // //         <article key={item.title} className="group relative isolate overflow-hidden">
// // // // // //           <img
// // // // // //             src={item.image || "/placeholder.svg"}
// // // // // //             alt={item.title}
// // // // // //             width="800"
// // // // // //             height="560"
// // // // // //             loading="lazy"
// // // // // //             decoding="async"
// // // // // //             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // // //           />
// // // // // //           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
// // // // // //             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
// // // // // //             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
// // // // // //             {item.cta ? (
// // // // // //               <a
// // // // // //                 href={item.cta.href}
// // // // // //                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
// // // // // //               >
// // // // // //                 {item.cta.label}
// // // // // //               </a>
// // // // // //             ) : null}
// // // // // //           </div>
// // // // // //         </article>
// // // // // //       ))}
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function Testimonials({ title, items = [] }) {
// // // // // //   return (
// // // // // //     <section className="bg-sf-brand py-16 lg:py-20">
// // // // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
// // // // // //           {title}
// // // // // //         </h2>
// // // // // //         <div className="mt-10 grid gap-8 md:grid-cols-3">
// // // // // //           {items.map((item) => (
// // // // // //             <figure key={item.author} className="flex flex-col gap-4 text-center">
// // // // // //               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
// // // // // //                 &ldquo;{item.quote}&rdquo;
// // // // // //               </blockquote>
// // // // // //               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
// // // // // //                 {item.author}
// // // // // //               </figcaption>
// // // // // //             </figure>
// // // // // //           ))}
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </section>
// // // // // //   )
// // // // // // }

// // // // // // export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
// // // // // //   const [email, setEmail] = useState("")
// // // // // //   const [subscribed, setSubscribed] = useState(false)

// // // // // //   function onSubmit(e) {
// // // // // //     e.preventDefault()
// // // // // //     if (email.trim()) setSubscribed(true)
// // // // // //   }

// // // // // //   return (
// // // // // //     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
// // // // // //       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
// // // // // //         {/* Newsletter */}
// // // // // //         <div className="mx-auto max-w-lg text-center">
// // // // // //           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
// // // // // //           {subscribed ? (
// // // // // //             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
// // // // // //           ) : (
// // // // // //             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
// // // // // //               <label htmlFor="sf-newsletter" className="sr-only">
// // // // // //                 Email address
// // // // // //               </label>
// // // // // //               <input
// // // // // //                 id="sf-newsletter"
// // // // // //                 type="email"
// // // // // //                 required
// // // // // //                 value={email}
// // // // // //                 onChange={(e) => setEmail(e.target.value)}
// // // // // //                 placeholder="Your email"
// // // // // //                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
// // // // // //               />
// // // // // //               <button
// // // // // //                 type="submit"
// // // // // //                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
// // // // // //               >
// // // // // //                 {newsletterCta}
// // // // // //               </button>
// // // // // //             </form>
// // // // // //           )}
// // // // // //         </div>

// // // // // //         {/* Link columns */}
// // // // // //         <div className="mt-14 grid gap-10 sm:grid-cols-3">
// // // // // //           {columns.map((col) => (
// // // // // //             <nav key={col.title} aria-label={col.title}>
// // // // // //               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
// // // // // //               <ul className="mt-4 flex flex-col gap-2">
// // // // // //                 {col.links.map((link) => (
// // // // // //                   <li key={link.label}>
// // // // // //                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
// // // // // //                       {link.label}
// // // // // //                     </a>
// // // // // //                   </li>
// // // // // //                 ))}
// // // // // //               </ul>
// // // // // //             </nav>
// // // // // //           ))}
// // // // // //         </div>

// // // // // //         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
// // // // // //       </div>
// // // // // //     </footer>
// // // // // //   )
// // // // // // }

// // // // // // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // // // // // export const SECTION_REGISTRY = {
// // // // // //   announcement: AnnouncementBar,
// // // // // //   header: Header,
// // // // // //   hero: Hero,
// // // // // //   categoryTiles: CategoryTiles,
// // // // // //   storyBand: StoryBand,
// // // // // //   productCarousel: ProductCarousel,
// // // // // //   bannerDuo: BannerDuo,
// // // // // //   testimonials: Testimonials,
// // // // // //   footer: Footer,
// // // // // // }


// // // // // "use client"

// // // // // import { useState } from "react"
// // // // // import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
// // // // // import { imgUrl } from "@/Server"
// // // // // import { useStorefront } from "./storefront-context"

// // // // // /* ---------------------------------------------------------------------------
// // // // //    Miraki storefront sections. Each component receives the `props` object of
// // // // //    its canvas section verbatim — the canvas JSON is the single source of truth.
// // // // // --------------------------------------------------------------------------- */

// // // // // const COUNTRIES = [
// // // // //   { code: "AE", label: "UAE" },
// // // // //   { code: "OM", label: "Oman" },
// // // // //   { code: "IN", label: "India" },
// // // // // ]

// // // // // export function AnnouncementBar({ text, show }) {
// // // // //   // Visibility is controlled from the canvas JSON: the announcement renders
// // // // //   // ONLY when the section's props include `"show": true`. If the flag is
// // // // //   // missing or false in the canvas, the bar is hidden in the UI.
// // // // //   if (show !== true || !text) return null
// // // // //   return (
// // // // //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// // // // //       {text}
// // // // //     </div>
// // // // //   )
// // // // // }

// // // // // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// // // // //   const { countryCode, substore, switchCountry } = useStorefront()
// // // // //   const [open, setOpen] = useState(false)
// // // // //   const [logoFailed, setLogoFailed] = useState(false)
// // // // //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// // // // //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// // // // //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// // // // //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// // // // //   // If the file is missing/404s we fall back to the MIRAKI wordmark.
// // // // //   const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

// // // // //   return (
// // // // //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
// // // // //       <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
// // // // //         {/* Left nav (desktop) */}
// // // // //         <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
// // // // //           {nav.map((item) => (
// // // // //             <a
// // // // //               key={item.label}
// // // // //               href={item.href}
// // // // //               className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// // // // //             >
// // // // //               {item.label}
// // // // //             </a>
// // // // //           ))}
// // // // //         </nav>

// // // // //         {/* Mobile menu button */}
// // // // //         <button
// // // // //           type="button"
// // // // //           className="text-sf-ink lg:hidden"
// // // // //           aria-expanded={open}
// // // // //           aria-label={open ? "Close menu" : "Open menu"}
// // // // //           onClick={() => setOpen((v) => !v)}
// // // // //         >
// // // // //           {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
// // // // //         </button>

// // // // //         {/* Center brand — uploaded substore logo when available, else wordmark */}
// // // // //         <a
// // // // //           href="/"
// // // // //            className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
// // // // //           aria-label={`${brand} home`}
// // // // //         >
// // // // //           {logoSrc ? (
// // // // //             <img
// // // // //               src={logoSrc || "/placeholder.svg"}
// // // // //               alt={substore?.settings?.storeName || brand}
// // // // //               className="h-[14] w-[200px] object-cover object-center"
// // // // //               decoding="async"
// // // // //             />
// // // // //           ) : (
// // // // //             <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// // // // //           )}
// // // // //           {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// // // // //         </a>

// // // // //         {/* Right nav + icons */}
// // // // //         <div className="flex flex-1 items-center justify-end gap-6">
// // // // //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// // // // //             {navRight.map((item) => (
// // // // //               <a
// // // // //                 key={item.label}
// // // // //                 href={item.href}
// // // // //                 className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// // // // //               >
// // // // //                 {item.label}
// // // // //               </a>
// // // // //             ))}
// // // // //           </nav>
// // // // //           <button
// // // // //             type="button"
// // // // //             className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
// // // // //           >
// // // // //             Search
// // // // //           </button>
// // // // //           {showCountrySwitcher ? (
// // // // //             <label className="relative flex items-center">
// // // // //               <span className="sr-only">Country</span>
// // // // //               <select
// // // // //                 value={active.code}
// // // // //                 onChange={(e) => switchCountry(e.target.value)}
// // // // //                 className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
// // // // //               >
// // // // //                 {COUNTRIES.map((c) => (
// // // // //                   <option key={c.code} value={c.code}>
// // // // //                     {c.label}
// // // // //                   </option>
// // // // //                 ))}
// // // // //               </select>
// // // // //               <ChevronDown
// // // // //                 className="pointer-events-none absolute right-0 size-4 text-sf-ink"
// // // // //                 aria-hidden="true"
// // // // //               />
// // // // //             </label>
// // // // //           ) : null}
// // // // //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // // //             <User className="size-5" aria-hidden="true" />
// // // // //           </button>
// // // // //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // // //             <Heart className="size-5" aria-hidden="true" />
// // // // //           </button>
// // // // //           <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
// // // // //             <ShoppingBag className="size-5" aria-hidden="true" />
// // // // //             <span
// // // // //               aria-hidden="true"
// // // // //               className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
// // // // //             >
// // // // //               1
// // // // //             </span>
// // // // //           </button>
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* Mobile nav drawer */}
// // // // //       {open ? (
// // // // //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
// // // // //           <ul className="flex flex-col gap-3">
// // // // //             {[...nav, ...navRight].map((item) => (
// // // // //               <li key={item.label}>
// // // // //                 <a
// // // // //                   href={item.href}
// // // // //                   onClick={() => setOpen(false)}
// // // // //                   className="font-sans text-base text-sf-ink hover:text-sf-brand"
// // // // //                 >
// // // // //                   {item.label}
// // // // //                 </a>
// // // // //               </li>
// // // // //             ))}
// // // // //           </ul>
// // // // //         </nav>
// // // // //       ) : null}
// // // // //     </header>
// // // // //   )
// // // // // }

// // // // // export function Hero({ headline, ctas = [], image, imageAlt }) {
// // // // //   return (
// // // // //     <section className="relative isolate min-h-[70vh] overflow-hidden lg:min-h-[85vh]">
// // // // //       {/* LCP image: eager + high priority + explicit dimensions = fast paint, zero CLS */}
// // // // //       <img
// // // // //         src={image || "/placeholder.svg"}
// // // // //         alt={imageAlt || ""}
// // // // //         width="1600"
// // // // //         height="900"
// // // // //         fetchPriority="high"
// // // // //         decoding="async"
// // // // //         className="absolute inset-0 size-full object-cover object-[70%_center]"
// // // // //       />
// // // // //       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" aria-hidden="true" />
// // // // //       <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 lg:min-h-[85vh] lg:px-8">
// // // // //         <div className="max-w-xl">
// // // // //           <h1 className="font-sf-display text-4xl font-medium tracking-[0.18em] text-white uppercase text-balance md:text-5xl lg:text-6xl">
// // // // //             {headline}
// // // // //           </h1>
// // // // //           <div className="mt-8 flex flex-col items-start gap-4">
// // // // //             {ctas.map((cta) => (
// // // // //               <a
// // // // //                 key={cta.label}
// // // // //                 href={cta.href}
// // // // //                 className="text-lg text-white underline underline-offset-8 transition-opacity hover:opacity-75"
// // // // //               >
// // // // //                 {cta.label}
// // // // //               </a>
// // // // //             ))}
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function CategoryTiles({ title, sub, cta, items = [] }) {
// // // // //   return (
// // // // //     <section id="jewelry" className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // // //       <div className="text-center">
// // // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // //           {title}
// // // // //         </h2>
// // // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // // //       </div>
// // // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // // //         {items.map((item) => (
// // // // //           <a key={item.name} href={item.href} className="group block">
// // // // //             <div className="overflow-hidden bg-sf-surface">
// // // // //               <img
// // // // //                 src={item.image || "/placeholder.svg"}
// // // // //                 alt={item.name}
// // // // //                 width="600"
// // // // //                 height="750"
// // // // //                 loading="lazy"
// // // // //                 decoding="async"
// // // // //                 className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // //               />
// // // // //             </div>
// // // // //             <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">{item.name}</p>
// // // // //           </a>
// // // // //         ))}
// // // // //       </div>
// // // // //       {cta ? (
// // // // //         <div className="mt-10 text-center">
// // // // //           <a
// // // // //             href={cta.href}
// // // // //             className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// // // // //           >
// // // // //             {cta.label}
// // // // //           </a>
// // // // //         </div>
// // // // //       ) : null}
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function StoryBand({ title, cards = [] }) {
// // // // //   return (
// // // // //     <section id="engagement" className="bg-sf-surface py-16 lg:py-24">
// // // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // //           {title}
// // // // //         </h2>
// // // // //         <div className="mt-10 grid gap-6 md:grid-cols-3">
// // // // //           {cards.map((card) => (
// // // // //             <article key={card.title} className="group flex flex-col bg-sf-bg">
// // // // //               <div className="overflow-hidden">
// // // // //                 <img
// // // // //                   src={card.image || "/placeholder.svg"}
// // // // //                   alt={card.title}
// // // // //                   width="600"
// // // // //                   height="720"
// // // // //                   loading="lazy"
// // // // //                   decoding="async"
// // // // //                   className="aspect-[5/6] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // //                 />
// // // // //               </div>
// // // // //               <div className="flex flex-1 flex-col items-center gap-3 p-6 text-center">
// // // // //                 <h3 className="font-sf-display text-2xl text-sf-ink">{card.title}</h3>
// // // // //                 <p className="leading-relaxed text-sf-muted text-pretty">{card.sub}</p>
// // // // //                 {card.cta ? (
// // // // //                   <a
// // // // //                     href={card.cta.href}
// // // // //                     className="mt-auto pt-2 text-sm tracking-widest text-sf-brand uppercase underline underline-offset-4 hover:opacity-75"
// // // // //                   >
// // // // //                     {card.cta.label}
// // // // //                   </a>
// // // // //                 ) : null}
// // // // //               </div>
// // // // //             </article>
// // // // //           ))}
// // // // //         </div>
// // // // //       </div>
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// // // // //   const { formatPrice } = useStorefront()
// // // // //   const [activeTab, setActiveTab] = useState(0)

// // // // //   return (
// // // // //     <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
// // // // //       <div className="text-center">
// // // // //         <h2 className="font-sf-display text-3xl font-medium tracking-wide text-sf-ink text-balance md:text-4xl">
// // // // //           {title}
// // // // //         </h2>
// // // // //         {sub ? <p className="mx-auto mt-3 max-w-xl leading-relaxed text-sf-muted text-pretty">{sub}</p> : null}
// // // // //       </div>

// // // // //       {tabs.length ? (
// // // // //         <div role="tablist" aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2">
// // // // //           {tabs.map((tab, i) => (
// // // // //             <button
// // // // //               key={tab}
// // // // //               role="tab"
// // // // //               aria-selected={i === activeTab}
// // // // //               onClick={() => setActiveTab(i)}
// // // // //               className={`px-5 py-2 text-sm tracking-widest uppercase transition-colors ${
// // // // //                 i === activeTab
// // // // //                   ? "bg-sf-brand text-sf-brand-foreground"
// // // // //                   : "border border-sf-line text-sf-muted hover:border-sf-brand hover:text-sf-brand"
// // // // //               }`}
// // // // //             >
// // // // //               {tab}
// // // // //             </button>
// // // // //           ))}
// // // // //         </div>
// // // // //       ) : null}

// // // // //       <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
// // // // //         {products.map((product) => (
// // // // //           <article key={product.name} className="group">
// // // // //             <div className="relative overflow-hidden bg-sf-surface">
// // // // //               {product.tag ? (
// // // // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // // // //                   {product.tag}
// // // // //                 </span>
// // // // //               ) : null}
// // // // //               <img
// // // // //                 src={product.image || "/placeholder.svg"}
// // // // //                 alt={product.name}
// // // // //                 width="600"
// // // // //                 height="600"
// // // // //                 loading="lazy"
// // // // //                 decoding="async"
// // // // //                 className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // //               />
// // // // //             </div>
// // // // //             <div className="mt-3 text-center">
// // // // //               <h3 className="font-sf-display text-lg text-sf-ink">{product.name}</h3>
// // // // //               <p className="mt-1 flex items-center justify-center gap-2 text-sm">
// // // // //                 <span className="font-medium text-sf-brand">{formatPrice(product.price)}</span>
// // // // //                 {product.compareAtPrice ? (
// // // // //                   <s className="text-sf-muted">{formatPrice(product.compareAtPrice)}</s>
// // // // //                 ) : null}
// // // // //               </p>
// // // // //             </div>
// // // // //           </article>
// // // // //         ))}
// // // // //       </div>
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function BannerDuo({ items = [] }) {
// // // // //   return (
// // // // //     <section id="bespoke" className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-2 lg:px-8 lg:pb-24">
// // // // //       {items.map((item) => (
// // // // //         <article key={item.title} className="group relative isolate overflow-hidden">
// // // // //           <img
// // // // //             src={item.image || "/placeholder.svg"}
// // // // //             alt={item.title}
// // // // //             width="800"
// // // // //             height="560"
// // // // //             loading="lazy"
// // // // //             decoding="async"
// // // // //             className="aspect-[10/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
// // // // //           />
// // // // //           <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 lg:p-8">
// // // // //             <h3 className="font-sf-display text-2xl text-white md:text-3xl">{item.title}</h3>
// // // // //             <p className="max-w-sm leading-relaxed text-white/85 text-pretty">{item.sub}</p>
// // // // //             {item.cta ? (
// // // // //               <a
// // // // //                 href={item.cta.href}
// // // // //                 className="mt-2 text-sm tracking-widest text-white uppercase underline underline-offset-4 hover:opacity-75"
// // // // //               >
// // // // //                 {item.cta.label}
// // // // //               </a>
// // // // //             ) : null}
// // // // //           </div>
// // // // //         </article>
// // // // //       ))}
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function Testimonials({ title, items = [] }) {
// // // // //   return (
// // // // //     <section className="bg-sf-brand py-16 lg:py-20">
// // // // //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// // // // //         <h2 className="text-center font-sf-display text-3xl font-medium tracking-wide text-sf-brand-foreground text-balance md:text-4xl">
// // // // //           {title}
// // // // //         </h2>
// // // // //         <div className="mt-10 grid gap-8 md:grid-cols-3">
// // // // //           {items.map((item) => (
// // // // //             <figure key={item.author} className="flex flex-col gap-4 text-center">
// // // // //               <blockquote className="font-sf-display text-xl leading-relaxed text-sf-brand-foreground text-pretty">
// // // // //                 &ldquo;{item.quote}&rdquo;
// // // // //               </blockquote>
// // // // //               <figcaption className="text-sm tracking-widest text-sf-brand-foreground/70 uppercase">
// // // // //                 {item.author}
// // // // //               </figcaption>
// // // // //             </figure>
// // // // //           ))}
// // // // //         </div>
// // // // //       </div>
// // // // //     </section>
// // // // //   )
// // // // // }

// // // // // export function Footer({ newsletterTitle, newsletterCta, columns = [], copyright }) {
// // // // //   const [email, setEmail] = useState("")
// // // // //   const [subscribed, setSubscribed] = useState(false)

// // // // //   function onSubmit(e) {
// // // // //     e.preventDefault()
// // // // //     if (email.trim()) setSubscribed(true)
// // // // //   }

// // // // //   return (
// // // // //     <footer id="contact" className="border-t border-sf-line bg-sf-surface">
// // // // //       <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
// // // // //         {/* Newsletter */}
// // // // //         <div className="mx-auto max-w-lg text-center">
// // // // //           <h2 className="font-sf-display text-2xl text-sf-ink text-balance">{newsletterTitle}</h2>
// // // // //           {subscribed ? (
// // // // //             <p className="mt-4 text-sf-brand">{"Thank you for subscribing — see you in your inbox."}</p>
// // // // //           ) : (
// // // // //             <form onSubmit={onSubmit} className="mt-4 flex gap-0">
// // // // //               <label htmlFor="sf-newsletter" className="sr-only">
// // // // //                 Email address
// // // // //               </label>
// // // // //               <input
// // // // //                 id="sf-newsletter"
// // // // //                 type="email"
// // // // //                 required
// // // // //                 value={email}
// // // // //                 onChange={(e) => setEmail(e.target.value)}
// // // // //                 placeholder="Your email"
// // // // //                 className="min-w-0 flex-1 border border-sf-line bg-sf-bg px-4 py-3 text-sf-ink placeholder:text-sf-muted focus:border-sf-brand focus:outline-none"
// // // // //               />
// // // // //               <button
// // // // //                 type="submit"
// // // // //                 className="shrink-0 bg-sf-brand px-6 py-3 text-sm tracking-widest text-sf-brand-foreground uppercase transition-opacity hover:opacity-90"
// // // // //               >
// // // // //                 {newsletterCta}
// // // // //               </button>
// // // // //             </form>
// // // // //           )}
// // // // //         </div>

// // // // //         {/* Link columns */}
// // // // //         <div className="mt-14 grid gap-10 sm:grid-cols-3">
// // // // //           {columns.map((col) => (
// // // // //             <nav key={col.title} aria-label={col.title}>
// // // // //               <h3 className="text-sm font-medium tracking-widest text-sf-ink uppercase">{col.title}</h3>
// // // // //               <ul className="mt-4 flex flex-col gap-2">
// // // // //                 {col.links.map((link) => (
// // // // //                   <li key={link.label}>
// // // // //                     <a href={link.href} className="text-sf-muted transition-colors hover:text-sf-brand">
// // // // //                       {link.label}
// // // // //                     </a>
// // // // //                   </li>
// // // // //                 ))}
// // // // //               </ul>
// // // // //             </nav>
// // // // //           ))}
// // // // //         </div>

// // // // //         <p className="mt-14 border-t border-sf-line pt-6 text-center text-sm text-sf-muted">{copyright}</p>
// // // // //       </div>
// // // // //     </footer>
// // // // //   )
// // // // // }

// // // // // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // // // // export const SECTION_REGISTRY = {
// // // // //   announcement: AnnouncementBar,
// // // // //   header: Header,
// // // // //   hero: Hero,
// // // // //   categoryTiles: CategoryTiles,
// // // // //   storyBand: StoryBand,
// // // // //   productCarousel: ProductCarousel,
// // // // //   bannerDuo: BannerDuo,
// // // // //   testimonials: Testimonials,
// // // // //   footer: Footer,
// // // // // }


// // // // "use client"

// // // // import { useState } from "react"
// // // // import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
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

// // // // export function AnnouncementBar({ text, show }) {
// // // //   // Visibility is controlled from the canvas JSON: the announcement renders
// // // //   // ONLY when the section's props include `"show": true`. If the flag is
// // // //   // missing or false in the canvas, the bar is hidden in the UI.
// // // //   if (show !== true || !text) return null
// // // //   return (
// // // //     <div className="bg-sf-brand px-4 py-2 text-center text-xs tracking-widest text-sf-brand-foreground uppercase">
// // // //       {text}
// // // //     </div>
// // // //   )
// // // // }

// // // // export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
// // // //   const { countryCode, substore, switchCountry } = useStorefront()
// // // //   const [open, setOpen] = useState(false)
// // // //   const [logoFailed, setLogoFailed] = useState(false)
// // // //   const active = COUNTRIES.find((c) => c.code === (countryCode || substore?.countryCodes?.[0])) ?? COUNTRIES[0]

// // // //   // When the resolved substore (e.g. the India store) has an uploaded logo,
// // // //   // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
// // // //   // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
// // // //   // If the file is missing/404s we fall back to the MIRAKI wordmark.
// // // //   const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

// // // //   return (
// // // //     <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
// // // //       <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
// // // //         {/* Left nav (desktop) */}
// // // //         <nav aria-label="Primary" className="hidden flex-1 items-center justify-evenly gap-8 lg:flex">
// // // //           {nav.map((item) => (
// // // //             <a
// // // //               key={item.label}
// // // //               href={item.href}
// // // //               className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
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

// // // //         {/* Center brand — uploaded substore logo when available, else wordmark */}
// // // //         <a
// // // //           href="/"
// // // //           className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
// // // //           aria-label={`${brand} home`}
// // // //         >
// // // //           {logoSrc ? (
// // // //             <img
// // // //               src={logoSrc || "/placeholder.svg"}
// // // //               alt={substore?.settings?.storeName || brand}
// // // //               className="h-[14] w-[200px] object-cover object-center"
// // // //               decoding="async"
// // // //             />
// // // //           ) : (
// // // //             <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
// // // //           )}
// // // //           {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
// // // //         </a>

// // // //         {/* Right nav + icons */}
// // // //         <div className="flex flex-1 items-center justify-end gap-6">
// // // //           <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
// // // //             {navRight.map((item) => (
// // // //               <a
// // // //                 key={item.label}
// // // //                 href={item.href}
// // // //                 className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
// // // //               >
// // // //                 {item.label}
// // // //               </a>
// // // //             ))}
// // // //           </nav>
// // // //           <button
// // // //             type="button"
// // // //             className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
// // // //           >
// // // //             Search
// // // //           </button>
// // // //           {showCountrySwitcher ? (
// // // //             <label className="relative flex items-center">
// // // //               <span className="sr-only">Country</span>
// // // //               <select
// // // //                 value={active.code}
// // // //                 onChange={(e) => switchCountry(e.target.value)}
// // // //                 className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
// // // //               >
// // // //                 {COUNTRIES.map((c) => (
// // // //                   <option key={c.code} value={c.code}>
// // // //                     {c.label}
// // // //                   </option>
// // // //                 ))}
// // // //               </select>
// // // //               <ChevronDown
// // // //                 className="pointer-events-none absolute right-0 size-4 text-sf-ink"
// // // //                 aria-hidden="true"
// // // //               />
// // // //             </label>
// // // //           ) : null}
// // // //           <button type="button" aria-label="Account" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // //             <User className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //           <button type="button" aria-label="Wishlist" className="hidden text-sf-ink hover:text-sf-brand sm:block">
// // // //             <Heart className="size-5" aria-hidden="true" />
// // // //           </button>
// // // //           <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
// // // //             <ShoppingBag className="size-5" aria-hidden="true" />
// // // //             <span
// // // //               aria-hidden="true"
// // // //               className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
// // // //             >
// // // //               1
// // // //             </span>
// // // //           </button>
// // // //         </div>
// // // //       </div>

// // // //       {/* Mobile nav drawer */}
// // // //       {open ? (
// // // //         <nav aria-label="Mobile" className="border-t border-sf-line bg-sf-nav px-4 py-4 lg:hidden">
// // // //           <ul className="flex flex-col gap-3">
// // // //             {[...nav, ...navRight].map((item) => (
// // // //               <li key={item.label}>
// // // //                 <a
// // // //                   href={item.href}
// // // //                   onClick={() => setOpen(false)}
// // // //                   className="font-sans text-base text-sf-ink hover:text-sf-brand"
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
// // // //             <div className="relative aspect-[4/5] overflow-hidden bg-sf-surface">
// // // //               {/* Primary image — fades out on hover when an alternate is provided */}
// // // //               <img
// // // //                 src={item.image || "/placeholder.svg"}
// // // //                 alt={item.name}
// // // //                 width="600"
// // // //                 height="750"
// // // //                 loading="lazy"
// // // //                 decoding="async"
// // // //                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// // // //                   item.hoverImage ? "group-hover:opacity-0" : ""
// // // //                 }`}
// // // //               />
// // // //               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// // // //               {item.hoverImage ? (
// // // //                 <img
// // // //                   src={item.hoverImage || "/placeholder.svg"}
// // // //                   alt=""
// // // //                   aria-hidden="true"
// // // //                   width="600"
// // // //                   height="750"
// // // //                   loading="lazy"
// // // //                   decoding="async"
// // // //                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// // // //                 />
// // // //               ) : null}
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
// // // //             <div className="relative aspect-square overflow-hidden bg-sf-surface">
// // // //               {product.tag ? (
// // // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // // //                   {product.tag}
// // // //                 </span>
// // // //               ) : null}
// // // //               {/* Primary image — fades out on hover when an alternate is provided */}
// // // //               <img
// // // //                 src={product.image || "/placeholder.svg"}
// // // //                 alt={product.name}
// // // //                 width="600"
// // // //                 height="600"
// // // //                 loading="lazy"
// // // //                 decoding="async"
// // // //                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// // // //                   product.hoverImage ? "group-hover:opacity-0" : ""
// // // //                 }`}
// // // //               />
// // // //               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// // // //               {product.hoverImage ? (
// // // //                 <img
// // // //                   src={product.hoverImage || "/placeholder.svg"}
// // // //                   alt=""
// // // //                   aria-hidden="true"
// // // //                   width="600"
// // // //                   height="600"
// // // //                   loading="lazy"
// // // //                   decoding="async"
// // // //                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// // // //                 />
// // // //               ) : null}
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

// // // import { useRef, useState } from "react"
// // // import { motion } from "motion/react"
// // // import { ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
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
// // //       <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
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
// // //           className="flex h-14 w-[220px] shrink-0 flex-col items-center justify-center overflow-hidden text-center"
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
// // //   const scrollerRef = useRef(null)

// // //   const scrollBy = (dir) => {
// // //     const el = scrollerRef.current
// // //     if (!el) return
// // //     // Scroll by roughly one card width so items snap neatly into view.
// // //     const amount = el.clientWidth * 0.8
// // //     el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" })
// // //   }

// // //   return (
// // //     <section id="jewelry" className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
// // //       {/* Full-bleed heading row: rule extends to the right viewport edge (not cut at the container) */}
// // //       {/* Slides in from the right and scales up into place when it enters the viewport */}
// // //       <motion.div
// // //         className="flex items-center gap-3 px-4 sm:gap-6 sm:pr-0 lg:pl-8"
// // //         initial={{ opacity: 0, x: 120, scale: 0.8 }}
// // //         whileInView={{ opacity: 1, x: 0, scale: 1 }}
// // //         viewport={{ once: true, amount: 0.6 }}
// // //         transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
// // //       >
// // //         {/* Invisible left spacer balances the right rule so the heading stays centered */}
// // //         <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
// // //         <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
// // //           {title}
// // //         </h2>
// // //         <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
// // //       </motion.div>

// // //       <div className="mx-auto mt-10 max-w-[1600px] px-6 sm:px-10 lg:px-14 xl:px-16">
// // //         {/* Horizontal side-scroll carousel */}
// // //         <div className="relative">
// // //           <button
// // //             type="button"
// // //             onClick={() => scrollBy("prev")}
// // //             aria-label="Previous"
// // //             className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:left-0 lg:-translate-x-4"
// // //           >
// // //             <ChevronLeft className="size-6" />
// // //           </button>
// // //           <button
// // //             type="button"
// // //             onClick={() => scrollBy("next")}
// // //             aria-label="Next"
// // //             className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:right-0 lg:translate-x-4"
// // //           >
// // //             <ChevronRight className="size-6" />
// // //           </button>

// // //           <div
// // //             ref={scrollerRef}
// // //             className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 lg:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
// // //           >
// // //             {items.map((item) => (
// // //               <a
// // //                 key={item.name}
// // //                 href={item.href}
// // //                 className="group block w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3rem)/3)]"
// // //               >
// // //                 <div className="relative aspect-square overflow-hidden bg-sf-bg shadow-sm">
// // //                   {/* Primary image — fades out on hover when an alternate is provided */}
// // //                   <img
// // //                     src={item.image || "/placeholder.svg"}
// // //                     alt={item.name}
// // //                     width="600"
// // //                     height="600"
// // //                     loading="lazy"
// // //                     decoding="async"
// // //                     className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// // //                       item.hoverImage ? "group-hover:opacity-0" : ""
// // //                     }`}
// // //                   />
// // //                   {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// // //                   {item.hoverImage ? (
// // //                     <img
// // //                       src={item.hoverImage || "/placeholder.svg"}
// // //                       alt=""
// // //                       aria-hidden="true"
// // //                       width="600"
// // //                       height="600"
// // //                       loading="lazy"
// // //                       decoding="async"
// // //                       className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// // //                     />
// // //                   ) : null}
// // //                 </div>
// // //                 <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">
// // //                   {item.name}
// // //                 </p>
// // //               </a>
// // //             ))}
// // //           </div>
// // //         </div>

// // //         {sub ? (
// // //           <p className="mx-auto mt-12 max-w-none text-center font-sf-display text-xl leading-relaxed text-sf-ink text-pretty sm:text-2xl lg:whitespace-nowrap">
// // //             {sub}
// // //           </p>
// // //         ) : null}
// // //         {cta ? (
// // //           <div className="mt-8 text-center">
// // //             <a
// // //               href={cta.href}
// // //               className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// // //             >
// // //               {cta.label}
// // //             </a>
// // //           </div>
// // //         ) : null}
// // //       </div>
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
// // //             <div className="relative aspect-square overflow-hidden bg-sf-surface">
// // //               {product.tag ? (
// // //                 <span className="absolute top-3 left-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-widest text-sf-brand-foreground uppercase">
// // //                   {product.tag}
// // //                 </span>
// // //               ) : null}
// // //               {/* Primary image — fades out on hover when an alternate is provided */}
// // //               <img
// // //                 src={product.image || "/placeholder.svg"}
// // //                 alt={product.name}
// // //                 width="600"
// // //                 height="600"
// // //                 loading="lazy"
// // //                 decoding="async"
// // //                 className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// // //                   product.hoverImage ? "group-hover:opacity-0" : ""
// // //                 }`}
// // //               />
// // //               {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// // //               {product.hoverImage ? (
// // //                 <img
// // //                   src={product.hoverImage || "/placeholder.svg"}
// // //                   alt=""
// // //                   aria-hidden="true"
// // //                   width="600"
// // //                   height="600"
// // //                   loading="lazy"
// // //                   decoding="async"
// // //                   className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// // //                 />
// // //               ) : null}
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

// // import { useRef, useState } from "react"
// // import { motion } from "motion/react"
// // import { ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, ShoppingBag, User, X } from "lucide-react"
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
// //   const scrollerRef = useRef(null)

// //   const scrollBy = (dir) => {
// //     const el = scrollerRef.current
// //     if (!el) return
// //     // Scroll by roughly one card width so items snap neatly into view.
// //     const amount = el.clientWidth * 0.8
// //     el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" })
// //   }

// //   return (
// //     <section id="jewelry" className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
// //       {/* Full-bleed heading row: rule extends to the right viewport edge (not cut at the container) */}
// //       {/* Slides in from the right and scales up into place when it enters the viewport */}
// //       <motion.div
// //         className="flex items-center gap-3 px-4 sm:gap-6 sm:pr-0 lg:pl-8"
// //         initial={{ opacity: 0, x: 120, scale: 0.8 }}
// //         whileInView={{ opacity: 1, x: 0, scale: 1 }}
// //         viewport={{ once: true, amount: 0.6 }}
// //         transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
// //       >
// //         {/* Invisible left spacer balances the right rule so the heading stays centered */}
// //         <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
// //         <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
// //           {title}
// //         </h2>
// //         <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
// //       </motion.div>

// //       <div className="mx-auto mt-10 max-w-[1600px] px-6 sm:px-10 lg:px-14 xl:px-16">
// //         {/* Horizontal side-scroll carousel */}
// //         <div className="relative">
// //           <button
// //             type="button"
// //             onClick={() => scrollBy("prev")}
// //             aria-label="Previous"
// //             className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:left-0 lg:-translate-x-4"
// //           >
// //             <ChevronLeft className="size-6" />
// //           </button>
// //           <button
// //             type="button"
// //             onClick={() => scrollBy("next")}
// //             aria-label="Next"
// //             className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-sf-bg/90 p-2 text-sf-brand shadow-md transition-colors hover:bg-sf-bg lg:right-0 lg:translate-x-4"
// //           >
// //             <ChevronRight className="size-6" />
// //           </button>

// //           <div
// //             ref={scrollerRef}
// //             className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 lg:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
// //           >
// //             {items.map((item) => (
// //               <a
// //                 key={item.name}
// //                 href={item.href}
// //                 className="group block w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3rem)/3)]"
// //               >
// //                 <div className="relative aspect-square overflow-hidden bg-sf-bg shadow-sm">
// //                   {/* Primary image — fades out on hover when an alternate is provided */}
// //                   <img
// //                     src={item.image || "/placeholder.svg"}
// //                     alt={item.name}
// //                     width="600"
// //                     height="600"
// //                     loading="lazy"
// //                     decoding="async"
// //                     className={`absolute inset-0 size-full object-cover transition-all duration-500 group-hover:scale-105 ${
// //                       item.hoverImage ? "group-hover:opacity-0" : ""
// //                     }`}
// //                   />
// //                   {/* Secondary image — revealed on hover (crossfade + subtle zoom) */}
// //                   {item.hoverImage ? (
// //                     <img
// //                       src={item.hoverImage || "/placeholder.svg"}
// //                       alt=""
// //                       aria-hidden="true"
// //                       width="600"
// //                       height="600"
// //                       loading="lazy"
// //                       decoding="async"
// //                       className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
// //                     />
// //                   ) : null}
// //                 </div>
// //                 <p className="mt-3 text-center font-sf-display text-xl text-sf-ink group-hover:text-sf-brand">
// //                   {item.name}
// //                 </p>
// //               </a>
// //             ))}
// //           </div>
// //         </div>

// //         {sub ? (
// //           <p className="mx-auto mt-12 max-w-none text-center font-sf-display text-xl leading-relaxed text-sf-ink text-pretty sm:text-2xl lg:whitespace-nowrap">
// //             {sub}
// //           </p>
// //         ) : null}
// //         {cta ? (
// //           <div className="mt-8 text-center">
// //             <a
// //               href={cta.href}
// //               className="inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// //             >
// //               {cta.label}
// //             </a>
// //           </div>
// //         ) : null}
// //       </div>
// //     </section>
// //   )
// // }

// // export function StoryBand({ title, eyebrow, cards = [] }) {
// //   return (
// //     <section id="engagement" className="overflow-x-clip bg-sf-bg py-16 lg:py-24">
// //       {/* Staggered decorative heading: title slides in from the left, eyebrow from the right */}
// //       <div className="flex flex-col gap-3 px-4 lg:px-8">
// //         {/* Title row: solid rule extends to the left; invisible spacer keeps it centered */}
// //         <motion.div
// //           className="flex items-center gap-4 sm:gap-6"
// //           initial={{ opacity: 0, x: -120, scale: 0.8 }}
// //           whileInView={{ opacity: 1, x: 0, scale: 1 }}
// //           viewport={{ once: true, amount: 0.6 }}
// //           transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
// //         >
// //           <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
// //           <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
// //             {title}
// //           </h2>
// //           <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
// //         </motion.div>

// //         {/* Eyebrow row: invisible spacer on the left; solid rule extends to the right */}
// //         {eyebrow ? (
// //           <motion.div
// //             className="flex items-center gap-4 sm:gap-6"
// //             initial={{ opacity: 0, x: 120, scale: 0.8 }}
// //             whileInView={{ opacity: 1, x: 0, scale: 1 }}
// //             viewport={{ once: true, amount: 0.6 }}
// //             transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
// //           >
// //             <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
// //             <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
// //               {eyebrow}
// //             </span>
// //             <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
// //           </motion.div>
// //         ) : null}
// //       </div>

// //       {/* Alternating editorial rows: large image on one side, story + CTA on the other */}
// //       <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-16 px-6 sm:px-10 lg:mt-14 lg:gap-0 lg:px-8">
// //         {cards.map((card, i) => {
// //           const reversed = i % 2 === 1
// //           return (
// //             <div key={card.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
// //               {/* Image */}
// //               <motion.div
// //                 className={`group overflow-hidden ${reversed ? "lg:order-2" : ""}`}
// //                 initial={{ opacity: 0, scale: 1.1 }}
// //                 whileInView={{ opacity: 1, scale: 1 }}
// //                 viewport={{ once: true, amount: 0.3 }}
// //                 transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
// //               >
// //                 <img
// //                   src={card.image || "/placeholder.svg"}
// //                   alt={card.title}
// //                   width="720"
// //                   height="900"
// //                   loading="lazy"
// //                   decoding="async"
// //                   className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
// //                 />
// //               </motion.div>

// //               {/* Content */}
// //               <motion.div
// //                 className={`flex flex-col items-start ${reversed ? "lg:order-1 lg:pr-6" : "lg:pl-6"}`}
// //                 initial={{ opacity: 0, x: reversed ? -60 : 60 }}
// //                 whileInView={{ opacity: 1, x: 0 }}
// //                 viewport={{ once: true, amount: 0.4 }}
// //                 transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
// //               >
// //                 <div className="mb-5 flex items-center gap-3">
// //                   <span className="h-px w-10 bg-sf-brand" />
// //                   <span className="font-sf-display text-sm tracking-[0.3em] text-sf-brand/70 uppercase">
// //                     {String(i + 1).padStart(2, "0")}
// //                   </span>
// //                 </div>
// //                 <h3 className="font-sf-display text-3xl leading-tight text-sf-brand text-balance md:text-4xl">
// //                   {card.title}
// //                 </h3>
// //                 <div className="mt-5 flex max-w-md flex-col gap-4">
// //                   {String(card.sub || "")
// //                     .split("\n\n")
// //                     .filter(Boolean)
// //                     .map((para, p) => (
// //                       <p key={p} className="text-lg leading-relaxed text-sf-muted text-pretty">
// //                         {para}
// //                       </p>
// //                     ))}
// //                 </div>
// //                 {card.cta ? (
// //                   <a
// //                     href={card.cta.href}
// //                     className="mt-8 inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
// //                   >
// //                     {card.cta.label}
// //                   </a>
// //                 ) : null}
// //               </motion.div>
// //             </div>
// //           )
// //         })}
// //       </div>
// //     </section>
// //   )
// // }

// // export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
// //   const { formatPrice } = useStorefront()
// //   const [activeTab, setActiveTab] = useState(0)

// //   return (
// //     <section className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
// //       {/* Staggered decorative heading: title slides in from the left, sub-eyebrow from the right */}
// //       <div className="flex flex-col gap-3 px-4 lg:px-8">
// //         <motion.div
// //           className="flex items-center gap-4 sm:gap-6"
// //           initial={{ opacity: 0, x: -120, scale: 0.8 }}
// //           whileInView={{ opacity: 1, x: 0, scale: 1 }}
// //           viewport={{ once: true, amount: 0.6 }}
// //           transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
// //         >
// //           <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
// //           <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
// //             {title}
// //           </h2>
// //           <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
// //         </motion.div>

// //         {sub ? (
// //           <motion.div
// //             className="flex items-center gap-4 sm:gap-6"
// //             initial={{ opacity: 0, x: 120, scale: 0.8 }}
// //             whileInView={{ opacity: 1, x: 0, scale: 1 }}
// //             viewport={{ once: true, amount: 0.6 }}
// //             transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
// //           >
// //             <span aria-hidden="true" className="h-px flex-1 opacity-0" />
// //             <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
// //               {sub}
// //             </span>
// //             <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
// //           </motion.div>
// //         ) : null}
// //       </div>

// //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
// //       <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
// //         {products.map((product) => {
// //           const restImg = product.mainImg || product.image || "/placeholder.svg"
// //           const hoverImg = product.hoveredImg || product.hoverImage || null
// //           const label = product.category || product.name
// //           return (
// //             <article key={product.name} className="group">
// //               <div className="relative aspect-[4/5] overflow-hidden bg-sf-surface">
// //                 {/* Rest image — dimmed + slightly desaturated, fades out on hover when an alternate exists */}
// //                 <img
// //                   src={restImg || "/placeholder.svg"}
// //                   alt={label}
// //                   width="800"
// //                   height="1000"
// //                   loading="lazy"
// //                   decoding="async"
// //                   className={`absolute inset-0 size-full object-cover brightness-90 saturate-[0.85] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-100 group-hover:saturate-100 ${
// //                     hoverImg ? "group-hover:opacity-0" : ""
// //                   }`}
// //                 />
// //                 {/* Hovered image — crossfades in with a subtle zoom */}
// //                 {hoverImg ? (
// //                   <img
// //                     src={hoverImg || "/placeholder.svg"}
// //                     alt=""
// //                     aria-hidden="true"
// //                     width="800"
// //                     height="1000"
// //                     loading="lazy"
// //                     decoding="async"
// //                     className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:opacity-100"
// //                   />
// //                 ) : null}
// //                 {/* Dark veil — lifts away on hover to unveil the photo */}
// //                 <div
// //                   aria-hidden="true"
// //                   className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/20 to-black/10 opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0"
// //                 />
// //                 {/* Centered category label overlay */}
// //                 <div className="absolute inset-0 z-20 flex items-center justify-center">
// //                   <span className="border-b border-white/80 pb-1 font-sf-display text-xl tracking-[0.2em] text-white uppercase text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:tracking-[0.3em] md:text-2xl">
// //                     {label}
// //                   </span>
// //                 </div>
// //               </div>
// //             </article>
// //           )
// //         })}
// //       </div>
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

// // export function Banner({ headline, image, imageAlt, ctas = [] }) {
// //   return (
// //     <section
// //       dir="ltr"
// //       className="relative isolate min-h-[56vh] overflow-hidden sm:min-h-[64vh] lg:min-h-[78vh]"
// //     >
// //       <img
// //         src={image || "/placeholder.svg"}
// //         alt={imageAlt || ""}
// //         width="1600"
// //         height="900"
// //         fetchPriority="high"
// //         decoding="async"
// //         className="absolute inset-0 size-full object-cover object-[78%_center] sm:object-[70%_center]"
// //       />
// //       <div
// //         className="absolute inset-0 bg-gradient-to-r from-sf-bg/70 via-sf-bg/25 to-transparent"
// //         aria-hidden="true"
// //       />
// //       <div className="relative mx-auto flex min-h-[56vh] max-w-[1600px] items-center px-6 sm:min-h-[64vh] lg:min-h-[78vh] lg:px-14">
// //         <div className="max-w-xl">
// //           <h1 className="font-sf-display text-3xl font-normal tracking-[0.2em] text-sf-ink uppercase text-balance sm:text-4xl md:text-5xl lg:text-6xl lg:tracking-[0.25em]">
// //             {headline}
// //           </h1>
// //           {ctas.length ? (
// //             <div className="mt-8 flex flex-col items-start gap-4">
// //               {ctas.map((cta) => (
// //                 <a
// //                   key={cta.label}
// //                   href={cta.href}
// //                   className="text-base tracking-wide text-sf-ink underline underline-offset-8 transition-opacity hover:opacity-70 sm:text-lg"
// //                 >
// //                   {cta.label}
// //                 </a>
// //               ))}
// //             </div>
// //           ) : null}
// //         </div>
// //       </div>
// //     </section>
// //   )
// // }

// // /** Section registry: canvas `type` → component. Unknown types render nothing. */
// // export const SECTION_REGISTRY = {
// //   announcement: AnnouncementBar,
// //   header: Header,
// //   hero: Hero,
// //   banner: Banner,
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
// import { Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, ShoppingBag, SlidersHorizontal, User, X } from "lucide-react"
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

// /**
//  * CollectionShowcase — the "Explore Our Collections" section used on the
//  * Jewelry page (mirrors mirakijewels.com/en/browse/jewelry). A bold maroon
//  * heading with a left rule, an italic sub-line with a right rule, and a row of
//  * four tall editorial tiles whose underlined serif label sits over the image.
//  * Content defaults to the four core collections but can be overridden via props.
//  */

// const DEFAULT_COLLECTION_ITEMS = [
//   { name: "Rings", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb4f72d5790036baa0d6/img_70.jpg", href: "#rings" },
//   { name: "Earrings", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfbdd57e7920032d620a4/img_58.jpg", href: "#earrings" },
//   { name: "Bracelets", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb8e5a8645002bd76c07/img_43.jpg", href: "#bracelets" },
//   { name: "Necklaces", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb0275cdf50024e15eb8/img_40.jpg", href: "#necklaces" },
// ]

// export function CollectionShowcase({
//   title = "Explore Our Collections",
//   sub = "Unlimited Possibilities, Your Perfect Selection",
//   items = DEFAULT_COLLECTION_ITEMS,
// }) {
//   const tiles = items.length ? items : DEFAULT_COLLECTION_ITEMS

//   return (
//     <section dir="ltr" className="bg-sf-bg py-16 lg:py-24">
//       <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
//         {/* Heading: centered maroon title; the rule fills the gap to its left
//             while an equal invisible spacer on the right keeps it centered. */}
//         <motion.div
//           className="flex items-center gap-4 sm:gap-8"
//           initial={{ opacity: 0, y: 24 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, amount: 0.6 }}
//           transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
//         >
//           <span aria-hidden="true" className="h-px flex-1 bg-sf-brand" />
//           <h2 className="shrink-0 text-center font-sf-display text-3xl font-bold tracking-wide text-sf-brand text-balance md:text-4xl lg:text-5xl">
//             {title}
//           </h2>
//           <span aria-hidden="true" className="h-px flex-1 opacity-0" />
//         </motion.div>

//         {/* Sub-line: centered italic maroon; here the invisible spacer is on the
//             left and the visible rule extends to the right. */}
//         {sub ? (
//           <motion.div
//             className="mt-4 flex items-center gap-4 sm:gap-8"
//             initial={{ opacity: 0, y: 24 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
//           >
//             <span aria-hidden="true" className="h-px flex-1 opacity-0" />
//             <p className="shrink-0 text-center font-sf-display text-xl italic tracking-wide text-sf-brand text-pretty md:text-2xl">
//               {sub}
//             </p>
//             <span aria-hidden="true" className="h-px flex-1 bg-sf-brand" />
//           </motion.div>
//         ) : null}

//         {/* Four tall editorial tiles with an underlined label over the image */}
//         <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
//           {tiles.map((item, i) => (
//             <motion.a
//               key={item.name}
//               href={item.href}
//               className="group relative block aspect-[3/4] overflow-hidden bg-sf-surface"
//               initial={{ opacity: 0, y: 40 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true, amount: 0.3 }}
//               transition={{ duration: 0.6, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <img
//                 src={item.image || "/placeholder.svg"}
//                 alt={item.name}
//                 width="600"
//                 height="800"
//                 loading="lazy"
//                 decoding="async"
//                 className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
//               />
//               {/* Bottom gradient keeps the white label legible over light imagery */}
//               <div
//                 className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
//                 aria-hidden="true"
//               />
//               <span className="absolute inset-x-0 bottom-5 text-center font-sf-display text-lg font-semibold tracking-wide text-white underline decoration-1 underline-offset-4 transition-opacity group-hover:opacity-90 md:text-xl">
//                 {item.name}
//               </span>
//             </motion.a>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// export function StoryBand({ title, eyebrow, cards = [] }) {
//   return (
//     <section id="engagement" className="overflow-x-clip bg-sf-bg py-16 lg:py-24">
//       {/* Staggered decorative heading: title slides in from the left, eyebrow from the right */}
//       <div className="flex flex-col gap-3 px-4 lg:px-8">
//         {/* Title row: solid rule extends to the left; invisible spacer keeps it centered */}
//         <motion.div
//           className="flex items-center gap-4 sm:gap-6"
//           initial={{ opacity: 0, x: -120, scale: 0.8 }}
//           whileInView={{ opacity: 1, x: 0, scale: 1 }}
//           viewport={{ once: true, amount: 0.6 }}
//           transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
//         >
//           <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
//           <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
//             {title}
//           </h2>
//           <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
//         </motion.div>

//         {/* Eyebrow row: invisible spacer on the left; solid rule extends to the right */}
//         {eyebrow ? (
//           <motion.div
//             className="flex items-center gap-4 sm:gap-6"
//             initial={{ opacity: 0, x: 120, scale: 0.8 }}
//             whileInView={{ opacity: 1, x: 0, scale: 1 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
//           >
//             <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
//             <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
//               {eyebrow}
//             </span>
//             <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
//           </motion.div>
//         ) : null}
//       </div>

//       {/* Alternating editorial rows: large image on one side, story + CTA on the other */}
//       <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-16 px-6 sm:px-10 lg:mt-14 lg:gap-0 lg:px-8">
//         {cards.map((card, i) => {
//           const reversed = i % 2 === 1
//           return (
//             <div key={card.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
//               {/* Image */}
//               <motion.div
//                 className={`group overflow-hidden ${reversed ? "lg:order-2" : ""}`}
//                 initial={{ opacity: 0, scale: 1.1 }}
//                 whileInView={{ opacity: 1, scale: 1 }}
//                 viewport={{ once: true, amount: 0.3 }}
//                 transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
//               >
//                 <img
//                   src={card.image || "/placeholder.svg"}
//                   alt={card.title}
//                   width="720"
//                   height="900"
//                   loading="lazy"
//                   decoding="async"
//                   className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
//                 />
//               </motion.div>

//               {/* Content */}
//               <motion.div
//                 className={`flex flex-col items-start ${reversed ? "lg:order-1 lg:pr-6" : "lg:pl-6"}`}
//                 initial={{ opacity: 0, x: reversed ? -60 : 60 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 viewport={{ once: true, amount: 0.4 }}
//                 transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
//               >
//                 <div className="mb-5 flex items-center gap-3">
//                   <span className="h-px w-10 bg-sf-brand" />
//                   <span className="font-sf-display text-sm tracking-[0.3em] text-sf-brand/70 uppercase">
//                     {String(i + 1).padStart(2, "0")}
//                   </span>
//                 </div>
//                 <h3 className="font-sf-display text-3xl leading-tight text-sf-brand text-balance md:text-4xl">
//                   {card.title}
//                 </h3>
//                 <div className="mt-5 flex max-w-md flex-col gap-4">
//                   {String(card.sub || "")
//                     .split("\n\n")
//                     .filter(Boolean)
//                     .map((para, p) => (
//                       <p key={p} className="text-lg leading-relaxed text-sf-muted text-pretty">
//                         {para}
//                       </p>
//                     ))}
//                 </div>
//                 {card.cta ? (
//                   <a
//                     href={card.cta.href}
//                     className="mt-8 inline-block border border-sf-brand px-8 py-3 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
//                   >
//                     {card.cta.label}
//                   </a>
//                 ) : null}
//               </motion.div>
//             </div>
//           )
//         })}
//       </div>
//     </section>
//   )
// }

// export function ProductCarousel({ title, sub, tabs = [], products = [] }) {
//   const { formatPrice } = useStorefront()
//   const [activeTab, setActiveTab] = useState(0)

//   return (
//     <section className="overflow-x-clip bg-sf-paper py-16 lg:py-24">
//       {/* Staggered decorative heading: title slides in from the left, sub-eyebrow from the right */}
//       <div className="flex flex-col gap-3 px-4 lg:px-8">
//         <motion.div
//           className="flex items-center gap-4 sm:gap-6"
//           initial={{ opacity: 0, x: -120, scale: 0.8 }}
//           whileInView={{ opacity: 1, x: 0, scale: 1 }}
//           viewport={{ once: true, amount: 0.6 }}
//           transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
//         >
//           <span aria-hidden="true" className="h-[2px] flex-1 bg-sf-brand" />
//           <h2 className="shrink-0 text-center font-sf-display text-lg font-semibold tracking-[0.2em] text-sf-brand uppercase text-balance sm:tracking-[0.3em] md:text-2xl lg:text-3xl lg:tracking-[0.35em]">
//             {title}
//           </h2>
//           <span aria-hidden="true" className="h-[2px] flex-1 opacity-0" />
//         </motion.div>

//         {sub ? (
//           <motion.div
//             className="flex items-center gap-4 sm:gap-6"
//             initial={{ opacity: 0, x: 120, scale: 0.8 }}
//             whileInView={{ opacity: 1, x: 0, scale: 1 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
//           >
//             <span aria-hidden="true" className="h-px flex-1 opacity-0" />
//             <span className="shrink-0 text-center font-sf-display text-sm tracking-[0.25em] text-sf-brand/80 uppercase italic sm:tracking-[0.35em] md:text-base">
//               {sub}
//             </span>
//             <span aria-hidden="true" className="h-px flex-1 bg-sf-brand/60" />
//           </motion.div>
//         ) : null}
//       </div>

//       <div className="mx-auto max-w-7xl px-4 lg:px-8">
//       <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
//         {products.map((product) => {
//           const restImg = product.mainImg || product.image || "/placeholder.svg"
//           const hoverImg = product.hoveredImg || product.hoverImage || null
//           const label = product.category || product.name
//           return (
//             <article key={product.name} className="group">
//               <div className="relative aspect-[4/5] overflow-hidden bg-sf-surface">
//                 {/* Rest image — dimmed + slightly desaturated, fades out on hover when an alternate exists */}
//                 <img
//                   src={restImg || "/placeholder.svg"}
//                   alt={label}
//                   width="800"
//                   height="1000"
//                   loading="lazy"
//                   decoding="async"
//                   className={`absolute inset-0 size-full object-cover brightness-90 saturate-[0.85] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:brightness-100 group-hover:saturate-100 ${
//                     hoverImg ? "group-hover:opacity-0" : ""
//                   }`}
//                 />
//                 {/* Hovered image — crossfades in with a subtle zoom */}
//                 {hoverImg ? (
//                   <img
//                     src={hoverImg || "/placeholder.svg"}
//                     alt=""
//                     aria-hidden="true"
//                     width="800"
//                     height="1000"
//                     loading="lazy"
//                     decoding="async"
//                     className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:opacity-100"
//                   />
//                 ) : null}
//                 {/* Dark veil — lifts away on hover to unveil the photo */}
//                 <div
//                   aria-hidden="true"
//                   className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/20 to-black/10 opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0"
//                 />
//                 {/* Centered category label overlay */}
//                 <div className="absolute inset-0 z-20 flex items-center justify-center">
//                   <span className="border-b border-white/80 pb-1 font-sf-display text-xl tracking-[0.2em] text-white uppercase text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:tracking-[0.3em] md:text-2xl">
//                     {label}
//                   </span>
//                 </div>
//               </div>
//             </article>
//           )
//         })}
//       </div>
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

// /**
//  * Banner — the full-bleed editorial hero used as the first section of the
//  * Jewelry page (mirrors mirakijewels.com/en/browse/jewelry). The image is the
//  * LCP element, so it loads eagerly with high priority and explicit dimensions
//  * to paint fast with zero layout shift. `object-position` keeps the model in
//  * frame on narrow viewports while the headline sits over the calm left space.
//  */
// export function Banner({ headline, image, imageAlt, ctas = [] }) {
//   return (
//     <section
//       dir="ltr"
//       className="relative isolate min-h-[56vh] overflow-hidden sm:min-h-[64vh] lg:min-h-[78vh]"
//     >
//       <img
//         src={image || "/placeholder.svg"}
//         alt={imageAlt || ""}
//         width="1600"
//         height="900"
//         fetchPriority="high"
//         decoding="async"
//         className="absolute inset-0 size-full object-cover object-[78%_center] sm:object-[70%_center]"
//       />
//       <div
//         className="absolute inset-0 bg-gradient-to-r from-sf-bg/70 via-sf-bg/25 to-transparent"
//         aria-hidden="true"
//       />
//       <div className="relative mx-auto flex min-h-[56vh] max-w-[1600px] items-center px-6 sm:min-h-[64vh] lg:min-h-[78vh] lg:px-14">
//         <div className="max-w-xl">
//           <h1 className="font-sf-display text-2xl font-normal tracking-[0.2em] text-sf-ink uppercase text-balance sm:text-3xl md:text-4xl lg:text-5xl lg:tracking-[0.25em]">
//             {headline}
//           </h1>
//           {ctas.length ? (
//             <div className="mt-8 flex flex-col items-start gap-4">
//               {ctas.map((cta) => (
//                 <a
//                   key={cta.label}
//                   href={cta.href}
//                   className="text-base tracking-wide text-sf-ink underline underline-offset-8 transition-opacity hover:opacity-70 sm:text-lg"
//                 >
//                   {cta.label}
//                 </a>
//               ))}
//             </div>
//           ) : null}
//         </div>
//       </div>
//     </section>
//   )
// }

// /**
//  * JewelryCollection — the browsable product grid used as the second section of
//  * the Jewelry page (mirrors mirakijewels.com/en/browse/jewelry): a filter rail
//  * (Categories + Price) on the left, a "Sort By" control on the right, and a
//  * responsive grid of product cards with a wishlist toggle. Prices are rendered
//  * through the storefront's country-aware `formatPrice`, and all content comes
//  * from the resolved canvas so it stays in sync per country.
//  */
// const DIAMOND_SHAPES = [
//   { id: "Round", label: "Round", img: "/images/filters/shape-round.png" },
//   { id: "Princess", label: "Princess", img: "/images/filters/shape-princess.png" },
//   { id: "Cushion", label: "Cushion", img: "/images/filters/shape-cushion.png" },
//   { id: "Emerald", label: "Emerald", img: "/images/filters/shape-emerald.png" },
//   { id: "Oval", label: "Oval", img: "/images/filters/shape-oval.png" },
//   { id: "Pear", label: "Pear", img: "/images/filters/shape-pear.png" },
//   { id: "Marquise", label: "Marquise", img: "/images/filters/shape-marquise.png" },
//   { id: "Radiant", label: "Radiant", img: "/images/filters/shape-radiant.png" },
//   { id: "Asscher", label: "Asscher", img: "/images/filters/shape-asscher.png" },
//   { id: "Heart", label: "Heart", img: "/images/filters/shape-heart.png" },
// ]

// const GEMSTONES = [
//   { id: "Ruby", label: "Ruby", img: "/images/filters/gem-ruby.png" },
//   { id: "Sapphire", label: "Sapphire", img: "/images/filters/gem-sapphire.png" },
//   { id: "Emerald", label: "Emerald", img: "/images/filters/gem-emerald.png" },
//   { id: "Amethyst", label: "Amethyst", img: "/images/filters/gem-amethyst.png" },
//   { id: "Topaz", label: "Topaz", img: "/images/filters/gem-topaz.png" },
//   { id: "Aquamarine", label: "Aquamarine", img: "/images/filters/gem-aquamarine.png" },
//   { id: "Garnet", label: "Garnet", img: "/images/filters/gem-garnet.png" },
//   { id: "Peridot", label: "Peridot", img: "/images/filters/gem-peridot.png" },
// ]

// const METAL_COLORS = [
//   { id: "Yellow Gold", label: "Yellow Gold", swatch: "linear-gradient(135deg,#f7e7bd 0%,#e8c766 45%,#c69a3b 100%)" },
//   { id: "White Gold", label: "White Gold", swatch: "linear-gradient(135deg,#ffffff 0%,#e6e8ea 45%,#b9bec4 100%)" },
//   { id: "Rose Gold", label: "Rose Gold", swatch: "linear-gradient(135deg,#f7d9cd 0%,#e6a68c 45%,#c67a5c 100%)" },
//   { id: "Platinum", label: "Platinum", swatch: "linear-gradient(135deg,#f2f3f4 0%,#c9ccd0 45%,#9aa0a6 100%)" },
// ]

// const CARAT_RANGES = [
//   { id: "0-0.5", label: "Under 0.5 ct", min: 0, max: 0.5 },
//   { id: "0.5-1", label: "0.5 – 1 ct", min: 0.5, max: 1 },
//   { id: "1-2", label: "1 – 2 ct", min: 1, max: 2 },
//   { id: "2-3", label: "2 – 3 ct", min: 2, max: 3 },
//   { id: "3+", label: "3 ct & above", min: 3, max: Infinity },
// ]

// const STYLES = [
//   { id: "Solitaire", label: "Solitaire" },
//   { id: "Halo", label: "Halo" },
//   { id: "Three-Stone", label: "Three-Stone" },
//   { id: "Pavé", label: "Pavé" },
//   { id: "Vintage", label: "Vintage" },
//   { id: "Modern", label: "Modern" },
// ]

// const OCCASIONS = [
//   { id: "Engagement", label: "Engagement" },
//   { id: "Wedding", label: "Wedding" },
//   { id: "Anniversary", label: "Anniversary" },
//   { id: "Everyday", label: "Everyday" },
//   { id: "Gift", label: "Gift" },
// ]

// function CollapsibleFilter({ label, defaultOpen = false, count = 0, children }) {
//   const [open, setOpen] = useState(defaultOpen)
//   return (
//     <div className="border-b border-sf-brand/15 py-4">
//       <button
//         type="button"
//         onClick={() => setOpen((v) => !v)}
//         aria-expanded={open}
//         className="flex w-full items-center justify-between font-sf-display text-base tracking-wide text-sf-ink"
//       >
//         <span className="flex items-center gap-2">
//           {label}
//           {count > 0 ? (
//             <span className="grid size-5 place-items-center rounded-full bg-sf-brand text-[11px] leading-none text-sf-brand-foreground">
//               {count}
//             </span>
//           ) : null}
//         </span>
//         <ChevronDown
//           className={`size-4 text-sf-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`}
//           aria-hidden="true"
//         />
//       </button>
//       <div
//         className={`grid transition-all duration-300 ease-out ${open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
//       >
//         <div className="overflow-hidden">{children}</div>
//       </div>
//     </div>
//   )
// }

// export function JewelryCollection({ tabs = [], products = [], priceRanges = [], loading = false }) {
//   const { formatPrice } = useStorefront()
//   const [activeCat, setActiveCat] = useState("All")
//   const [sort, setSort] = useState("featured")
//   const [filtersOpen, setFiltersOpen] = useState(true)
//   const [wishlist, setWishlist] = useState(() => new Set())
//   const [shapes, setShapes] = useState(() => new Set())
//   const [gems, setGems] = useState(() => new Set())
//   const [metals, setMetals] = useState(() => new Set())
//   const [carats, setCarats] = useState(() => new Set())
//   const [styles, setStyles] = useState(() => new Set())
//   const [occasions, setOccasions] = useState(() => new Set())

//   const categories = ["All", ...tabs]

//   const toggleFrom = (setter) => (value) =>
//     setter((prev) => {
//       const next = new Set(prev)
//       next.has(value) ? next.delete(value) : next.add(value)
//       return next
//     })
//   const toggleWishlist = toggleFrom(setWishlist)
//   const toggleShape = toggleFrom(setShapes)
//   const toggleGem = toggleFrom(setGems)
//   const toggleMetal = toggleFrom(setMetals)
//   const toggleCarat = toggleFrom(setCarats)
//   const toggleStyle = toggleFrom(setStyles)
//   const toggleOccasion = toggleFrom(setOccasions)

//   const activeCount = shapes.size + gems.size + metals.size + carats.size + styles.size + occasions.size
//   const clearAll = () => {
//     setShapes(new Set())
//     setGems(new Set())
//     setMetals(new Set())
//     setCarats(new Set())
//     setStyles(new Set())
//     setOccasions(new Set())
//   }

//   // Only apply an attribute filter when the catalog actually carries that
//   // attribute, so selecting a facet never wipes an unrelated catalog empty.
//   const hasShapeData = products.some((p) => p.shape)
//   const hasGemData = products.some((p) => p.gemstone)
//   const hasMetalData = products.some((p) => p.metal)
//   const hasCaratData = products.some((p) => p.carat != null)
//   const hasStyleData = products.some((p) => p.style)
//   const hasOccasionData = products.some((p) => p.occasion)

//   // A product matches the carat facet if its carat falls in any selected range.
//   const caratInSelection = (carat) =>
//     CARAT_RANGES.some((r) => carats.has(r.id) && carat >= r.min && carat < r.max)

//   let shown = products.filter((p) => {
//     if (activeCat !== "All" && (p.category || p.tag) !== activeCat) return false
//     if (hasShapeData && shapes.size && !shapes.has(p.shape)) return false
//     if (hasGemData && gems.size && !gems.has(p.gemstone)) return false
//     if (hasMetalData && metals.size && !metals.has(p.metal)) return false
//     if (hasCaratData && carats.size && !caratInSelection(p.carat)) return false
//     if (hasStyleData && styles.size && !styles.has(p.style)) return false
//     if (hasOccasionData && occasions.size && !occasions.has(p.occasion)) return false
//     return true
//   })
//   shown = [...shown].sort((a, b) => {
//     if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0)
//     if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0)
//     if (sort === "name") return String(a.name).localeCompare(String(b.name))
//     return 0
//   })

//   return (
//     <section className="bg-sf-paper py-14 lg:py-20">
//       <div className="mx-auto flex max-w-[100rem] flex-col gap-8 px-4 lg:flex-row lg:gap-10 lg:px-8">
//         {/* Filter rail */}
//         <aside className={`w-full shrink-0 lg:w-64 ${filtersOpen ? "lg:block" : "lg:hidden"}`}>
//           <div className="flex items-center justify-between pb-3">
//             <span className="font-sf-display text-xs tracking-[0.25em] text-sf-muted uppercase">Filters</span>
//             {activeCount > 0 ? (
//               <button
//                 type="button"
//                 onClick={clearAll}
//                 className="text-xs tracking-wide text-sf-brand underline underline-offset-4 transition-opacity hover:opacity-70"
//               >
//                 Clear all ({activeCount})
//               </button>
//             ) : null}
//           </div>

//           <CollapsibleFilter label="Categories">
//             <ul className="flex flex-col gap-3">
//               {categories.map((cat) => (
//                 <li key={cat}>
//                   <button
//                     type="button"
//                     onClick={() => setActiveCat(cat)}
//                     aria-pressed={activeCat === cat}
//                     className={`text-left text-sm tracking-wide transition-colors ${
//                       activeCat === cat
//                         ? "text-sf-brand underline underline-offset-4"
//                         : "text-sf-muted hover:text-sf-ink"
//                     }`}
//                   >
//                     {cat}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Price">
//             <ul className="flex flex-col gap-3">
//               {(priceRanges.length ? priceRanges : ["Under 2,000", "2,000 - 5,000", "5,000+"]).map(
//                 (range) => (
//                   <li key={range} className="flex items-center gap-2">
//                     <span aria-hidden="true" className="size-3 rounded-[2px] border border-sf-brand/40" />
//                     <span className="text-sm text-sf-muted">{range}</span>
//                   </li>
//                 ),
//               )}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Diamond Shape" count={shapes.size}>
//             <ul className="grid grid-cols-4 gap-2">
//               {DIAMOND_SHAPES.map((shape) => {
//                 const on = shapes.has(shape.id)
//                 return (
//                   <li key={shape.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleShape(shape.id)}
//                       aria-pressed={on}
//                       title={shape.label}
//                       className={`group flex w-full flex-col items-center gap-1 rounded-md border p-1.5 transition-all ${
//                         on
//                           ? "border-sf-brand bg-sf-brand/5 shadow-[0_0_0_1px_var(--color-sf-brand,#7a1f2b)]"
//                           : "border-sf-brand/15 hover:border-sf-brand/40"
//                       }`}
//                     >
//                       <span className="grid aspect-square w-full place-items-center overflow-hidden rounded bg-white">
//                         <img
//                           src={shape.img || "/placeholder.svg"}
//                           alt={`${shape.label} cut`}
//                           width="48"
//                           height="48"
//                           loading="lazy"
//                           decoding="async"
//                           className="size-full object-contain mix-blend-multiply"
//                         />
//                       </span>
//                       <span
//                         className={`text-[9px] leading-tight tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}
//                       >
//                         {shape.label}
//                       </span>
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Gemstone" count={gems.size}>
//             <ul className="grid grid-cols-3 gap-3">
//               {GEMSTONES.map((gem) => {
//                 const on = gems.has(gem.id)
//                 return (
//                   <li key={gem.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleGem(gem.id)}
//                       aria-pressed={on}
//                       title={gem.label}
//                       className={`group flex w-full flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
//                         on
//                           ? "border-sf-brand bg-sf-brand/5 shadow-[0_0_0_1px_var(--color-sf-brand,#7a1f2b)]"
//                           : "border-sf-brand/15 hover:border-sf-brand/40 hover:bg-sf-brand/5"
//                       }`}
//                     >
//                       <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-white">
//                         <img
//                           src={gem.img || "/placeholder.svg"}
//                           alt={gem.label}
//                           width="72"
//                           height="72"
//                           loading="lazy"
//                           decoding="async"
//                           className="size-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
//                         />
//                         {on ? (
//                           <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-sf-brand text-sf-brand-foreground">
//                             <Check className="size-2.5" aria-hidden="true" />
//                           </span>
//                         ) : null}
//                       </span>
//                       <span className={`text-[10px] leading-tight tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}>
//                         {gem.label}
//                       </span>
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Metal Color" count={metals.size}>
//             <ul className="flex flex-col gap-2.5">
//               {METAL_COLORS.map((metal) => {
//                 const on = metals.has(metal.id)
//                 return (
//                   <li key={metal.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleMetal(metal.id)}
//                       aria-pressed={on}
//                       className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 transition-all ${
//                         on ? "border-sf-brand bg-sf-brand/5" : "border-sf-brand/15 hover:border-sf-brand/40"
//                       }`}
//                     >
//                       <span
//                         aria-hidden="true"
//                         style={{ backgroundImage: metal.swatch }}
//                         className="relative grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-black/10"
//                       >
//                         {on ? <Check className="size-3.5 text-sf-ink/80" /> : null}
//                       </span>
//                       <span className={`text-sm tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}>
//                         {metal.label}
//                       </span>
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Carat Weight" count={carats.size}>
//             <ul className="flex flex-col gap-2.5">
//               {CARAT_RANGES.map((range) => {
//                 const on = carats.has(range.id)
//                 return (
//                   <li key={range.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleCarat(range.id)}
//                       aria-pressed={on}
//                       className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 transition-all ${
//                         on ? "border-sf-brand bg-sf-brand/5" : "border-sf-brand/15 hover:border-sf-brand/40"
//                       }`}
//                     >
//                       <span
//                         aria-hidden="true"
//                         className={`grid size-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${
//                           on ? "border-sf-brand bg-sf-brand text-sf-brand-foreground" : "border-sf-brand/40"
//                         }`}
//                       >
//                         {on ? <Check className="size-3" /> : null}
//                       </span>
//                       <span
//                         dir="ltr"
//                         className={`text-sm tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}
//                       >
//                         {range.label}
//                       </span>
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Style" count={styles.size}>
//             <ul className="flex flex-wrap gap-2">
//               {STYLES.map((style) => {
//                 const on = styles.has(style.id)
//                 return (
//                   <li key={style.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleStyle(style.id)}
//                       aria-pressed={on}
//                       className={`rounded-full border px-3 py-1.5 text-xs tracking-wide transition-all ${
//                         on
//                           ? "border-sf-brand bg-sf-brand text-sf-brand-foreground"
//                           : "border-sf-brand/25 text-sf-muted hover:border-sf-brand/50 hover:text-sf-ink"
//                       }`}
//                     >
//                       {style.label}
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>

//           <CollapsibleFilter label="Occasion" count={occasions.size}>
//             <ul className="flex flex-wrap gap-2">
//               {OCCASIONS.map((occasion) => {
//                 const on = occasions.has(occasion.id)
//                 return (
//                   <li key={occasion.id}>
//                     <button
//                       type="button"
//                       onClick={() => toggleOccasion(occasion.id)}
//                       aria-pressed={on}
//                       className={`rounded-full border px-3 py-1.5 text-xs tracking-wide transition-all ${
//                         on
//                           ? "border-sf-brand bg-sf-brand text-sf-brand-foreground"
//                           : "border-sf-brand/25 text-sf-muted hover:border-sf-brand/50 hover:text-sf-ink"
//                       }`}
//                     >
//                       {occasion.label}
//                     </button>
//                   </li>
//                 )
//               })}
//             </ul>
//           </CollapsibleFilter>
//         </aside>

//         {/* Grid */}
//         <div className="min-w-0 flex-1">
//           <div className="mb-8 flex items-center justify-between border-b border-sf-brand/15 pb-4">
//             <button
//               type="button"
//               onClick={() => setFiltersOpen((v) => !v)}
//               aria-pressed={filtersOpen}
//               className="hidden items-center gap-2 rounded-full border border-sf-brand/25 px-4 py-1.5 text-sm tracking-wide text-sf-brand transition-colors hover:border-sf-brand/50 lg:inline-flex"
//             >
//               <SlidersHorizontal className="size-4" aria-hidden="true" />
//               {filtersOpen ? "Hide Filters" : "Show Filters"}
//             </button>
//             <label className="flex items-center gap-2 text-sm text-sf-muted">
//               <span className="font-sf-display italic tracking-wide text-sf-brand">Sort By :</span>
//               <select
//                 value={sort}
//                 onChange={(e) => setSort(e.target.value)}
//                 className="cursor-pointer border-none bg-transparent font-sf-display text-sf-ink outline-none focus-visible:ring-1 focus-visible:ring-sf-brand"
//               >
//                 <option value="featured">Featured</option>
//                 <option value="price-asc">Price: Low to High</option>
//                 <option value="price-desc">Price: High to Low</option>
//                 <option value="name">Name</option>
//               </select>
//             </label>
//           </div>

//          {loading ? (
//             <div
//               className={`grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:gap-x-6 lg:gap-y-10 ${
//                 filtersOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"
//               }`}
//             >
//               {Array.from({ length: 6 }).map((_, i) => (
//                 <div key={i} className="animate-pulse">
//                   <div className="aspect-square bg-sf-surface" />
//                   <div className="mt-3 flex items-center justify-between gap-3">
//                     <div className="h-4 w-1/2 rounded bg-sf-surface" />
//                     <div className="h-4 w-12 rounded bg-sf-surface" />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : shown.length === 0 ? (
//             <p className="py-16 text-center text-sf-muted">No pieces match this filter.</p>
//           ) : (
//             <div
//               className={`grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:gap-x-6 lg:gap-y-10 ${
//                 filtersOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"
//               }`}
//             >
//                {shown.map((product) => {
//                 const wished = wishlist.has(product.name)
//                 const href = product.alias ? `/product/${product.alias}` : null
//                 const Card = href ? "a" : "article"
//                 const cardProps = href ? { href } : {}
//                 return (
//                   <Card key={product._id || product.name} className="group block" {...cardProps}>
//                     <div className="relative aspect-square overflow-hidden bg-sf-surface">
//                       <img
//                         src={product.mainImg || product.image || "/placeholder.svg"}
//                         alt={product.name}
//                         width="600"
//                         height="600"
//                         loading="lazy"
//                         decoding="async"
//                         className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
//                       />
//                       <button
//                         type="button"
//                          onClick={(e) => {
//                           e.preventDefault()
//                           toggleWishlist(product.name)
//                         }}
//                         aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
//                         aria-pressed={wished}
//                         className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-sf-paper/80 backdrop-blur transition-colors hover:bg-sf-paper"
//                       >
//                         <Heart
//                           className={`size-4 transition-colors ${wished ? "fill-sf-brand text-sf-brand" : "text-sf-brand"}`}
//                           aria-hidden="true"
//                         />
//                       </button>
//                       {product.tag ? (
//                         <span className="absolute left-3 top-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-[0.15em] text-sf-brand-foreground uppercase">
//                           {product.tag}
//                         </span>
//                       ) : null}
//                     </div>
//                     <div className="mt-3 flex items-center justify-between gap-3">
//                         <h3 className="truncate font-sf-display text-sm text-sf-ink md:text-base group-hover:text-sf-brand">
//                         {product.name}
//                       </h3>
//                       <span className="flex shrink-0 items-center gap-2 border-l border-sf-brand/40 pl-3 text-sm text-sf-ink">
//                         {formatPrice(product.price)}
//                         <span className="text-sf-muted">+</span>
//                       </span>
//                     </div>
//                    </Card>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   )
// }

// /** Section registry: canvas `type` → component. Unknown types render nothing. */
// export const SECTION_REGISTRY = {
//   announcement: AnnouncementBar,
//   header: Header,
//   hero: Hero,
//   banner: Banner,
//   categoryTiles: CategoryTiles,
//   collectionShowcase: CollectionShowcase,
//   storyBand: StoryBand,
//   productCarousel: ProductCarousel,
//   productGrid: JewelryCollection,
//   bannerDuo: BannerDuo,
//   testimonials: Testimonials,
//   footer: Footer,
// }


"use client"

import { useRef, useState,useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Heart, Menu, Phone, Search, ShoppingBag, SlidersHorizontal, User, X } from "lucide-react"
import { imgUrl } from "@/Server"
import { useStorefront } from "./storefront-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Link } from "react-router-dom"
import {useCart} from "./cart-context"

/* ---------------------------------------------------------------------------
   Miraki storefront sections. Each component receives the `props` object of
   its canvas section verbatim — the canvas JSON is the single source of truth.
--------------------------------------------------------------------------- */

// const COUNTRIES = [
//   { code: "AE", label: "UAE" },
//   { code: "OM", label: "Oman" },
//   { code: "IN", label: "India" },
// ]

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

function HeaderLink({ href = "", className, onClick, children }) {
  const isInternal = href.startsWith("/")
  const isExternal = /^https?:\/\//.test(href)
  if (isInternal) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href || "#"}
      className={className}
      onClick={onClick}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  )
}

export function Header({ brand, tagline, nav = [], navRight = [], showCountrySwitcher }) {
  const { substore, substores, switchCountry } = useStorefront()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
    const searchInputRef = useRef(null)
    const { itemCount, cartOpen } = useCart()


  // Lock body scroll while the mobile drawer is open, and allow Escape to close.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (!searchOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => {
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const t = setTimeout(() => searchInputRef.current?.focus(), 80)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      clearTimeout(t)
    }
  }, [searchOpen])

  // Dropdown options come from the DB (`/storefront/substores`). Each option is
  // one substore; its primary country code is what we switch to. If the list
  // hasn't loaded yet, fall back to the currently-resolved substore alone so the
  // switcher never renders empty.
  const options = (substores?.length ? substores : substore ? [substore] : []).filter(
    (s) => s?.countryCodes?.[0],
  )
  // The active option is the resolved substore (matched from the visitor's geo).
  const activeId = substore?._id ?? options[0]?._id ?? ""

  // When the resolved substore (e.g. the India store) has an uploaded logo,
  // show it instead of the text wordmark. `imgUrl` prefixes IMGDB_URL onto the
  // stored "/uploads/seller/<id>/substore/<file>.png" path from Server.jsx.
  // If the file is missing/404s we fall back to the MIRAKI wordmark.
  const logoSrc = logoFailed ? null : imgUrl(substore?.settings?.logoUrl)

  return (
    <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-nav">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
        {/* Left cluster — flex-1 so the centre brand stays optically centered on
            every breakpoint. Desktop shows the primary nav; mobile/tablet show
            the hamburger + a quick search icon. */}
        <div className="flex flex-1 items-center">
          <nav aria-label="Primary" className="hidden w-full items-center justify-evenly gap-8 lg:flex">
            {nav.map((item) => (
              <HeaderLink
                key={item.label}
                href={item.href}
                className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
              >
                {item.label}
              </HeaderLink>
            ))}
          </nav>

          <div className="flex items-center gap-4 lg:hidden">
            <button
              type="button"
              className="text-sf-ink transition-colors hover:text-sf-brand"
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Search"
              className="text-sf-ink transition-colors hover:text-sf-brand sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Center brand — uploaded substore logo when available, else wordmark */}
        <Link
          to="/"
          className="flex h-[56px] w-[220px]  flex-col items-center justify-center overflow-hidden text-center"
          aria-label={`${brand} home`}
        >
          {logoSrc ? (
            <img
              src={logoSrc || "/placeholder.svg"}
              alt={substore?.settings?.storeName || brand}
              className="h-[56px] w-[200px] object-cover object-center"
              decoding="async"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="font-sf-display text-3xl font-semibold tracking-[0.35em] text-sf-brand">{brand}</span>
          )}
          {tagline && !logoSrc ? <span className="text-[9px] tracking-[0.3em] text-sf-rose">{tagline}</span> : null}
        </Link>

        {/* Right nav + icons */}
        <div className="flex flex-1 items-center justify-end gap-6">
          <nav aria-label="Secondary" className="hidden items-center gap-8 lg:flex">
            {navRight.map((item) => (
              <HeaderLink
                key={item.label}
                href={item.href}
                className="font-sans text-[15px] tracking-wide whitespace-nowrap text-sf-ink transition-colors hover:text-sf-brand"
              >
                {item.label}
              </HeaderLink>
            ))}
          </nav>
          <button
            type="button"
            className="hidden font-sans text-[15px] tracking-wide text-sf-ink transition-colors hover:text-sf-brand sm:block"
             onClick={() => setSearchOpen(true)}
          >
            Search
          </button>
          {showCountrySwitcher && options.length ? (
            <label className="relative flex items-center">
              <span className="sr-only">Store region</span>
              <select
                value={activeId}
                onChange={(e) => {
                  const next = options.find((s) => s._id === e.target.value)
                  if (next) switchCountry(next.countryCodes[0])
                }}
                className="cursor-pointer appearance-none border-none bg-transparent pr-5 font-sans text-[15px] font-medium text-sf-ink outline-none hover:text-sf-brand"
              >
                {options.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name || s.settings?.storeName || s.countryCodes[0]}
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
          {/* <button type="button" aria-label="Shopping bag, 1 item" className="relative text-sf-ink hover:text-sf-brand">
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
            >
              1
            </span>
          </button> */}
          <button
            type="button"
            onClick={cartOpen}
            aria-label={`Shopping bag, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="relative text-sf-ink hover:text-sf-brand"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {itemCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sf-brand font-sans text-[10px] leading-none text-sf-brand-foreground"
              >
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer — slides in from the left */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px]"
              variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
              transition={{ duration: 0.25 }}
            />

            {/* Panel */}
            <motion.nav
              id="mobile-nav-drawer"
              aria-label="Mobile"
              className="absolute inset-y-0 left-0 flex h-full w-[84%] max-w-sm flex-col bg-sf-nav shadow-2xl"
              variants={{
                closed: { x: "-100%" },
                open: { x: 0 },
              }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-sf-line px-6 py-5">
                <span className="font-sf-display text-xl font-semibold tracking-[0.35em] text-sf-brand">
                  {brand}
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="text-sf-ink transition-colors hover:text-sf-brand"
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>

              {/* Links (staggered reveal) */}
              <motion.ul
                className="flex flex-1 flex-col overflow-y-auto py-2"
                variants={{
                  open: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
                  closed: {},
                }}
              >
                {[...nav, ...navRight].map((item) => (
                  <motion.li
                    key={item.label}
                    variants={{
                      closed: { opacity: 0, x: -24 },
                      open: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <HeaderLink
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between border-b border-sf-line/60 px-6 py-4 font-sans text-base tracking-wide text-sf-ink transition-colors hover:bg-sf-line/30 hover:text-sf-brand"
                    >
                      {item.label}
                      <ArrowRight
                        className="size-4 -translate-x-1 text-sf-rose opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </HeaderLink>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Drawer footer — quick actions */}
              <div className="mt-auto flex items-center gap-6 border-t border-sf-line px-6 py-5">
                <button
                  type="button"
                  aria-label="Account"
                  className="flex items-center gap-2 font-sans text-sm text-sf-ink transition-colors hover:text-sf-brand"
                >
                  <User className="size-5" aria-hidden="true" />
                  Account
                </button>
                <button
                  type="button"
                  aria-label="Wishlist"
                  className="flex items-center gap-2 font-sans text-sm text-sf-ink transition-colors hover:text-sf-brand"
                >
                  <Heart className="size-5" aria-hidden="true" />
                  Wishlist
                </button>
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
       <AnimatePresence>
        {searchOpen ? (
          <motion.div className="fixed inset-0 z-50" initial="closed" animate="open" exit="closed">
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-sf-ink/40 "
              variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
              transition={{ duration: 0.25 }}
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search products"
              className="absolute inset-x-0 top-0 border-b border-sf-line bg-sf-nav shadow-2xl"
              variants={{ closed: { y: "-100%" }, open: { y: 0 } }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            >
              <div dir="ltr" className="relative mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-5 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
                {/* Brand wordmark — desktop only, sits at the far left of the row */}
                <span className="hidden shrink-0 font-sf-display text-2xl font-semibold tracking-[0.35em] text-sf-brand lg:inline-block">
                  {brand}
                </span>

                {/* Heading — mobile only, sits above the field */}
                <h2 className="pr-10 font-sf-display text-xl font-semibold tracking-[0.15em] text-sf-ink lg:hidden">
                  Search Product
                </h2>

                {/* Search field */}
                <form
                  role="search"
                  onSubmit={(e) => e.preventDefault()}
                  className="relative flex w-full items-center lg:mx-auto lg:max-w-2xl"
                >
                  <label htmlFor="storefront-search" className="sr-only">
                    Search products
                  </label>
                  <input
                    id="storefront-search"
                    ref={searchInputRef}
                    type="search"
                    placeholder="Find Your Match"
                    className="h-12 w-full rounded-md border border-sf-line bg-sf-bg pr-14 pl-4 font-sans text-base text-sf-ink outline-none placeholder:text-sf-rose focus:border-sf-brand"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-1 flex h-10 w-11 items-center justify-center rounded-md bg-sf-brand text-sf-brand-foreground transition-opacity hover:opacity-90"
                  >
                    <Search className="size-5" aria-hidden="true" />
                  </button>
                </form>

                {/* Close — top-right on mobile, far right of the row on desktop */}
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="absolute top-5 right-4 text-sf-ink transition-colors hover:text-sf-brand lg:static lg:shrink-0"
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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

/**
 * CollectionShowcase — the "Explore Our Collections" section used on the
 * Jewelry page (mirrors mirakijewels.com/en/browse/jewelry). A bold maroon
 * heading with a left rule, an italic sub-line with a right rule, and a row of
 * four tall editorial tiles whose underlined serif label sits over the image.
 * Content defaults to the four core collections but can be overridden via props.
 */
const DEFAULT_COLLECTION_ITEMS = [
  { name: "Rings", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb4f72d5790036baa0d6/img_70.jpg", href: "#rings" },
  { name: "Earrings", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfbdd57e7920032d620a4/img_58.jpg", href: "#earrings" },
  { name: "Bracelets", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb8e5a8645002bd76c07/img_43.jpg", href: "#bracelets" },
  { name: "Necklaces", image: "https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/66ecfb0275cdf50024e15eb8/img_40.jpg", href: "#necklaces" },
]

export function CollectionShowcase({
  title = "Explore Our Collections",
  sub = "Unlimited Possibilities, Your Perfect Selection",
  items = DEFAULT_COLLECTION_ITEMS,
}) {
  const tiles = items.length ? items : DEFAULT_COLLECTION_ITEMS

  return (
    <section dir="ltr" className="bg-sf-bg py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        {/* Heading: centered maroon title; the rule fills the gap to its left
            while an equal invisible spacer on the right keeps it centered. */}
        <motion.div
          className="flex items-center gap-4 sm:gap-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span aria-hidden="true" className="h-px flex-1 bg-sf-brand" />
          <h2 className="shrink-0 text-center font-sf-display text-3xl font-bold tracking-wide text-sf-brand text-balance md:text-4xl lg:text-5xl">
            {title}
          </h2>
          <span aria-hidden="true" className="h-px flex-1 opacity-0" />
        </motion.div>

        {/* Sub-line: centered italic maroon; here the invisible spacer is on the
            left and the visible rule extends to the right. */}
        {sub ? (
          <motion.div
            className="mt-4 flex items-center gap-4 sm:gap-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span aria-hidden="true" className="h-px flex-1 opacity-0" />
            <p className="shrink-0 text-center font-sf-display text-xl italic tracking-wide text-sf-brand text-pretty md:text-2xl">
              {sub}
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-sf-brand" />
          </motion.div>
        ) : null}

        {/* Four tall editorial tiles with an underlined label over the image */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {tiles.map((item, i) => (
            <motion.a
              key={item.name}
              href={item.href}
              className="group relative block aspect-[3/4] overflow-hidden bg-sf-surface"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width="600"
                height="800"
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              {/* Bottom gradient keeps the white label legible over light imagery */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
                aria-hidden="true"
              />
              <span className="absolute inset-x-0 bottom-5 text-center font-sf-display text-lg font-semibold tracking-wide text-white underline decoration-1 underline-offset-4 transition-opacity group-hover:opacity-90 md:text-xl">
                {item.name}
              </span>
            </motion.a>
          ))}
        </div>
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

/**
 * Banner — the full-bleed editorial hero used as the first section of the
 * Jewelry page (mirrors mirakijewels.com/en/browse/jewelry). The image is the
 * LCP element, so it loads eagerly with high priority and explicit dimensions
 * to paint fast with zero layout shift. `object-position` keeps the model in
 * frame on narrow viewports while the headline sits over the calm left space.
 */
export function Banner({ headline, image, imageAlt, ctas = [] }) {
  return (
    <section
      dir="ltr"
      className="relative isolate min-h-[56vh] overflow-hidden sm:min-h-[64vh] lg:min-h-[78vh]"
    >
      <img
        src={image || "/placeholder.svg"}
        alt={imageAlt || ""}
        width="1600"
        height="900"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover object-[78%_center] sm:object-[70%_center]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-sf-bg/70 via-sf-bg/25 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[56vh] max-w-[1600px] items-center px-6 sm:min-h-[64vh] lg:min-h-[78vh] lg:px-14">
        <div className="max-w-xl">
          <h1 className="font-sf-display text-2xl font-normal tracking-[0.2em] text-sf-ink uppercase text-balance sm:text-3xl md:text-4xl lg:text-5xl lg:tracking-[0.25em]">
            {headline}
          </h1>
          {ctas.length ? (
            <div className="mt-8 flex flex-col items-start gap-4">
              {ctas.map((cta) => (
                <a
                  key={cta.label}
                  href={cta.href}
                  className="text-base tracking-wide text-sf-ink underline underline-offset-8 transition-opacity hover:opacity-70 sm:text-lg"
                >
                  {cta.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/**
 * JewelryCollection — the browsable product grid used as the second section of
 * the Jewelry page (mirrors mirakijewels.com/en/browse/jewelry): a filter rail
 * (Categories + Price) on the left, a "Sort By" control on the right, and a
 * responsive grid of product cards with a wishlist toggle. Prices are rendered
 * through the storefront's country-aware `formatPrice`, and all content comes
 * from the resolved canvas so it stays in sync per country.
 */
const DIAMOND_SHAPES = [
  { id: "Round", label: "Round", img: "/images/filters/shape-round.png" },
  { id: "Princess", label: "Princess", img: "/images/filters/shape-princess.png" },
  { id: "Cushion", label: "Cushion", img: "/images/filters/shape-cushion.png" },
  { id: "Emerald", label: "Emerald", img: "/images/filters/shape-emerald.png" },
  { id: "Oval", label: "Oval", img: "/images/filters/shape-oval.png" },
  { id: "Pear", label: "Pear", img: "/images/filters/shape-pear.png" },
  { id: "Marquise", label: "Marquise", img: "/images/filters/shape-marquise.png" },
  { id: "Radiant", label: "Radiant", img: "/images/filters/shape-radiant.png" },
  { id: "Asscher", label: "Asscher", img: "/images/filters/shape-asscher.png" },
  { id: "Heart", label: "Heart", img: "/images/filters/shape-heart.png" },
]

const GEMSTONES = [
  { id: "Ruby", label: "Ruby", img: "/images/filters/gem-ruby.png" },
  { id: "Sapphire", label: "Sapphire", img: "/images/filters/gem-sapphire.png" },
  { id: "Emerald", label: "Emerald", img: "/images/filters/gem-emerald.png" },
  { id: "Amethyst", label: "Amethyst", img: "/images/filters/gem-amethyst.png" },
  { id: "Topaz", label: "Topaz", img: "/images/filters/gem-topaz.png" },
  { id: "Aquamarine", label: "Aquamarine", img: "/images/filters/gem-aquamarine.png" },
  { id: "Garnet", label: "Garnet", img: "/images/filters/gem-garnet.png" },
  { id: "Peridot", label: "Peridot", img: "/images/filters/gem-peridot.png" },
]

const METAL_COLORS = [
  { id: "Yellow Gold", label: "Yellow Gold", swatch: "linear-gradient(135deg,#f7e7bd 0%,#e8c766 45%,#c69a3b 100%)" },
  { id: "White Gold", label: "White Gold", swatch: "linear-gradient(135deg,#ffffff 0%,#e6e8ea 45%,#b9bec4 100%)" },
  { id: "Rose Gold", label: "Rose Gold", swatch: "linear-gradient(135deg,#f7d9cd 0%,#e6a68c 45%,#c67a5c 100%)" },
  { id: "Platinum", label: "Platinum", swatch: "linear-gradient(135deg,#f2f3f4 0%,#c9ccd0 45%,#9aa0a6 100%)" },
]

const CARAT_RANGES = [
  { id: "0-0.5", label: "Under 0.5 ct", min: 0, max: 0.5 },
  { id: "0.5-1", label: "0.5 – 1 ct", min: 0.5, max: 1 },
  { id: "1-2", label: "1 – 2 ct", min: 1, max: 2 },
  { id: "2-3", label: "2 – 3 ct", min: 2, max: 3 },
  { id: "3+", label: "3 ct & above", min: 3, max: Infinity },
]

const STYLES = [
  { id: "Solitaire", label: "Solitaire" },
  { id: "Halo", label: "Halo" },
  { id: "Three-Stone", label: "Three-Stone" },
  { id: "Pavé", label: "Pavé" },
  { id: "Vintage", label: "Vintage" },
  { id: "Modern", label: "Modern" },
]

const OCCASIONS = [
  { id: "Engagement", label: "Engagement" },
  { id: "Wedding", label: "Wedding" },
  { id: "Anniversary", label: "Anniversary" },
  { id: "Everyday", label: "Everyday" },
  { id: "Gift", label: "Gift" },
]

function CollapsibleFilter({ label, defaultOpen = false, count = 0, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-sf-brand/15 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between font-sf-display text-base tracking-wide text-sf-ink"
      >
        <span className="flex items-center gap-2">
          {label}
          {count > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-sf-brand text-[11px] leading-none text-sf-brand-foreground">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`size-4 text-sf-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

/**
 * FilterFacets — the shared body of every facet control. Rendered inline in the
 * desktop rail AND inside the mobile bottom Sheet so both surfaces stay in sync
 * from a single source of truth.
 */
function FilterFacets({
  categories,
  activeCat,
  setActiveCat,
  formatPrice,
  priceFloor,
  priceCeil,
  priceStep,
  priceValue,
  priceActive,
  setPrice,
  shapes,
  toggleShape,
  gems,
  toggleGem,
  metals,
  toggleMetal,
  carats,
  toggleCarat,
  styles,
  toggleStyle,
  occasions,
  toggleOccasion,
}) {
  return (
    <>
      <CollapsibleFilter label="Categories" defaultOpen>
        <ul className="flex flex-col gap-3">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => setActiveCat(cat)}
                aria-pressed={activeCat === cat}
                className={`text-left text-sm tracking-wide transition-colors ${
                  activeCat === cat
                    ? "text-sf-brand underline underline-offset-4"
                    : "text-sf-muted hover:text-sf-ink"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Price Range" defaultOpen count={priceActive ? 1 : 0}>
        {priceCeil > priceFloor ? (
          <div className="pt-1">
            <Slider
              min={priceFloor}
              max={priceCeil}
              step={priceStep}
              value={priceValue}
              onValueChange={setPrice}
              aria-label="Price range"
              className="[&_[data-slot=slider-track]]:bg-sf-brand/15 [&_[data-slot=slider-range]]:bg-sf-brand [&_[data-slot=slider-thumb]]:border-sf-brand [&_[data-slot=slider-thumb]]:bg-sf-paper [&_[data-slot=slider-thumb]]:ring-sf-brand/30"
            />
            <div className="mt-3 flex items-center justify-between text-sm text-sf-ink">
              <span>{formatPrice(priceValue[0])}</span>
              <span>{formatPrice(priceValue[1])}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-sf-muted">Pricing unavailable.</p>
        )}
      </CollapsibleFilter>

      <CollapsibleFilter label="Diamond Shape" count={shapes.size}>
        <ul className="grid grid-cols-4 gap-2">
          {DIAMOND_SHAPES.map((shape) => {
            const on = shapes.has(shape.id)
            return (
              <li key={shape.id}>
                <button
                  type="button"
                  onClick={() => toggleShape(shape.id)}
                  aria-pressed={on}
                  title={shape.label}
                  className={`group flex w-full flex-col items-center gap-1 rounded-md border p-1.5 transition-all ${
                    on
                      ? "border-sf-brand bg-sf-brand/5 shadow-[0_0_0_1px_var(--color-sf-brand,#7a1f2b)]"
                      : "border-sf-brand/15 hover:border-sf-brand/40"
                  }`}
                >
                  <span className="grid aspect-square w-full place-items-center overflow-hidden rounded bg-white">
                    <img
                      src={shape.img || "/placeholder.svg"}
                      alt={`${shape.label} cut`}
                      width="48"
                      height="48"
                      loading="lazy"
                      decoding="async"
                      className="size-full object-contain mix-blend-multiply"
                    />
                  </span>
                  <span
                    className={`text-[9px] leading-tight tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}
                  >
                    {shape.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Gemstone" count={gems.size}>
        <ul className="grid grid-cols-3 gap-3">
          {GEMSTONES.map((gem) => {
            const on = gems.has(gem.id)
            return (
              <li key={gem.id}>
                <button
                  type="button"
                  onClick={() => toggleGem(gem.id)}
                  aria-pressed={on}
                  title={gem.label}
                  className={`group flex w-full flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                    on
                      ? "border-sf-brand bg-sf-brand/5 shadow-[0_0_0_1px_var(--color-sf-brand,#7a1f2b)]"
                      : "border-sf-brand/15 hover:border-sf-brand/40 hover:bg-sf-brand/5"
                  }`}
                >
                  <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-white">
                    <img
                      src={gem.img || "/placeholder.svg"}
                      alt={gem.label}
                      width="72"
                      height="72"
                      loading="lazy"
                      decoding="async"
                      className="size-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                    />
                    {on ? (
                      <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-sf-brand text-sf-brand-foreground">
                        <Check className="size-2.5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[10px] leading-tight tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}>
                    {gem.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Metal Color" count={metals.size}>
        <ul className="flex flex-col gap-2.5">
          {METAL_COLORS.map((metal) => {
            const on = metals.has(metal.id)
            return (
              <li key={metal.id}>
                <button
                  type="button"
                  onClick={() => toggleMetal(metal.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 transition-all ${
                    on ? "border-sf-brand bg-sf-brand/5" : "border-sf-brand/15 hover:border-sf-brand/40"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    style={{ backgroundImage: metal.swatch }}
                    className="relative grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-black/10"
                  >
                    {on ? <Check className="size-3.5 text-sf-ink/80" /> : null}
                  </span>
                  <span className={`text-sm tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}>
                    {metal.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Carat Weight" count={carats.size}>
        <ul className="flex flex-col gap-2.5">
          {CARAT_RANGES.map((range) => {
            const on = carats.has(range.id)
            return (
              <li key={range.id}>
                <button
                  type="button"
                  onClick={() => toggleCarat(range.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 transition-all ${
                    on ? "border-sf-brand bg-sf-brand/5" : "border-sf-brand/15 hover:border-sf-brand/40"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${
                      on ? "border-sf-brand bg-sf-brand text-sf-brand-foreground" : "border-sf-brand/40"
                    }`}
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span dir="ltr" className={`text-sm tracking-wide ${on ? "text-sf-brand" : "text-sf-muted"}`}>
                    {range.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Style" count={styles.size}>
        <ul className="flex flex-wrap gap-2">
          {STYLES.map((style) => {
            const on = styles.has(style.id)
            return (
              <li key={style.id}>
                <button
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs tracking-wide transition-all ${
                    on
                      ? "border-sf-brand bg-sf-brand text-sf-brand-foreground"
                      : "border-sf-brand/25 text-sf-muted hover:border-sf-brand/50 hover:text-sf-ink"
                  }`}
                >
                  {style.label}
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>

      <CollapsibleFilter label="Occasion" count={occasions.size}>
        <ul className="flex flex-wrap gap-2">
          {OCCASIONS.map((occasion) => {
            const on = occasions.has(occasion.id)
            return (
              <li key={occasion.id}>
                <button
                  type="button"
                  onClick={() => toggleOccasion(occasion.id)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs tracking-wide transition-all ${
                    on
                      ? "border-sf-brand bg-sf-brand text-sf-brand-foreground"
                      : "border-sf-brand/25 text-sf-muted hover:border-sf-brand/50 hover:text-sf-ink"
                  }`}
                >
                  {occasion.label}
                </button>
              </li>
            )
          })}
        </ul>
      </CollapsibleFilter>
    </>
  )
}

export function JewelryCollection({ tabs = [], products = [], priceRanges = [], loading = false }) {
  const { formatPrice } = useStorefront()
  const [activeCat, setActiveCat] = useState("All")
  const [sort, setSort] = useState("featured")
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [wishlist, setWishlist] = useState(() => new Set())
  const [shapes, setShapes] = useState(() => new Set())
  const [gems, setGems] = useState(() => new Set())
  const [metals, setMetals] = useState(() => new Set())
  const [carats, setCarats] = useState(() => new Set())
  const [styles, setStyles] = useState(() => new Set())
  const [occasions, setOccasions] = useState(() => new Set())

  // Price bounds derived from the resolved catalog so the slider always spans
  // the real min/max. `price` is null until the user drags a thumb, which keeps
  // the facet inactive (and the whole catalog visible) on first render.
  const catalogPrices = products.map((p) => p.price).filter((n) => Number.isFinite(n))
  const priceFloor = catalogPrices.length ? Math.floor(Math.min(...catalogPrices)) : 0
  const priceCeil = catalogPrices.length ? Math.ceil(Math.max(...catalogPrices)) : 0
  const [price, setPrice] = useState(null)
  const priceStep = Math.max(1, Math.round((priceCeil - priceFloor) / 100) || 1)
  const priceActive = price && (price[0] > priceFloor || price[1] < priceCeil)
  const priceValue = price ?? [priceFloor, priceCeil]

  const categories = ["All", ...tabs]

  const toggleFrom = (setter) => (value) =>
    setter((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  const toggleWishlist = toggleFrom(setWishlist)
  const toggleShape = toggleFrom(setShapes)
  const toggleGem = toggleFrom(setGems)
  const toggleMetal = toggleFrom(setMetals)
  const toggleCarat = toggleFrom(setCarats)
  const toggleStyle = toggleFrom(setStyles)
  const toggleOccasion = toggleFrom(setOccasions)

  const facetProps = {
    categories,
    activeCat,
    setActiveCat,
    formatPrice,
    priceFloor,
    priceCeil,
    priceStep,
    priceValue,
    priceActive,
    setPrice,
    shapes,
    toggleShape,
    gems,
    toggleGem,
    metals,
    toggleMetal,
    carats,
    toggleCarat,
    styles,
    toggleStyle,
    occasions,
    toggleOccasion,
  }

  const activeCount =
    shapes.size + gems.size + metals.size + carats.size + styles.size + occasions.size + (priceActive ? 1 : 0)
  const clearAll = () => {
    setShapes(new Set())
    setGems(new Set())
    setMetals(new Set())
    setCarats(new Set())
    setStyles(new Set())
    setOccasions(new Set())
    setPrice(null)
  }

  // Only apply an attribute filter when the catalog actually carries that
  // attribute, so selecting a facet never wipes an unrelated catalog empty.
  const hasShapeData = products.some((p) => p.shape)
  const hasGemData = products.some((p) => p.gemstone)
  const hasMetalData = products.some((p) => p.metal)
  const hasCaratData = products.some((p) => p.carat != null)
  const hasStyleData = products.some((p) => p.style)
  const hasOccasionData = products.some((p) => p.occasion)

  // A product matches the carat facet if its carat falls in any selected range.
  const caratInSelection = (carat) =>
    CARAT_RANGES.some((r) => carats.has(r.id) && carat >= r.min && carat < r.max)

  let shown = products.filter((p) => {
    if (activeCat !== "All" && (p.category || p.tag) !== activeCat) return false
    if (priceActive && Number.isFinite(p.price) && (p.price < priceValue[0] || p.price > priceValue[1])) return false
    if (hasShapeData && shapes.size && !shapes.has(p.shape)) return false
    if (hasGemData && gems.size && !gems.has(p.gemstone)) return false
    if (hasMetalData && metals.size && !metals.has(p.metal)) return false
    if (hasCaratData && carats.size && !caratInSelection(p.carat)) return false
    if (hasStyleData && styles.size && !styles.has(p.style)) return false
    if (hasOccasionData && occasions.size && !occasions.has(p.occasion)) return false
    return true
  })
  shown = [...shown].sort((a, b) => {
    if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0)
    if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0)
    if (sort === "name") return String(a.name).localeCompare(String(b.name))
    return 0
  })

  return (
    <section className="bg-sf-paper py-14 lg:py-20">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-8 px-4 lg:flex-row lg:gap-10 lg:px-8">
        {/* Filter rail — desktop only. On mobile the same facets live in a bottom Sheet. */}
        <aside className={`hidden w-full shrink-0 lg:w-64 ${filtersOpen ? "lg:block" : "lg:hidden"}`}>
          <div className="flex items-center justify-between pb-3">
            <span className="font-sf-display text-xs tracking-[0.25em] text-sf-muted uppercase">Filters</span>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs tracking-wide text-sf-brand underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Clear all ({activeCount})
              </button>
            ) : null}
          </div>
          <FilterFacets {...facetProps} />
        </aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          <div className="mb-8 flex items-center justify-between border-b border-sf-brand/15 pb-4">
            {/* Desktop: toggle the inline rail */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-pressed={filtersOpen}
              className="hidden items-center gap-2 rounded-full border border-sf-brand/25 px-4 py-1.5 text-sm tracking-wide text-sf-brand transition-colors hover:border-sf-brand/50 lg:inline-flex"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </button>
            {/* Mobile: open the bottom filter Sheet */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-sf-brand/25 px-4 py-1.5 text-sm tracking-wide text-sf-brand transition-colors hover:border-sf-brand/50 lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
              {activeCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-sf-brand text-[11px] leading-none text-sf-brand-foreground">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <label className="flex items-center gap-2 text-sm text-sf-muted">
              <span className="font-sf-display italic tracking-wide text-sf-brand">Sort By :</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer border-none bg-transparent font-sf-display text-sf-ink outline-none focus-visible:ring-1 focus-visible:ring-sf-brand"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div
              className={`grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:gap-x-6 lg:gap-y-10 ${
                filtersOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"
              }`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-sf-surface" />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="h-4 w-1/2 rounded bg-sf-surface" />
                    <div className="h-4 w-12 rounded bg-sf-surface" />
                  </div>
                </div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sf-muted">No pieces match this filter.</p>
          ) : (
            <div
              className={`grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:gap-x-6 lg:gap-y-10 ${
                filtersOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"
              }`}
            >
              {shown.map((product) => {
                const wished = wishlist.has(product.name)
                const href = product.alias ? `/product/${product.alias}` : null
                const Card = href ? Link : "article"
                const cardProps = href ? { to: href } : {}
                return (
                  <Card key={product._id || product.name} className="group block" {...cardProps}>
                    <div className="relative aspect-square overflow-hidden bg-sf-surface">
                      <img
                        src={product.mainImg || product.image || "/placeholder.svg"}
                        alt={product.name}
                        width="600"
                        height="600"
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleWishlist(product.name)
                        }}
                        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                        aria-pressed={wished}
                        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-sf-paper/80 backdrop-blur transition-colors hover:bg-sf-paper"
                      >
                        <Heart
                          className={`size-4 transition-colors ${wished ? "fill-sf-brand text-sf-brand" : "text-sf-brand"}`}
                          aria-hidden="true"
                        />
                      </button>
                      {product.tag ? (
                        <span className="absolute left-3 top-3 z-10 bg-sf-brand px-2 py-1 text-[10px] tracking-[0.15em] text-sf-brand-foreground uppercase">
                          {product.tag}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <h3 className="truncate font-sf-display text-sm text-sf-ink md:text-base group-hover:text-sf-brand">
                        {product.name}
                      </h3>
                      <span className="flex shrink-0 items-center gap-2 border-l border-sf-brand/40 pl-3 text-sm text-sf-ink">
                        {formatPrice(product.price)}
                        <span className="text-sf-muted">+</span>
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — slides up from the bottom on small screens */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[88vh] flex-col gap-0 rounded-t-2xl border-sf-brand/15 bg-sf-paper p-0 lg:hidden"
        >
          <SheetHeader className="flex-row items-center justify-between border-b border-sf-brand/15 px-5 py-4">
            <SheetTitle className="font-sf-display text-lg tracking-wide text-sf-ink">Filter Products</SheetTitle>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="mr-8 text-xs tracking-wide text-sf-brand underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Clear all ({activeCount})
              </button>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            <FilterFacets {...facetProps} />
          </div>

          <SheetFooter className="border-t border-sf-brand/15 px-5 py-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-full bg-sf-brand px-6 py-3 text-sm font-medium tracking-wide text-sf-brand-foreground transition-opacity hover:opacity-90"
            >
              Show {shown.length} {shown.length === 1 ? "result" : "results"}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}

/** Section registry: canvas `type` → component. Unknown types render nothing. */
export const SECTION_REGISTRY = {
  announcement: AnnouncementBar,
  header: Header,
  hero: Hero,
  banner: Banner,
  categoryTiles: CategoryTiles,
  collectionShowcase: CollectionShowcase,
  storyBand: StoryBand,
  productCarousel: ProductCarousel,
  productGrid: JewelryCollection,
  bannerDuo: BannerDuo,
  testimonials: Testimonials,
  footer: Footer,
}

