import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    },
  },
})
