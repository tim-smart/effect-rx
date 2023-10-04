/// <reference types="vitest" />

import * as path from "path"
import { defineConfig } from "vite"

export default defineConfig({
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
