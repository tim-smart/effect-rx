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
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
}

const storeRegistry = globalValue(
  "@effect-rx/rx-react/storeRegistry",
  () => new WeakMap<Registry.Registry, WeakMap<Rx.Rx<any>, RxStore<any>>>()
)

function makeStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): RxStore<A> {
  const stores = storeRegistry.get(registry) ?? storeRegistry.set(registry, new WeakMap()).get(registry)!
  const store = stores.get(rx)
  if (store) {
    return store
  }
  const newStore: RxStore<A> = {
    subscribe(f) {
      return registry.subscribe(rx, f)
    },
    snapshot() {
      return registry.get(rx)
    }
  }
  stores.set(rx, newStore)
  return newStore
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxValue = <A>(rx: Rx.Rx<A>): A => {
  const registry = React.useContext(RegistryContext)
  const store = makeStore(registry, rx)
  return React.useSyncExternalStore(store.subscribe, store.snapshot)
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

const suspenseCache = globalValue("@effect-rx/rx-react/suspenseCache", () => new WeakMap<Rx.Rx<any>, () => void>())
const suspenseRegistry = new FinalizationRegistry((unmount: () => void) => {
  unmount()
})

const suspenseRx = Rx.family((rx: Rx.Rx<Result.Result<any, any>>) =>
  Rx.readable((get, ctx): SuspenseResult<any, any> => {
    const result = get(rx)
    const value = Result.noWaiting(result)
    if (value._tag === "Initial") {
      return {
        _tag: "Suspended",
        promise: new Promise<void>((resolve) => ctx.addFinalizer(resolve))
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
        promise: new Promise<void>((resolve) => ctx.addFinalizer(resolve))
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
  const store = makeStore(registry, resultRx)
  const result = React.useSyncExternalStore(store.subscribe, store.snapshot)
  if (result._tag === "Suspended") {
    if (!suspenseCache.has(resultRx)) {
      const unmount = registry.mount(resultRx)
      suspenseCache.set(resultRx, unmount)
      suspenseRegistry.register(result.promise, unmount, resultRx)
    }
    throw result.promise
  } else if (suspenseCache.has(resultRx)) {
    const unmount = suspenseCache.get(resultRx)
    if (unmount) {
      suspenseCache.delete(resultRx)
      suspenseRegistry.unregister(resultRx)
      unmount()
    }
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
  const result = useRxSuspense(rx, options)
  if (result.value._tag === "Failure") {
    throw Cause.squash(result.value.cause)
  }
  return {
    isWaiting: result.isWaiting,
    value: result.value.value
  }
}
