import * as Registry from "@effect-rx/rx/Registry"
import * as Rx from "@effect-rx/rx/Rx"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, test } from "vitest"
import { RegistryContext, useRxValue } from "../src/index.js"

describe("rx-react hooks", () => {
  let registry: Registry.Registry

  beforeEach(() => {
    registry = Registry.make()
  })

  describe("useRxValue", () => {
    test("should read value from Rx", () => {
      const rx = Rx.make(42)

      function TestComponent() {
        const value = useRxValue(rx)
        return <div data-testid="value">{value}</div>
      }

      render(
        <RegistryContext.Provider value={registry}>
          <TestComponent />
        </RegistryContext.Provider>
      )

      expect(screen.getByTestId("value")).toHaveTextContent("42")
    })
  })
})
