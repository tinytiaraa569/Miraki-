// "use client"

// import { memo, useEffect, useMemo, useRef, useState } from "react"
// import { Link, useLocation } from "react-router-dom"
// import { ArrowLeft, Search } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Separator } from "@/components/ui/separator"
// import { useSidebar } from "@/components/ui/sidebar"
// import { activeChildUrl } from "@/lib/seller-nav"
// import { cn } from "@/lib/utils"

// /**
//  * Slide-out submenu panel that opens next to the sidebar (desktop) or over it
//  * (mobile). Fully keyboard accessible: Escape closes, links are focusable.
//  * Memoized — only re-renders when the parent item or route changes.
//  */
// export const NavSubmenuOverlay = memo(function NavSubmenuOverlay({ parent, onClose }) {
//   const { state, isMobile, setOpenMobile } = useSidebar()
//   const { pathname } = useLocation()
//   const [query, setQuery] = useState("")
//   const panelRef = useRef(null)

//   // Close on Escape from anywhere.
//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") onClose()
//     }
//     window.addEventListener("keydown", onKey)
//     return () => window.removeEventListener("keydown", onKey)
//   }, [onClose])

//   // NOTE: the panel intentionally does NOT close on outside clicks. It sits
//   // over the sidebar only (never covers page content), so users can freely
//   // interact with the page — e.g. "Add substore" — while it stays open. It
//   // closes via the back arrow, Escape, or navigating outside the group.

//   // Focus the search box when the panel opens for instant filtering.
//   useEffect(() => {
//     const input = panelRef.current?.querySelector("input")
//     input?.focus()
//   }, [parent])

//   const items = useMemo(() => {
//     const list = parent?.items ?? []
//     const q = query.trim().toLowerCase()
//     if (!q) return list
//     return list.filter((c) => c.title.toLowerCase().includes(q))
//   }, [parent, query])

//   // Deepest matching sibling wins — computed over ALL children (not the
//   // filtered list) so search never changes which link is highlighted.
//   const activeUrl = useMemo(() => activeChildUrl(pathname, parent?.items), [pathname, parent])

//   if (!parent) return null

//   // Drill-down: the panel slides in OVER the sidebar itself (left: 0),
//   // matching its width, so it replaces the main menu in place.
//   const width = isMobile ? undefined : state === "collapsed" ? undefined : "var(--sidebar-width)"

//   return (
//     <>
//       <div
//         ref={panelRef}
//         role="dialog"
//         aria-label={`${parent.title} submenu`}
//         style={{ left: 0, width }}
//         className={cn(
//           "fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
//           "animate-in slide-in-from-right-8 fade-in-0 duration-200",
//         )}
//       >
//         {/* Panel header: back arrow + group title, like a drill-down menu */}
//         <div className="flex items-center gap-2 px-3 py-3">
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={onClose}
//             aria-label="Back to main menu"
//             className="size-8 shrink-0 cursor-pointer"
//           >
//             <ArrowLeft className="size-4" aria-hidden="true" />
//           </Button>
//           <div className="flex min-w-0 flex-1 items-center gap-2">
//             {parent.icon ? <parent.icon className="size-4 shrink-0 text-sidebar-primary" aria-hidden="true" /> : null}
//             <span className="truncate text-sm font-semibold">{parent.title}</span>
//           </div>
//         </div>

//         <Separator />

//         {/* Submenu search — only useful for long groups but cheap to render */}
//         <div className="relative px-3 py-2.5">
//           <Search
//             className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
//             aria-hidden="true"
//           />
//           <Input
//             placeholder={`Search ${parent.title.toLowerCase()}...`}
//             aria-label={`Search ${parent.title} links`}
//             className="h-8 pl-7 text-sm"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//         </div>

