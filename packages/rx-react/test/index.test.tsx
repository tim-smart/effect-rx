import * as Registry from "@effect-rx/rx/Registry"
import * as Rx from "@effect-rx/rx/Rx"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Effect, Schema } from "effect"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { beforeEach, describe, expect, test } from "vitest"
import { Hydration, RegistryContext, Result, useRxSuspenseSuccess, useRxValue } from "../src/index.js"
import { HydrationBoundary } from "../src/ReactHydration.js"

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
        <TestComponent />
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
        <TestComponent />
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
        <TestComponent />
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
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent />
        </Suspense>
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
      <ErrorBoundary fallback={<div data-testid="error">Error</div>}>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent />
        </Suspense>
      </ErrorBoundary>,
      {
        // dont log error to console (the default behavior)
        onCaughtError: () => {}
      }
    )

    expect(screen.getByTestId("error")).toBeInTheDocument()
  })

  test("hydration", () => {
    const rxBasic = Rx.make(0).pipe(
      Rx.serializable({
        key: "basic",
        schema: Schema.Number
      })
    )
    const e: Effect.Effect<number, string> = Effect.never
    const makeRxResult = (key: string) =>
      Rx.make(e).pipe(
        Rx.serializable({
          key,
          schema: Result.Schema({
            success: Schema.Number,
            error: Schema.String
          })
        })
      )

    const rxResult1 = makeRxResult("success")
    const rxResult2 = makeRxResult("errored")
    const rxResult3 = makeRxResult("pending")

    const dehydratedState: Array<Hydration.DehydratedRx> = [
      {
        "key": "basic",
        "value": 1,
        "dehydratedAt": Date.now()
      },
      {
        "key": "success",
        "value": {
          "_tag": "Success",
          "value": 123,
          "waiting": false
        },
        "dehydratedAt": Date.now()
      },
      {
        "key": "errored",
        "value": {
          "_tag": "Failure",
          "cause": {
            "_tag": "Fail",
            "error": "error"
          },
          "previousValue": {
            "_tag": "None"
          },
          "waiting": false
        },
        "dehydratedAt": Date.now()
      },
      {
        "key": "pending",
        "value": {
          "_tag": "Initial",
          "waiting": true
        },
        "dehydratedAt": Date.now()
      }
    ]

    function Basic() {
      const value = useRxValue(rxBasic)
      return <div data-testid="value">{value}</div>
    }

    function Result1() {
      const value = useRxValue(rxResult1)
      return Result.match(value, {
        onSuccess: (value) => <div data-testid="value-1">{value.value}</div>,
        onFailure: () => <div data-testid="error-1">Error</div>,
        onInitial: () => <div data-testid="loading-1">Loading...</div>
      })
    }

    function Result2() {
      const value = useRxValue(rxResult2)
      return Result.match(value, {
        onSuccess: (value) => <div data-testid="value-2">{value.value}</div>,
        onFailure: () => <div data-testid="error-2">Error</div>,
        onInitial: () => <div data-testid="loading-2">Loading...</div>
      })
    }

    function Result3() {
      const value = useRxValue(rxResult3)
      return Result.match(value, {
        onSuccess: (value) => <div data-testid="value-3">{value.value}</div>,
        onFailure: () => <div data-testid="error-3">Error</div>,
        onInitial: () => <div data-testid="loading-3">Loading...</div>
      })
    }

    render(
      <HydrationBoundary state={dehydratedState}>
        <Basic />
        <Result1 />
        <Result2 />
        <Result3 />
      </HydrationBoundary>
    )

    expect(screen.getByTestId("value")).toHaveTextContent("1")
    expect(screen.getByTestId("value-1")).toHaveTextContent("123")
    expect(screen.getByTestId("error-2")).toBeInTheDocument()
    expect(screen.getByTestId("loading-3")).toBeInTheDocument()
  })

  test("hydration streaming", async () => {
    const latch = Effect.runSync(Effect.makeLatch())
    let start = 0
    let stop = 0
    const rx = Rx.make(Effect.gen(function*() {
      start = start + 1
      yield* latch.await
      stop = stop + 1
      return 1
    })).pipe(Rx.serializable({
      key: "test",
      schema: Result.Schema({
        success: Schema.Number
      })
    }))

    registry.mount(rx)

    expect(start).toBe(1)
    expect(stop).toBe(0)

    const dehydratedState = Hydration.dehydrate(registry)

    function TestComponent() {
      const value = useRxValue(rx)
      return <div data-testid="value">{value._tag}</div>
    }

    render(
      // provide a fresh registry each time to simulate hydration
      <RegistryContext.Provider value={Registry.make()}>
        <HydrationBoundary state={dehydratedState}>
          <TestComponent />
        </HydrationBoundary>
      </RegistryContext.Provider>
    )

    expect(screen.getByTestId("value")).toHaveTextContent("Initial")

    act(() => {
      Effect.runSync(latch.open)
    })
    await Effect.runPromise(latch.await)

    const test = registry.get(rx)
    expect(test._tag).toBe("Success")
    if (test._tag === "Success") {
      expect(test.value).toBe(1)
    }

    expect(screen.getByTestId("value")).toHaveTextContent("Success")
    expect(start).toBe(1)
    expect(stop).toBe(1)
  })
})
