import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"


const BACKEND_ORIGIN = process.env.VITE_DEV_BACKEND_ORIGIN || "http://localhost:8000"


const DEFAULT_HEAD = [
  `<title>Miraki Jewels</title>`,
  `<meta name="description" content="" />`,
  `<link rel="icon" href="/favicon.svg" />`,
  `<meta property="og:title" content="Miraki Jewels" />`,
].join("\n    ")


function storefrontHead() {
  return {
    name: "storefront-head",
   
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        let headHtml = DEFAULT_HEAD
        try {
          const res = await fetch(`${BACKEND_ORIGIN}/api/storefront/site`)
          if (res.ok) {
            const data = await res.json()
            if (data?.headHtml) headHtml = data.headHtml
          }
        } catch {
          // Backend not reachable in dev — keep the default head.
        }
        return html.replace("<!--SF_HEAD-->", headHtml)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), storefrontHead()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Same-origin API in dev — cookies just work, no CORS complexity in the browser.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})
