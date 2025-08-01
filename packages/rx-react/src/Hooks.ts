/**
 * @since 1.0.0
 */
"use client"
import * as Registry from "@effect-rx/rx/Registry"
import type * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import type * as RxRef from "@effect-rx/rx/RxRef"
import { Effect } from "effect"
import * as Cause from "effect/Cause"
import type * as Exit from "effect/Exit"
import { globalValue } from "effect/GlobalValue"
import * as React from "react"
import { RegistryContext } from "./RegistryContext.js"

interface RxStore<A> {
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
  readonly getServerSnapshot: () => A
}

const storeRegistry = globalValue(
  "@effect-rx/rx-react/storeRegistry",
  () => new WeakMap<Registry.Registry, WeakMap<Rx.Rx<any>, RxStore<any>>>()
)

function makeStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): RxStore<A> {
  let stores = storeRegistry.get(registry)
  if (stores === undefined) {
    stores = new WeakMap()
    storeRegistry.set(registry, stores)
  }
  const store = stores.get(rx)
  if (store !== undefined) {
    return store
  }
  const newStore: RxStore<any> = {
    subscribe(f) {
      return registry.subscribe(rx, f)
    },
    snapshot() {
      return registry.get(rx)
    },
    getServerSnapshot() {
      if (Rx.isHasServerSnapshot(rx)) {
        return rx.getServerSnapshot()
      }
      return registry.get(rx)
    }
  }
  stores.set(rx, newStore)
  return newStore
}

function useStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): A {
  const store = makeStore(registry, rx)

  return React.useSyncExternalStore(store.subscribe, store.snapshot, store.getServerSnapshot)
}

const initialValuesSet = globalValue(
  "@effect-rx/rx-react/initialValuesSet",
  () => new WeakMap<Registry.Registry, WeakSet<Rx.Rx<any>>>()
)

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxInitialValues = (initialValues: Iterable<readonly [Rx.Rx<any>, any]>): void => {
  const registry = React.useContext(RegistryContext)
  let set = initialValuesSet.get(registry)
  if (set === undefined) {
    set = new WeakSet()
    initialValuesSet.set(registry, set)
  }
  for (const [rx, value] of initialValues) {
    if (!set.has(rx)) {
      set.add(rx)
      ;(registry as any).ensureNode(rx).setValue(value)
    }
  }
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
  rx: Rx.Writable<Result.Result<A, E>, W>
): (
  _: W,
  options?: {
    readonly signal?: AbortSignal | undefined
  } | undefined
) => Promise<Exit.Exit<A, E>> => {
  const registry = React.useContext(RegistryContext)
  mountRx(registry, rx)
  return React.useCallback((value, options) => {
    registry.set(rx, value)
    return Effect.runPromiseExit(Registry.getResult(registry, rx), options)
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRefresh = <A>(rx: Rx.Rx<A>): () => void => {
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

const rxPromiseMap = globalValue(
  "@effect-rx/rx-react/rxPromiseMap",
  () => ({
    suspendOnWaiting: new Map<Rx.Rx<any>, Promise<void>>(),
    default: new Map<Rx.Rx<any>, Promise<void>>()
  })
)

function rxToPromise<A, E>(
  registry: Registry.Registry,
  rx: Rx.Rx<Result.Result<A, E>>,
  suspendOnWaiting: boolean
) {
  const map = suspendOnWaiting ? rxPromiseMap.suspendOnWaiting : rxPromiseMap.default
  let promise = map.get(rx)
  if (promise !== undefined) {
    return promise
  }
  promise = new Promise<void>((resolve) => {
    const dispose = registry.subscribe(rx, (result) => {
      if (result._tag === "Initial" || (suspendOnWaiting && result.waiting)) {
        return
      }
      setTimeout(dispose, 1000)
      resolve()
      map.delete(rx)
    })
  })
  map.set(rx, promise)
  return promise
}

function rxResultOrSuspend<A, E>(
  registry: Registry.Registry,
  rx: Rx.Rx<Result.Result<A, E>>,
  suspendOnWaiting: boolean
) {
  const value = useStore(registry, rx)
  if (value._tag === "Initial" || (suspendOnWaiting && value.waiting)) {
    throw rxToPromise(registry, rx, suspendOnWaiting)
  }
  return value
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspense = <A, E>(
  rx: Rx.Rx<Result.Result<A, E>>,
  options?: { readonly suspendOnWaiting?: boolean }
): Result.Success<A, E> | Result.Failure<A, E> => {
  const registry = React.useContext(RegistryContext)
  return rxResultOrSuspend(registry, rx, options?.suspendOnWaiting ?? false)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxSuspenseSuccess = <A, E>(
  rx: Rx.Rx<Result.Result<A, E>>,
  options?: { readonly suspendOnWaiting?: boolean }
): Result.Success<A, E> => {
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
  const [, setValue] = React.useState(ref.value)
  React.useEffect(() => ref.subscribe(setValue), [ref])
  return ref.value
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRefProp = <A, K extends keyof A>(ref: RxRef.RxRef<A>, prop: K): RxRef.RxRef<A[K]> =>
  React.useMemo(() => ref.prop(prop), [ref, prop])

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxRefPropValue = <A, K extends keyof A>(ref: RxRef.RxRef<A>, prop: K): A[K] =>
  useRxRef(useRxRefProp(ref, prop))
