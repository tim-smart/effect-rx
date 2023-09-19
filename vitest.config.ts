/// <reference types="vitest" />

import babel from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const babelConfig = require("./.babel.mjs.json")

export default defineConfig({
  plugins: [babel({ babel: babelConfig })],
  test: {
    include: ["packages/*/test/**/*.test.ts"],
    globals: true
  },
  resolve: {
    alias: {
      "@effect-rx/rx/test": path.join(__dirname, "packages/rx/test"),
      "@effect-rx/rx": path.join(__dirname, "packages/rx/src"),

      "@effect-rx/rx-react/test": path.join(__dirname, "packages/rx-react/test"),
      "@effect-rx/rx-react": path.join(__dirname, "packages/rx-react/src")
    }
  }
})
