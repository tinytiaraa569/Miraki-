import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "@fontsource-variable/inter"
import "@fontsource-variable/cormorant-garamond"

import "./globals.css"

// If the browser restores this page from the back/forward cache (bfcache),
// the entire JS heap — including pre-logout auth state — is resurrected as a
// frozen snapshot. Force a real reload so auth is re-verified with the server.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload()
})

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
