import * as path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["./test/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@effect-rx/rx/test": path.join(__dirname, "../rx/test"),
      "@effect-rx/rx": path.join(__dirname, "../rx/src"),
      "@effect-rx/rx-vue/test": path.join(__dirname, "test"),
      "@effect-rx/rx-vue": path.join(__dirname, "src")
    }
  }
})
