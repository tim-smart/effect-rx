/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import { globalValue } from "@effect/data/GlobalValue"
import * as Cause from "@effect/io/Cause"
import * as React from "react"

export * as Registry from "@effect-rx/rx/Registry"
export * as Result from "@effect-rx/rx/Result"
export * as Rx from "@effect-rx/rx/Rx"

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make())

interface RxStore<A> {
  readonly rx: Rx.Rx<A>
  readonly registry: Registry.Registry
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
}

function makeStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): RxStore<A> {
  let getter = function() {
    return registry.get(rx)
  }
  function subscribe(f: () => void): () => void {
    const [get, unmount] = registry.subscribeGetter(rx, f)
    getter = get
    return unmount
  }
  function snapshot() {
    return getter()
  }
  return { rx, registry, subscribe, snapshot }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxValue = <A>(rx: Rx.Rx<A>): A => {
  const registry = React.useContext(RegistryContext)
  const store = React.useRef<RxStore<A>>(undefined as any)
  if (store.current?.rx !== rx || store.current?.registry !== registry) {
    store.current = makeStore(registry, rx)
  }
  return React.useSyncExternalStore(store.current.subscribe, store.current.snapshot)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useSetRx = <R, W>(rx: Rx.Writable<R, W>): (_: W | ((_: R) => W)) => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback((value) => {
    if (typeof value === "function") {
      registry.set(rx, (value as any)(registry.get(rx)))
      return
    } else {
      registry.set(rx, value)
    }
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRefreshRx = <A>(rx: Rx.Rx<A> & Rx.Refreshable): () => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback(() => {
    registry.refresh(rx)
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRx = <R, W>(rx: Rx.Writable<R, W>): readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void] =>
  [
    useRxValue(rx),
    useSetRx(rx)
  ] as const

type SuspenseResult<E, A> =
  | {
    readonly _tag: "Suspended"
    readonly promise: Promise<void>
  }
  | {
    readonly _tag: "Value"
    readonly isWaiting: boolean
    readonly value: Result.Success<E, A> | Result.Failure<E, A>
  }

const suspenseCache = globalValue("@effect-rx/rx-react/suspenseCache", () => new Map<Rx.Rx<any>, () => void>())
const suspenseRx = Rx.family((rx: Rx.Rx<Result.Result<any, any>>) =>
  Rx.readable((get, ctx): SuspenseResult<any, any> => {
    const result = get(rx)
    const value = Result.noWaiting(result)
    if (value._tag === "Initial") {
      return {
        _tag: "Suspended",
        promise: new Promise<void>((resolve) => {
          ctx.addFinalizer(() => {
            resolve()
            const unmount = suspenseCache.get(rx)
            if (unmount) {
              unmount()
              suspenseCache.delete(rx)
            }
          })
        })
      } as const
    }
    const isWaiting = Result.isWaiting(result)
    return { _tag: "Value", isWaiting, value } as const
  })
)
const suspenseRxWaiting = Rx.family((rx: Rx.Rx<Result.Result<any, any>>) =>
  Rx.readable((get, ctx): SuspenseResult<any, any> => {
    const result = get(rx)
    if (result._tag === "Waiting" || result._tag === "Initial") {
      return {
        _tag: "Suspended",
        promise: new Promise<void>((resolve) => {
          ctx.addFinalizer(() => {
            resolve()
            const unmount = suspenseCache.get(rx)
            if (unmount) {
              unmount()
              suspenseCache.delete(rx)
            }
          })
        })
      } as const
    }
    return { _tag: "Value", isWaiting: false, value: result } as const
  })
)

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspense = <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
): {
  readonly isWaiting: boolean
  readonly value: Result.Success<E, A> | Result.Failure<E, A>
} => {
  const registry = React.useContext(RegistryContext)
  const resultRx = React.useMemo(
    () => (options?.suspendOnWaiting ? suspenseRxWaiting(rx) : suspenseRx(rx)),
    [options?.suspendOnWaiting, rx]
  )
  const result = useRxValue(resultRx)
  if (result._tag === "Suspended") {
    if (!suspenseCache.has(resultRx)) {
      suspenseCache.set(resultRx, registry.mount(resultRx))
    }
    throw result.promise
  }
  return result
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspenseSuccess = <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
): {
  readonly isWaiting: boolean
  readonly value: A
} => {
  const registry = React.useContext(RegistryContext)
  const resultRx = React.useMemo(
    () => (options?.suspendOnWaiting ? suspenseRxWaiting(rx) : suspenseRx(rx)),
    [options?.suspendOnWaiting, rx]
  )
  const result = useRxValue(resultRx)
  if (result._tag === "Suspended") {
    if (!suspenseCache.has(resultRx)) {
      suspenseCache.set(resultRx, registry.mount(resultRx))
    }
    throw result.promise
  } else if (result.value._tag === "Failure") {
    throw Cause.squash(result.value.cause)
  }
  return {
    isWaiting: result.isWaiting,
    value: result.value.value
  }
}
