/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import type * as RxRef from "@effect-rx/rx/RxRef"
import * as Cause from "effect/Cause"
import type * as Exit from "effect/Exit"
import { constVoid } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as React from "react"
import * as Scheduler from "scheduler"

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

function scheduleTask(f: () => void): void {
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, f)
}

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make({
  scheduleTask
}))

function identityReducer<A>(prev: A, next: A) {
  if (Object.is(prev, next)) {
    return prev
  }
  return next
}

function useRxValueRaw<A>(registry: Registry.Registry, rx: Rx.Rx<A>): A {
  const [state, dispatch] = React.useReducer(identityReducer<A>, void 0, function(_) {
    return registry.get(rx)
  })
  React.useEffect(function() {
    return registry.subscribe(rx, dispatch, { immediate: true })
  }, [registry, rx])
  return state
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
    return useRxValueRaw(registry, rxB)
  }
  return useRxValueRaw(registry, rx)
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
  rx: Rx.Writable<Result.Result<A, E>, W>
): (_: W) => Promise<Exit.Exit<A, E>> {
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
  rx: Rx.Writable<Result.Result<A, E>, W>
): (_: W) => Promise<Exit.Exit<A, E>> => {
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
    useRxValueRaw(registry, rx),
    setRx(registry, rx)
  ] as const
}

type SuspenseResult<A, E> = {
  readonly _tag: "Suspended"
  readonly promise: Promise<void>
  readonly resolve: () => void
} | {
  readonly _tag: "Resolved"
  readonly result: Result.Success<A, E> | Result.Failure<A, E>
}
function makeSuspended(rx: Rx.Rx<any>): {
  readonly _tag: "Suspended"
  readonly promise: Promise<void>
  readonly resolve: () => void
} {
  let resolve: () => void
  const promise = new Promise<void>((_resolve) => {
    resolve = _resolve
  })
  ;(promise as any).rx = rx
  return {
    _tag: "Suspended",
    promise,
    resolve: resolve!
  }
}
const suspenseRxMap = globalValue(
  "@effect-rx/rx-react/suspenseMounts",
  () => new WeakMap<Rx.Rx<any>, Rx.Rx<SuspenseResult<any, any>>>()
)

function suspenseRx<A, E>(
  registry: Registry.Registry,
  rx: Rx.Rx<Result.Result<A, E>>,
  suspendOnWaiting: boolean
): Rx.Rx<SuspenseResult<A, E>> {
  if (suspenseRxMap.has(rx)) {
    return suspenseRxMap.get(rx)!
  }
  let unmount: (() => void) | undefined
  let timeout: number | undefined
  function performMount() {
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }
    unmount = registry.subscribe(resultRx, constVoid)
  }
  function performUnmount() {
    timeout = undefined
    if (unmount !== undefined) {
      unmount()
      unmount = undefined
    }
  }
  const resultRx = Rx.readable<SuspenseResult<A, E>>(function(get) {
    let state: SuspenseResult<A, E> = makeSuspended(rx)
    get.subscribe(rx, function(result) {
      if (result._tag === "Initial" || (suspendOnWaiting && result.waiting)) {
        if (state._tag === "Resolved") {
          state = makeSuspended(rx)
          get.setSelfSync(state)
        }
        if (unmount === undefined) {
          performMount()
        }
      } else {
        if (unmount !== undefined && timeout === undefined) {
          timeout = setTimeout(performUnmount, 1000)
        }
        if (state._tag === "Resolved") {
          state = { _tag: "Resolved", result }
          get.setSelfSync(state)
        } else {
          const resolve = state.resolve
          state = { _tag: "Resolved", result }
          get.setSelfSync(state)
          resolve()
        }
      }
    }, { immediate: true })
    return state
  })
  suspenseRxMap.set(rx, resultRx)
  return resultRx
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
  const promiseRx = React.useMemo(() => suspenseRx(registry, rx, options?.suspendOnWaiting ?? false), [
    registry,
    rx,
    options?.suspendOnWaiting
  ])
  const result = useRxValueRaw(registry, promiseRx)
  if (result._tag === "Suspended") {
    throw result.promise
  }
  return result.result
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
