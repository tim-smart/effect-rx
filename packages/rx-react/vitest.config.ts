/// <reference types="vitest" />
import babel from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("../../.babel.mjs.json")

export default defineConfig({
  plugins: [babel({ babel: babelConfig })],
  test: {
    include: ["./test/**/*.test.ts"],
    globals: true
  },
  resolve: {
    alias: {
      "@effect-rx/rx/test": path.join(__dirname, "../rx/test"),
      "@effect-rx/rx": path.join(__dirname, "../rx/src"),
      "@effect-rx/rx-react/test": path.join(__dirname, "test"),
      "@effect-rx/rx-react": path.join(__dirname, "src")
    }
  }
})
