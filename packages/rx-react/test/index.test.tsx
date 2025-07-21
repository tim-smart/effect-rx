import * as Registry from "@effect-rx/rx/Registry"
import * as Rx from "@effect-rx/rx/Rx"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { beforeEach, describe, expect, test } from "vitest"
import { RegistryContext, useRxSuspenseSuccess, useRxValue } from "../src/index.js"

describe("rx-react", () => {
  let registry: Registry.Registry

  beforeEach(() => {
    registry = Registry.make()
  })

  describe("useRxValue", () => {
    test("should read value from simple Rx", () => {
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

    test("should read value with transform function", () => {
      const rx = Rx.make(42)

      function TestComponent() {
        const value = useRxValue(rx, (x) => x * 2)
        return <div data-testid="value">{value}</div>
      }

      render(
        <RegistryContext.Provider value={registry}>
          <TestComponent />
        </RegistryContext.Provider>
      )

      expect(screen.getByTestId("value")).toHaveTextContent("84")
    })

    test("should update when Rx value changes", async () => {
      const rx = Rx.make("initial")

      function TestComponent() {
        const value = useRxValue(rx)
        return <div data-testid="value">{value}</div>
      }

      render(
        <RegistryContext.Provider value={registry}>
          <TestComponent />
        </RegistryContext.Provider>
      )

      expect(screen.getByTestId("value")).toHaveTextContent("initial")

      act(() => {
        registry.set(rx, "updated")
      })

      await waitFor(() => {
        expect(screen.getByTestId("value")).toHaveTextContent("updated")
      })
    })

    test("should work with computed Rx", () => {
      const baseRx = Rx.make(10)
      const computedRx = Rx.make((get) => get(baseRx) * 2)

      function TestComponent() {
        const value = useRxValue(computedRx)
        return <div data-testid="value">{value}</div>
      }

      render(
        <RegistryContext.Provider value={registry}>
          <TestComponent />
        </RegistryContext.Provider>
      )

      expect(screen.getByTestId("value")).toHaveTextContent("20")
    })

    test("suspense success", () => {
      const rx = Rx.make(Effect.never)

      function TestComponent() {
        const value = useRxSuspenseSuccess(rx).value
        return <div data-testid="value">{value}</div>
      }

      render(
        <RegistryContext.Provider value={registry}>
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <TestComponent />
          </Suspense>
        </RegistryContext.Provider>
      )

      expect(screen.getByTestId("loading")).toBeInTheDocument()
    })
  })

  test("suspense error", () => {
    const rx = Rx.make(Effect.fail(new Error("test")))
    function TestComponent() {
      const value = useRxSuspenseSuccess(rx).value
      return <div data-testid="value">{value}</div>
    }

    render(
      <RegistryContext.Provider value={registry}>
        <ErrorBoundary fallback={<div data-testid="error">Error</div>}>
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <TestComponent />
          </Suspense>
        </ErrorBoundary>
      </RegistryContext.Provider>,
      {
        // dont log error to console (the default behavior)
        onCaughtError: () => {}
      }
    )

    expect(screen.getByTestId("error")).toBeInTheDocument()
  })
})
