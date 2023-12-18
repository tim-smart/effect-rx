/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import type * as RxRef from "@effect-rx/rx/RxRef"
import * as Cause from "effect/Cause"
import type * as Exit from "effect/Exit"
import { globalValue } from "effect/GlobalValue"
import * as React from "react"

/**
 * @since 1.0.0
 * @category modules
 */
export * as Registry from "@effect-rx/rx/Registry"
/**
 * @since 1.0.0
 * @category modules
 */
export * as Result from "@effect-rx/rx/Result"
/**
 * @since 1.0.0
 * @category modules
 */
export * as Rx from "@effect-rx/rx/Rx"
/**
 * @since 1.0.0
 * @category modules
 */
export * as RxRef from "@effect-rx/rx/RxRef"

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make())

interface RxStore<A> {
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
  readonly serverSnapshot: () => A
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
    },
    serverSnapshot() {
      return undefined as any
    }
  }
  stores.set(rx, newStore)
  return newStore
}

function useStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): A {
  const store = makeStore(registry, rx)
  return React.useSyncExternalStore(store.subscribe, store.snapshot, store.serverSnapshot)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxValue: {
  <A>(rx: Rx.Rx<A>): A
  <A, B>(rx: Rx.Rx<A>, f: (_: A) => B): B
} = <A>(rx: Rx.Rx<A>, f?: (_: A) => A): A => {
  const registry = React.useContext(RegistryContext)
  if (f) {
    const rxB = React.useMemo(() => Rx.map(rx, f), [rx, f])
    return useStore(registry, rxB)
  }
  return useStore(registry, rx)
}

function mountRx<A>(registry: Registry.Registry, rx: Rx.Rx<A>): void {
  React.useEffect(() => registry.mount(rx), [rx, registry])
}

function setRx<R, W>(registry: Registry.Registry, rx: Rx.Writable<R, W>): (_: W | ((_: R) => W)) => void {
  return React.useCallback((value) => {
    if (typeof value === "function") {
      registry.set(rx, (value as any)(registry.get(rx)))
      return
    } else {
      registry.set(rx, value)
    }
  }, [registry, rx])
}

function setRxPromise<E, A, W>(
  registry: Registry.Registry,
  rx: Rx.Writable<Result.Result<E, A>, W>
): (_: W) => Promise<Exit.Exit<E, A>> {
  const cancelRef = React.useRef<Set<() => void>>(undefined as any)
  if (!cancelRef.current) {
    cancelRef.current = new Set()
  }
  React.useEffect(() => () => {
    cancelRef.current.forEach((cancel) => cancel())
    cancelRef.current.clear()
  }, [])

  return React.useCallback((value) => {
    registry.set(rx, value)

    return new Promise((resolve) => {
      const value = registry.get(rx)
      if (Result.isSuccess(value) || Result.isFailure(value)) {
        resolve(Result.toExit(value) as any)
      } else {
        const cancel = registry.subscribe(rx, (value) => {
          if (Result.isSuccess(value) || Result.isFailure(value)) {
            cancelRef.current.delete(cancel)
            cancel()
            resolve(Result.toExit(value) as any)
          }
        })
        cancelRef.current.add(cancel)
      }
    })
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxMount = <A>(rx: Rx.Rx<A>): void => {
  const registry = React.useContext(RegistryContext)
  mountRx(registry, rx)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSet = <R, W>(rx: Rx.Writable<R, W>): (_: W | ((_: R) => W)) => void => {
  const registry = React.useContext(RegistryContext)
  mountRx(registry, rx)
  return setRx(registry, rx)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSetPromise = <E, A, W>(
  rx: Rx.Writable<Result.Result<E, A>, W>
): (_: W) => Promise<Exit.Exit<E, A>> => {
  const registry = React.useContext(RegistryContext)
  return setRxPromise(registry, rx)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRefresh = <A>(rx: Rx.Rx<A> & Rx.Refreshable): () => void => {
  const registry = React.useContext(RegistryContext)
  mountRx(registry, rx)
  return React.useCallback(() => {
    registry.refresh(rx)
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRx = <R, W>(
  rx: Rx.Writable<R, W>
): readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void] => {
  const registry = React.useContext(RegistryContext)
  return [
    useStore(registry, rx),
    setRx(registry, rx)
  ] as const
}

type SuspenseResult<E, A> =
  | {
    readonly _tag: "Suspended"
    readonly promise: Promise<void>
  }
  | {
    readonly _tag: "Value"
    readonly value: Result.Success<E, A> | Result.Failure<E, A>
  }

const suspenseRx = Rx.family((rx: Rx.Rx<Result.Result<any, any>>) =>
  Rx.readable((get): SuspenseResult<any, any> => {
    const result = get(rx)
    if (result._tag === "Initial") {
      return {
        _tag: "Suspended",
        promise: new Promise<void>((resolve) => get.addFinalizer(resolve))
      } as const
    }
    return { _tag: "Value", value: result } as const
  })
)

const suspenseRxWaiting = Rx.family((rx: Rx.Rx<Result.Result<any, any>>) =>
  Rx.readable((get): SuspenseResult<any, any> => {
    const result = get(rx)
    if (result.waiting || result._tag === "Initial") {
      return {
        _tag: "Suspended",
        promise: new Promise<void>((resolve) => get.addFinalizer(resolve))
      } as const
    }
    return { _tag: "Value", value: result } as const
  })
)

const suspenseMounts = globalValue("@effect-rx/rx-react/suspenseMounts", () => new Set<Rx.Rx<any>>())

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspense = <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
): Result.Success<E, A> | Result.Failure<E, A> => {
  const registry = React.useContext(RegistryContext)
  const resultRx = React.useMemo(
    () => (options?.suspendOnWaiting ? suspenseRxWaiting(rx) : suspenseRx(rx)),
    [options?.suspendOnWaiting, rx]
  )
  const result = useStore(registry, resultRx)
  if (result._tag === "Suspended") {
    if (!suspenseMounts.has(resultRx)) {
      suspenseMounts.add(resultRx)
      const unmount = registry.mount(resultRx)
      result.promise.then(function() {
        setTimeout(function() {
          unmount()
          suspenseMounts.delete(resultRx)
        }, 1000)
      })
    }
    throw result.promise
  }

  return result.value
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspenseSuccess = <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
): Result.Success<E, A> => {
  const result = useRxSuspense(rx, options)
  if (result._tag === "Failure") {
    throw Cause.squash(result.cause)
  }
  return result
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSubscribe = <A>(
  rx: Rx.Rx<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
): void => {
  const registry = React.useContext(RegistryContext)
  React.useEffect(
    () => registry.subscribe(rx, f, options),
    [registry, rx, f, options?.immediate]
  )
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRef = <A>(ref: RxRef.ReadonlyRef<A>): A => {
  const [value, setValue] = React.useState(ref.value)
  React.useEffect(() => ref.subscribe(setValue), [ref])
  return value
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRefProp = <A, K extends keyof A>(ref: RxRef.RxRef<A>, prop: K): RxRef.RxRef<A[K]> => {
  return React.useMemo(() => ref.prop(prop), [ref, prop])
}
