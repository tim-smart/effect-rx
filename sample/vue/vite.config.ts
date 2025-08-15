import vue from "@vitejs/plugin-vue"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@effect-atom/atom": fileURLToPath(new URL("../../packages/atom/src", import.meta.url)),
      "@effect-atom/atom-vue": fileURLToPath(new URL("../../packages/atom-vue/src", import.meta.url))
    }
  }
})
