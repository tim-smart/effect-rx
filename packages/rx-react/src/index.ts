/**
 * @since 1.0.0
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as Reactive from "@effect-rx/rx/Reactive"
import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import type * as RxRef from "@effect-rx/rx/RxRef"
import * as Cause from "effect/Cause"
import type * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import type * as Exit from "effect/Exit"
import * as FiberSet from "effect/FiberSet"
import { constNull } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
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
/**
 * @since 1.0.0
 * @category modules
 */
export * as Reactive from "@effect-rx/rx/Reactive"
/**
 * @since 1.0.0
 * @category modules
 */
export * as ReactiveRef from "@effect-rx/rx/ReactiveRef"

/**
 * @since 1.0.0
 * @category context
 */
export function scheduleTask(f: () => void): void {
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, f)
}

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make({
  scheduleTask,
  defaultIdleTTL: 400
}))

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryProvider = (options: {
  readonly children?: React.ReactNode | undefined
  readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}) => {
  const registry = React.useMemo(() =>
    Registry.make({
      scheduleTask,
      defaultIdleTTL: 400,
      ...options
    }), [])
  React.useEffect(() => () => {
    registry.dispose()
  }, [registry])
  return React.createElement(RegistryContext.Provider, {
    value: Registry.make({
      scheduleTask,
      defaultIdleTTL: 400,
      ...options
    })
  }, options?.children)
}

interface RxStore<A> {
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
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

function useStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): A {
  const store = makeStore(registry, rx)
  return React.useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
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
): (_: W) => Promise<Exit.Exit<A, E>> => {
  const registry = React.useContext(RegistryContext)
  const resolves = React.useMemo(() => new Set<(result: Exit.Exit<A, E>) => void>(), [])
  React.useEffect(() =>
    registry.subscribe(rx, (result) => {
      if (result.waiting || result._tag === "Initial") return
      const fns = Array.from(resolves)
      resolves.clear()
      const exit = Result.toExit(result)
      fns.forEach((resolve) => resolve(exit as any))
    }, { immediate: true }), [registry, rx, resolves])
  return React.useCallback((value) =>
    new Promise((resolve) => {
      resolves.add(resolve)
      registry.set(rx, value)
    }), [registry, rx, resolves])
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

/**
 * @since 1.0.0
 * @category Reactive
 */
export interface ReactiveComponent<Props extends Record<string, any>, R = never> {
  (
    props: Props & [R] extends [never] ? {
        readonly context?: Context.Context<never> | undefined
      } :
      { readonly context: Context.Context<R> }
  ): React.ReactNode

  provide<AL, EL, RL>(layer: Layer.Layer<AL, EL, RL>): ReactiveComponent<Props, Exclude<R, AL> | RL>

  render: Effect.Effect<(props: Props) => React.ReactNode, never, R>
}

const makeReactiveComponent = <Props extends Record<string, any>, E, R>(options: {
  readonly name: string
  readonly build: (
    props: Props,
    emit: (_: React.ReactNode) => Effect.Effect<void, never, Reactive.Reactive>
  ) => Effect.Effect<React.ReactNode, E, R>
  readonly layer: Layer.Layer<never>
  readonly onInitial: (props: Props) => React.ReactNode
  readonly deps: (props: Props) => ReadonlyArray<any>
}): ReactiveComponent<Props, R> => {
  function ReactiveComponent(props: Props & { readonly context?: Context.Context<R> }) {
    const subscribable = React.useMemo(
      () => {
        const layer = props.context
          ? Layer.provideMerge(options.layer, Layer.succeedContext(props.context))
          : options.layer
        return Reactive.toSubscribable(layer)(
          options.build(props, Reactive.emit) as Effect.Effect<React.ReactNode, E, Reactive.Reactive>
        )
      },
      options.deps(props)
    )
    const store = makeSubscribableStore(subscribable)
    const result = React.useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
    if (result._tag === "Initial") {
      return options.onInitial(props)
    } else if (result._tag === "Failure") {
      throw Cause.squash(result.cause)
    }
    return result.value
  }
  ReactiveComponent.displayName = options.name
  ReactiveComponent.provide = function provide(layer: Layer.Layer<any, any, any>) {
    return makeReactiveComponent({
      ...options,
      layer: options.layer === Layer.empty ? layer : Layer.provideMerge(options.layer, layer) as any
    })
  }
  ReactiveComponent.render = Effect.contextWith((context: Context.Context<any>) => (props: Props) =>
    ReactiveComponent({
      ...props,
      context
    })
  )
  return ReactiveComponent as any
}

const subscribableStores = globalValue(
  "@effect-rx/rx-react/subscribableStores",
  () => new WeakMap<Reactive.Subscribable<any, any>, RxStore<any>>()
)
const makeSubscribableStore = <A, E>(subscribable: Reactive.Subscribable<A, E>): RxStore<Result.Result<A, E>> => {
  let store = subscribableStores.get(subscribable)
  if (store !== undefined) {
    return store
  }

  let result: Result.Result<A, E> = Result.initial(true)

  store = {
    subscribe(f) {
      return subscribable.subscribe((result_) => {
        result = result_
        f()
      })
    },
    snapshot() {
      return result
    }
  }

  subscribableStores.set(subscribable, store)

  return store
}

const defaultDeps = (props: Record<string, any>) => Object.values(props)

/**
 * @since 1.0.0
 * @category Reactive
 */
export const component = <E, R, Props extends Record<string, any> = {}>(
  name: string,
  build: (
    props: Props,
    emit: (_: React.ReactNode) => Effect.Effect<void, never, Reactive.Reactive>
  ) => Effect.Effect<React.ReactNode, E, R>,
  options?: {
    readonly onInitial?: (props: Props) => React.ReactNode
    readonly deps?: (props: Props) => ReadonlyArray<any>
  }
): ReactiveComponent<Props, Exclude<R, Reactive.Reactive | Scope>> =>
  makeReactiveComponent({
    name,
    build,
    layer: Layer.empty,
    onInitial: options?.onInitial ?? constNull,
    deps: options?.deps ?? defaultDeps
  }) as any

/**
 * @since 1.0.0
 * @category Reactive
 */
export const action = <Args extends ReadonlyArray<any>, A, E, R>(
  f: (...args: Args) => Effect.Effect<A, E, R>
): Effect.Effect<(...args: Args) => Promise<A>, never, R | Scope> =>
  Effect.map(
    FiberSet.makeRuntimePromise<R, A, E>(),
    (runPromise) => (...args) => runPromise(f(...args))
  )
