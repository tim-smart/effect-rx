/// <reference types="vitest" />
import * as path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  test: {
    include: ["./test/**/*.test.ts"],
    globals: true
  },
  resolve: {
    alias: {
      "@effect-rx/rx/test": path.join(__dirname, "test"),
      "@effect-rx/rx": path.join(__dirname, "src")
    }
  }
})