//         {/* Links */}
//         <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label={`${parent.title} pages`}>
//           <ul className="flex flex-col gap-0.5">
//             {items.map((child) => {
//               const active = child.url === activeUrl
//               return (
//                 <li key={child.url}>
//                   <Link
//                     to={child.url}
//                     aria-current={active ? "page" : undefined}
//                     onClick={() => {
//                       // Keep the panel open on desktop so the newly selected
//                       // link stays visible/highlighted. Only close on mobile
//                       // where the sidebar sheet must dismiss to show the page.
//                       if (isMobile) {
//                         onClose()
//                         setOpenMobile(false)
//                       }
//                     }}
//                     className={cn(
//                       "group/sub relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
//                       "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
//                       active
//                         ? "bg-sidebar-primary/10 font-medium text-sidebar-primary before:opacity-100"
//                         : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
//                     )}
//                   >
//                     {child.icon ? (
//                       <child.icon
//                         className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
//                         aria-hidden="true"
//                       />
//                     ) : null}
//                     <span className="truncate">{child.title}</span>
//                   </Link>
//                 </li>
//               )
//             })}
//             {items.length === 0 && (
//               <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matching pages</li>
//             )}
//           </ul>
//         </nav>
//       </div>
//     </>
//   )
// })


"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { activeChildUrl } from "@/lib/seller-nav"
import { cn } from "@/lib/utils"

/**
 * Slide-out submenu panel that opens next to the sidebar (desktop) or over it
 * (mobile). Fully keyboard accessible: Escape closes, links are focusable.
 * Memoized — only re-renders when the parent item or route changes.
 */
export const NavSubmenuOverlay = memo(function NavSubmenuOverlay({ parent, onClose }) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  const [query, setQuery] = useState("")
  const panelRef = useRef(null)

  // Close on Escape from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Collapsing the main sidebar (desktop rail toggle) closes the submenu too,
  // so the panel never floats over icon-only rail / page content. On mobile
  // the drill-down lives inside the Sheet, so this doesn't apply there.
  useEffect(() => {
    if (!isMobile && state === "collapsed") onClose()
  }, [isMobile, state, onClose])

  // NOTE: the panel intentionally does NOT close on outside clicks. It sits
  // over the sidebar only (never covers page content), so users can freely
  // interact with the page — e.g. "Add substore" — while it stays open. It
  // closes via the back arrow, Escape, or navigating outside the group.

  // Focus the search box when the panel opens for instant filtering.
  useEffect(() => {
    const input = panelRef.current?.querySelector("input")
    input?.focus()
  }, [parent])

  const items = useMemo(() => {
    const list = parent?.items ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) => c.title.toLowerCase().includes(q))
  }, [parent, query])

  // Deepest matching sibling wins — computed over ALL children (not the
  // filtered list) so search never changes which link is highlighted.
  const activeUrl = useMemo(() => activeChildUrl(pathname, parent?.items), [pathname, parent])

  if (!parent) return null

  // Drill-down: the panel slides in OVER the sidebar itself (left: 0),
  // matching its width, so it replaces the main menu in place.
  const width = isMobile ? undefined : state === "collapsed" ? undefined : "var(--sidebar-width)"

  return (
    <>
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`${parent.title} submenu`}
        style={{ left: 0, width }}
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "animate-in slide-in-from-right-8 fade-in-0 duration-200",
        )}
      >
        {/* Panel header: back arrow + group title, like a drill-down menu */}
        <div className="flex items-center gap-2 px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Back to main menu"
            className="size-8 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {parent.icon ? <parent.icon className="size-4 shrink-0 text-sidebar-primary" aria-hidden="true" /> : null}
            <span className="truncate text-sm font-semibold">{parent.title}</span>
          </div>
        </div>

        <Separator />

        {/* Submenu search — only useful for long groups but cheap to render */}
        <div className="relative px-3 py-2.5">
          <Search
            className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder={`Search ${parent.title.toLowerCase()}...`}
            aria-label={`Search ${parent.title} links`}
            className="h-8 pl-7 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label={`${parent.title} pages`}>
          <ul className="flex flex-col gap-0.5">
            {items.map((child) => {
              const active = child.url === activeUrl
              return (
                <li key={child.url}>
                  <Link
                    to={child.url}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      // Keep the panel open on desktop so the newly selected
                      // link stays visible/highlighted. Only close on mobile
                      // where the sidebar sheet must dismiss to show the page.
                      if (isMobile) {
                        onClose()
                        setOpenMobile(false)
                      }
                    }}
                    className={cn(
                      "group/sub relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
                      active
                        ? "bg-sidebar-primary/10 font-medium text-sidebar-primary before:opacity-100"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {child.icon ? (
                      <child.icon
                        className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="truncate">{child.title}</span>
                  </Link>
                </li>
              )
            })}
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matching pages</li>
            )}
          </ul>
        </nav>
      </div>
    </>
  )
})
