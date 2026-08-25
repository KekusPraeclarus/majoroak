import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    // Never inline assets as data URIs: the brand emblem is applied through a
    // CSS mask url(), which breaks when the SVG is inlined in production.
    assetsInlineLimit: 0,
  },
})
