/**
 * @since 1.0.0
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as KeyValueStore from "@effect/platform/KeyValueStore"
import { NoSuchElementException } from "effect/Cause"
import type * as Cause from "effect/Cause"
import * as Channel from "effect/Channel"
import * as Chunk from "effect/Chunk"
import * as EffectContext from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import * as FiberRef from "effect/FiberRef"
import type { LazyArg } from "effect/Function"
import { constVoid, dual, pipe } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Inspectable from "effect/Inspectable"
import * as Layer from "effect/Layer"
import * as MutableHashMap from "effect/MutableHashMap"
import * as Option from "effect/Option"
import { type Pipeable, pipeArguments } from "effect/Pipeable"
import * as Runtime from "effect/Runtime"
import * as Schema from "effect/Schema"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as Subscribable from "effect/Subscribable"
import * as SubscriptionRef from "effect/SubscriptionRef"
import * as internalRegistry from "./internal/registry.js"
import { runCallbackSync } from "./internal/runtime.js"
import * as Registry from "./Registry.js"
import { RxRegistry } from "./Registry.js"
import * as Result from "./Result.js"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId = Symbol.for("@effect-rx/rx/Rx")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Rx<A> extends Pipeable, Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly lazy: boolean
  readonly read: (get: Context) => A
  readonly refresh?: (f: <A>(rx: Rx<A>) => void) => void
  readonly label?: readonly [name: string, stack: string]
  readonly idleTTL?: number
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Rx {
  /**
   * @since 1.0.0
   */
  export type Infer<T extends Rx<any>> = T extends Rx<infer A> ? A : never

  /**
   * @since 1.0.0
   */
  export type InferSuccess<T extends Rx<any>> = T extends Rx<Result.Result<infer A, infer _>> ? A : never

  /**
   * @since 1.0.0
   */
  export type InferPullSuccess<T extends Rx<any>> = T extends Rx<PullResult<infer A, infer _>> ? A : never

  /**
   * @since 1.0.0
   */
  export type InferFailure<T extends Rx<any>> = T extends Rx<Result.Result<infer _, infer E>> ? E : never
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const RefreshableTypeId = Symbol.for("@effect-rx/rx/Rx/Refreshable")

/**
 * @since 1.0.0
 * @category type ids
 */
export type RefreshableTypeId = typeof RefreshableTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Refreshable {
  readonly [RefreshableTypeId]: RefreshableTypeId
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const WritableTypeId = Symbol.for("@effect-rx/rx/Rx/Writable")

/**
 * @since 1.0.0
 * @category type ids
 */
export type WritableTypeId = typeof WritableTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Writable<R, W = R> extends Rx<R> {
  readonly [WritableTypeId]: WritableTypeId
  readonly write: (ctx: WriteContext<R>, value: W) => void
}

/**
 * @since 1.0.0
 * @category context
 */
export interface Context {
  <A>(rx: Rx<A>): A
  readonly get: <A>(rx: Rx<A>) => A
  readonly result: <A, E>(rx: Rx<Result.Result<A, E>>) => Effect.Effect<A, E>
  readonly resultOnce: <A, E>(rx: Rx<Result.Result<A, E>>) => Effect.Effect<A, E>
  readonly once: <A>(rx: Rx<A>) => A
  readonly addFinalizer: (f: () => void) => void
  readonly mount: <A>(rx: Rx<A>) => void
  readonly refresh: <A>(rx: Rx<A> & Refreshable) => void
  readonly refreshSelf: () => void
  readonly self: <A>() => Option.Option<A>
  readonly setSelf: <A>(a: A) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => void
  readonly some: <A>(rx: Rx<Option.Option<A>>) => Effect.Effect<A>
  readonly someOnce: <A>(rx: Rx<Option.Option<A>>) => Effect.Effect<A>
  readonly stream: <A>(rx: Rx<A>, options?: {
    readonly withoutInitialValue?: boolean
    readonly bufferSize?: number
  }) => Stream.Stream<A>
  readonly streamResult: <A, E>(rx: Rx<Result.Result<A, E>>, options?: {
    readonly withoutInitialValue?: boolean
    readonly bufferSize?: number
  }) => Stream.Stream<A, E>
  readonly subscribe: <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
  readonly registry: Registry.Registry
}

/**
 * @since 1.0.0
 * @category context
 */
export interface WriteContext<A> {
  readonly get: <A>(rx: Rx<A>) => A
  readonly refreshSelf: () => void
  readonly setSelf: (a: A) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => void
}

const RxProto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments)
  },
  toJSON(this: Rx<any>) {
    return {
      _id: "Rx",
      keepAlive: this.keepAlive,
      lazy: this.lazy,
      label: this.label
    }
  },
  toString() {
    return Inspectable.format(this)
  },
  [Inspectable.NodeInspectSymbol](this: Rx<any>) {
    return this.toJSON()
  }
} as const

const RxRuntimeProto = {
  ...RxProto,
  rx(this: RxRuntime<any, any>, arg: any, options?: { readonly initialValue?: unknown }) {
    const read = makeRead(arg, options)
    return readable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return read(get, runtimeResult.value)
    })
  },

  fn(this: RxRuntime<any, any>, arg: any, options?: { readonly initialValue?: unknown }) {
    if (arguments.length === 0) {
      return (arg: any, options?: { readonly initialValue?: unknown }) => makeFnRuntime(this, arg, options)
    }
    return makeFnRuntime(this, arg, options)
  },

  pull(this: RxRuntime<any, any>, arg: any, options?: {
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<any>
  }) {
    const pullSignal = state(0)
    const pullRx = readable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return makeEffect(
        get,
        makeStreamPullEffect(get, pullSignal, arg, options),
        Result.initial(true),
        runtimeResult.value
      )
    })
    return makeStreamPull(pullSignal, pullRx)
  },

  subscriptionRef(this: RxRuntime<any, any>, ref: any) {
    return makeSubRef(
      readable((get) => {
        const previous = get.self<Result.Result<any, any>>()
        const runtimeResult = get(this)
        if (runtimeResult._tag !== "Success") {
          return Result.replacePrevious(runtimeResult, previous)
        }
        const value = typeof ref === "function" ? ref(get) : ref
        return SubscriptionRef.SubscriptionRefTypeId in value
          ? value
          : makeEffect(get, value, Result.initial(true), runtimeResult.value)
      }),
      (get, ref) => {
        const runtime = Result.getOrThrow(get(this))
        return readSubscribable(get, ref, runtime)
      }
    )
  },

  subscribable(this: RxRuntime<any, any>, arg: any) {
    return makeSubscribable(
      readable((get) => {
        const previous = get.self<Result.Result<any, any>>()
        const runtimeResult = get(this)
        if (runtimeResult._tag !== "Success") {
          return Result.replacePrevious(runtimeResult, previous)
        }
        const value = typeof arg === "function" ? arg(get) : arg
        return Subscribable.isSubscribable(value) ?
          value as Subscribable.Subscribable<any, any>
          : makeEffect(get, value, Result.initial(true), runtimeResult.value)
      }),
      (get, ref) => {
        const runtime = Result.getOrThrow(get(this))
        return readSubscribable(get, ref, runtime)
      }
    )
  }
}

const makeFnRuntime = (self: RxRuntime<any, any>, arg: any, options?: { readonly initialValue?: unknown }) => {
  const [read, write, argRx] = makeResultFn(arg, options)
  return writable((get) => {
    get.get(argRx)
    const previous = get.self<Result.Result<any, any>>()
    const runtimeResult = get.get(self)
    if (runtimeResult._tag !== "Success") {
      return Result.replacePrevious(runtimeResult, previous)
    }
    return read(get, runtimeResult.value)
  }, write)
}

const WritableProto = {
  ...RxProto,
  [WritableTypeId]: WritableTypeId
} as const

/**
 * @since 1.0.0
 * @category refinements
 */
export const isWritable = <R, W>(rx: Rx<R>): rx is Writable<R, W> => WritableTypeId in rx

/**
 * @since 1.0.0
 * @category constructors
 */
export const readable = <A>(
  read: (get: Context) => A,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
): Rx<A> => {
  const rx = Object.create(RxProto)
  rx.keepAlive = false
  rx.lazy = true
  rx.read = read
  rx.refresh = refresh
  return rx
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const writable = <R, W>(
  read: (get: Context) => R,
  write: (ctx: WriteContext<R>, value: W) => void,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
): Writable<R, W> => {
  const rx = Object.create(WritableProto)
  rx.keepAlive = false
  rx.lazy = true
  rx.read = read
  rx.write = write
  rx.refresh = refresh
  return rx
}

function constSetSelf<A>(ctx: WriteContext<A>, value: A) {
  ctx.setSelf(value)
}

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category constructors
 */
export const make: {
  <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(create: (get: Context) => Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(stream: Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A>(create: (get: Context) => A): Rx<A>
  <A>(initialValue: A): Writable<A>
} = (arg: any, options?: { readonly initialValue?: unknown }) => {
  const readOrRx = makeRead(arg, options)
  if (TypeId in readOrRx) {
    return readOrRx as any
  }
  return readable(readOrRx)
}

// -----------------------------------------------------------------------------
// constructors - effect
// -----------------------------------------------------------------------------

const isDataType = (u: object): u is Option.Option<unknown> | Either.Either<unknown, unknown> =>
  Option.TypeId in u ||
  Either.TypeId in u

const makeRead: {
  <A, E>(effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): (get: Context, runtime?: Runtime.Runtime<any>) => Result.Result<A, E>
  <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): (get: Context, runtime?: Runtime.Runtime<any>) => Result.Result<A, E>
  <A, E>(stream: Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): (get: Context, runtime?: Runtime.Runtime<any>) => Result.Result<A, E>
  <A, E>(create: (get: Context) => Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): (get: Context, runtime?: Runtime.Runtime<any>) => Result.Result<A, E>
  <A>(create: (get: Context) => A): (get: Context, runtime?: Runtime.Runtime<any>) => A
  <A>(initialValue: A): Writable<A>
} = <A, E>(
  arg:
    | Effect.Effect<A, E, Scope.Scope | RxRegistry>
    | ((get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>)
    | Stream.Stream<A, E, RxRegistry>
    | ((get: Context) => Stream.Stream<A, E, RxRegistry>)
    | ((get: Context) => A)
    | A,
  options?: { readonly initialValue?: unknown }
) => {
  if (typeof arg === "function") {
    const create = arg as (get: Context) => any
    return function(get: Context, providedRuntime?: Runtime.Runtime<any>) {
      const value = create(get)
      if (typeof value === "object" && value !== null) {
        if (isDataType(value)) {
          return value
        } else if (Effect.EffectTypeId in value) {
          return effect(get, value as any, options, providedRuntime)
        } else if (Stream.StreamTypeId in value) {
          return stream(get, value, options, providedRuntime)
        }
      }
      return value
    }
  } else if (typeof arg === "object" && arg !== null) {
    if (isDataType(arg)) {
      return state(arg)
    } else if (Effect.EffectTypeId in arg) {
      return function(get: Context, providedRuntime?: Runtime.Runtime<any>) {
        return effect(get, arg, options, providedRuntime)
      }
    } else if (Stream.StreamTypeId in arg) {
      return function(get: Context, providedRuntime?: Runtime.Runtime<any>) {
        return stream(get, arg, options, providedRuntime)
      }
    }
  }

  return state(arg) as any
}

const state = <A>(
  initialValue: A
): Writable<A> =>
  writable(function(_get) {
    return initialValue
  }, constSetSelf)

const effect = <A, E>(
  get: Context,
  effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>,
  options?: { readonly initialValue?: A; readonly uninterruptible?: boolean },
  runtime?: Runtime.Runtime<any>
): Result.Result<A, E> => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<A, E>(options.initialValue)
    : Result.initial<A, E>()
  return makeEffect(get, effect, initialValue, runtime, options?.uninterruptible)
}

function makeEffect<A, E>(
  ctx: Context,
  effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>,
  initialValue: Result.Result<A, E>,
  runtime = Runtime.defaultRuntime,
  uninterruptible = false
): Result.Result<A, E> {
  const previous = ctx.self<Result.Result<A, E>>()

  const scope = Effect.runSync(Scope.make())
  ctx.addFinalizer(() => {
    Effect.runFork(Scope.close(scope, Exit.void))
  })
  const contextMap = new Map(runtime.context.unsafeMap)
  contextMap.set(Scope.Scope.key, scope)
  contextMap.set(RxRegistry.key, ctx.registry)
  const scopedRuntime = Runtime.make({
    context: EffectContext.unsafeMake(contextMap),
    fiberRefs: runtime.fiberRefs,
    runtimeFlags: runtime.runtimeFlags
  })
  let syncResult: Result.Result<A, E> | undefined
  let isAsync = false
  const cancel = runCallbackSync(scopedRuntime)(
    effect,
    function(exit) {
      syncResult = Result.fromExitWithPrevious(exit, previous)
      if (isAsync) ctx.setSelf(syncResult)
    },
    uninterruptible
  )
  isAsync = true
  if (cancel !== undefined) {
    ctx.addFinalizer(cancel)
  }
  if (syncResult !== undefined) {
    return syncResult
  } else if (previous._tag === "Some") {
    return Result.waitingFrom(previous)
  }
  return Result.waiting(initialValue)
}

// -----------------------------------------------------------------------------
// context
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export interface RxRuntime<R, ER> extends Rx<Result.Result<Runtime.Runtime<R>, ER>> {
  readonly layer: Rx<Layer.Layer<R, ER>>

  readonly rx: {
    <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | R | RxRegistry>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(effect: Effect.Effect<A, E, Scope.Scope | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(create: (get: Context) => Stream.Stream<A, E, RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(stream: Stream.Stream<A, E, RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
  }

  readonly fn: {
    <Arg>(): {
      <E, A>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | RxRegistry | R>, options?: {
        readonly initialValue?: A
      }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER>
      <E, A>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, RxRegistry | R>, options?: {
        readonly initialValue?: A
      }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER | NoSuchElementException>
    }
    <Arg, E, A>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER>
    <Arg, E, A>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER | NoSuchElementException>
  }

  readonly pull: <A, E>(
    create: ((get: Context) => Stream.Stream<A, E, R | RxRegistry>) | Stream.Stream<A, E, R | RxRegistry>,
    options?: {
      readonly disableAccumulation?: boolean
      readonly initialValue?: ReadonlyArray<A>
    }
  ) => Writable<PullResult<A, E | ER>, void>

  readonly subscriptionRef: <A, E>(
    create:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R | RxRegistry>
      | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R | RxRegistry>)
  ) => Writable<Result.Result<A, E>, A>

  readonly subscribable: <A, E, E1 = never>(
    create:
      | Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R | RxRegistry>
      | ((get: Context) => Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R | RxRegistry>)
  ) => Rx<Result.Result<A, E | E1>>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface RuntimeFactory {
  <R, E>(create: Layer.Layer<R, E, RxRegistry> | ((get: Context) => Layer.Layer<R, E, RxRegistry>)): RxRuntime<R, E>
  readonly memoMap: Layer.MemoMap
  readonly addGlobalLayer: <A, E>(layer: Layer.Layer<A, E, RxRegistry>) => void
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const context: (options?: {
  readonly memoMap?: Layer.MemoMap | undefined
}) => RuntimeFactory = (options) => {
  const memoMap = options?.memoMap ?? Effect.runSync(Layer.makeMemoMap)
  let globalLayer: Layer.Layer<any, any, RxRegistry> | undefined
  function factory<E, R>(
    create: Layer.Layer<R, E, RxRegistry> | ((get: Context) => Layer.Layer<R, E, RxRegistry>)
  ): RxRuntime<R, E> {
    const rx = Object.create(RxRuntimeProto)
    rx.keepAlive = false
    rx.lazy = true
    rx.refresh = undefined

    const layerRx = keepAlive(
      typeof create === "function"
        ? readable((get) => globalLayer ? Layer.provideMerge(create(get), globalLayer) : create(get))
        : readable(() => globalLayer ? Layer.provideMerge(create, globalLayer) : create)
    )
    rx.layer = layerRx

    rx.read = function read(get: Context) {
      const layer = get(layerRx)
      const build = Effect.flatMap(
        Effect.flatMap(Effect.scope, (scope) => Layer.buildWithMemoMap(layer, memoMap, scope)),
        (context) => Effect.provide(Effect.runtime<R>(), context)
      )
      return effect(get, build, { uninterruptible: true })
    }

    return rx
  }
  factory.memoMap = memoMap
  factory.addGlobalLayer = (layer: Layer.Layer<any, any, RxRegistry>) => {
    if (globalLayer === undefined) {
      globalLayer = layer
    } else {
      globalLayer = Layer.provideMerge(globalLayer, layer)
    }
  }
  return factory
}

/**
 * @since 1.0.0
 * @category context
 */
export const defaultMemoMap: Layer.MemoMap = globalValue(
  "@effect-rx/rx/Rx/defaultMemoMap",
  () => Effect.runSync(Layer.makeMemoMap)
)

/**
 * @since 1.0.0
 * @category context
 */
export const runtime: RuntimeFactory = globalValue(
  "@effect-rx/rx/Rx/defaultContext",
  () => context({ memoMap: defaultMemoMap })
)

// -----------------------------------------------------------------------------
// constructors - stream
// -----------------------------------------------------------------------------

const stream = <A, E>(
  get: Context,
  stream: Stream.Stream<A, E, RxRegistry>,
  options?: { readonly initialValue?: A },
  runtime?: Runtime.Runtime<any>
): Result.Result<A, E | NoSuchElementException> => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<A, E>(options.initialValue)
    : Result.initial<A, E>()
  return makeStream(get, stream, initialValue, runtime)
}

function makeStream<A, E>(
  ctx: Context,
  stream: Stream.Stream<A, E, RxRegistry>,
  initialValue: Result.Result<A, E | NoSuchElementException>,
  runtime = Runtime.defaultRuntime
): Result.Result<A, E | NoSuchElementException> {
  const previous = ctx.self<Result.Result<A, E | NoSuchElementException>>()

  const writer: Channel.Channel<never, Chunk.Chunk<A>, never, E> = Channel.readWithCause({
    onInput(input: Chunk.Chunk<A>) {
      return Channel.suspend(() => {
        const last = Chunk.last(input)
        if (last._tag === "Some") {
          ctx.setSelf(Result.success(last.value, true))
        }
        return writer
      })
    },
    onFailure(cause: Cause.Cause<E>) {
      return Channel.sync(() => {
        ctx.setSelf(Result.failureWithPrevious(cause, previous))
      })
    },
    onDone(_done: unknown) {
      return Channel.sync(() => {
        pipe(
          ctx.self<Result.Result<A, E | NoSuchElementException>>(),
          Option.flatMap(Result.value),
          Option.match({
            onNone: () => ctx.setSelf(Result.failWithPrevious(new NoSuchElementException(), previous)),
            onSome: (a) => ctx.setSelf(Result.success(a))
          })
        )
      })
    }
  })

  const registryRuntime = Runtime.make({
    context: EffectContext.add(runtime.context, RxRegistry, ctx.registry),
    fiberRefs: runtime.fiberRefs,
    runtimeFlags: runtime.runtimeFlags
  })

  const cancel = runCallbackSync(registryRuntime)(
    Channel.runDrain(Channel.pipeTo(Stream.toChannel(stream), writer)),
    constVoid
  )
  if (cancel !== undefined) {
    ctx.addFinalizer(cancel)
  }

  if (previous._tag === "Some") {
    return Result.waitingFrom(previous)
  }
  return Result.waiting(initialValue)
}

// -----------------------------------------------------------------------------
// constructors - subscription ref
// -----------------------------------------------------------------------------

/** @internal */
const readSubscribable = (
  get: Context,
  sub:
    | Subscribable.Subscribable<any, any>
    | Result.Result<Subscribable.Subscribable<any, any>, any>,
  runtime = Runtime.defaultRuntime
) => {
  if (Subscribable.TypeId in sub) {
    get.addFinalizer(
      sub.changes.pipe(
        Stream.runForEach((value) => {
          get.setSelf(value)
          return Effect.void
        }),
        Runtime.runCallback(runtime)
      )
    )
    return Runtime.runSync(runtime)(sub.get)
  } else if (sub._tag !== "Success") {
    return sub
  }
  return makeStream(get, sub.value.changes, Result.initial(true), runtime)
}

const makeSubRef = (
  refRx: Rx<SubscriptionRef.SubscriptionRef<any> | Result.Result<SubscriptionRef.SubscriptionRef<any>, any>>,
  read: (
    get: Context,
    ref: SubscriptionRef.SubscriptionRef<any> | Result.Success<SubscriptionRef.SubscriptionRef<any>, any>
  ) => any
) => {
  function write(ctx: WriteContext<SubscriptionRef.SubscriptionRef<any>>, value: any) {
    const ref = ctx.get(refRx)
    if (SubscriptionRef.SubscriptionRefTypeId in ref) {
      Effect.runSync(SubscriptionRef.set(ref, value))
    } else if (Result.isSuccess(ref)) {
      Effect.runSync(SubscriptionRef.set(ref.value, value))
    }
  }
  return writable((get) => {
    const ref = get(refRx)
    if (SubscriptionRef.SubscriptionRefTypeId in ref) {
      return read(get, ref)
    } else if (Result.isSuccess(ref)) {
      return read(get, ref)
    }
    return ref
  }, write)
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const subscriptionRef: {
  <A>(ref: SubscriptionRef.SubscriptionRef<A> | ((get: Context) => SubscriptionRef.SubscriptionRef<A>)): Writable<A>
  <A, E>(
    effect:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | RxRegistry>
      | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | RxRegistry>)
  ): Writable<Result.Result<A, E>, A>
} = (
  ref:
    | SubscriptionRef.SubscriptionRef<any>
    | ((get: Context) => SubscriptionRef.SubscriptionRef<any>)
    | Effect.Effect<SubscriptionRef.SubscriptionRef<any>, any, Scope.Scope | RxRegistry>
    | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<any>, any, Scope.Scope | RxRegistry>)
) =>
  makeSubRef(
    readable((get) => {
      const value = typeof ref === "function" ? ref(get) : ref
      return SubscriptionRef.SubscriptionRefTypeId in value
        ? value
        : makeEffect(get, value, Result.initial(true))
    }),
    readSubscribable
  )

// -----------------------------------------------------------------------------
// constructors - subscribable
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category constructors
 */
export const subscribable: {
  <A, E>(
    ref: Subscribable.Subscribable<A, E> | ((get: Context) => Subscribable.Subscribable<A, E>)
  ): Rx<A>
  <A, E, E1>(
    effect:
      | Effect.Effect<Subscribable.Subscribable<A, E1>, E, Scope.Scope | RxRegistry>
      | ((get: Context) => Effect.Effect<Subscribable.Subscribable<A, E1>, E, Scope.Scope | RxRegistry>)
  ): Rx<Result.Result<A, E | E1>>
} = (
  ref:
    | Subscribable.Subscribable<any, any>
    | ((get: Context) => Subscribable.Subscribable<any, any>)
    | Effect.Effect<Subscribable.Subscribable<any, any>, any, Scope.Scope | RxRegistry>
    | ((get: Context) => Effect.Effect<Subscribable.Subscribable<any, any>, any, Scope.Scope | RxRegistry>)
) =>
  makeSubscribable(
    readable((get) => {
      const value = typeof ref === "function" ? ref(get) : ref
      return Subscribable.isSubscribable(value)
        ? value
        : makeEffect(get, value, Result.initial(true))
    }),
    readSubscribable
  )

const makeSubscribable = (
  subRx: Rx<Subscribable.Subscribable<any, any> | Result.Result<Subscribable.Subscribable<any, any>, any>>,
  read: (
    get: Context,
    sub: Subscribable.Subscribable<any, any> | Result.Success<Subscribable.Subscribable<any, any>, any>
  ) => any
) =>
  readable((get) => {
    const sub = get(subRx)
    if (Subscribable.isSubscribable(sub)) {
      return read(get, sub)
    } else if (Result.isSuccess(sub)) {
      return read(get, sub)
    }
    return sub
  })

// -----------------------------------------------------------------------------
// constructors - functions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export interface FnContext extends Omit<Context, "get" | "once" | "resultOnce" | "someOnce" | "refreshSelf"> {
  <A>(rx: Rx<A>): A
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fnSync: {
  <Arg>(): {
    <A>(
      f: (arg: Arg, get: FnContext) => A
    ): Writable<Option.Option<A>, RxResultFn.ArgToVoid<Arg>>
    <A>(
      f: (arg: Arg, get: FnContext) => A,
      options: { readonly initialValue: A }
    ): Writable<A, RxResultFn.ArgToVoid<Arg>>
  }
  <Arg, A>(
    f: (arg: Arg, get: FnContext) => A
  ): Writable<Option.Option<A>, RxResultFn.ArgToVoid<Arg>>
  <Arg, A>(
    f: (arg: Arg, get: FnContext) => A,
    options: { readonly initialValue: A }
  ): Writable<A, RxResultFn.ArgToVoid<Arg>>
} = function(...args: ReadonlyArray<any>) {
  if (args.length === 0) {
    return makeFnSync
  }
  return makeFnSync(...args as [any, any]) as any
}

const makeFnSync = <Arg, A>(f: (arg: Arg, get: FnContext) => A, options?: {
  readonly initialValue?: A
}): Writable<Option.Option<A> | A, RxResultFn.ArgToVoid<Arg>> => {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const hasInitialValue = options?.initialValue !== undefined
  return writable(function(get) {
    ;(get as any).isFn = true
    const [counter, arg] = get.get(argRx)
    if (counter === 0) {
      return hasInitialValue ? options.initialValue : Option.none()
    }
    return hasInitialValue ? f(arg, get) : Option.some(f(arg, get))
  }, function(ctx, arg) {
    batch(() => {
      ctx.set(argRx, [ctx.get(argRx)[0] + 1, arg as Arg])
      ctx.refreshSelf()
    })
  })
}

/**
 * @since 1.0.0
 * @category models
 */
export interface RxResultFn<Arg, A, E = never> extends Writable<Result.Result<A, E>, Arg | Reset> {}

/**
 * @since 1.0.0
 */
export declare namespace RxResultFn {
  /**
   * @since 1.0.0
   */
  export type ArgToVoid<Arg> = Arg extends infer A ? unknown extends A ? void : A extends undefined ? void : A : never
}

/**
 * @since 1.0.0
 * @category symbols
 */
export const Reset = Symbol.for("@effect-rx/rx/Rx/Reset")

/**
 * @since 1.0.0
 * @category symbols
 */
export type Reset = typeof Reset

/**
 * @since 1.0.0
 * @category constructors
 */
export const fn: {
  <Arg>(): <E, A>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }) => RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E>
  <Arg, E, A>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E>
  <Arg>(): <E, A>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }) => RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException>
  <Arg, E, A>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException>
} = function(...args: ReadonlyArray<any>) {
  if (args.length === 0) {
    return makeFn
  }
  return makeFn(...args as [any, any]) as any
}

const makeFn = <Arg, E, A>(
  f: (arg: Arg, get: FnContext) => Stream.Stream<A, E, RxRegistry> | Effect.Effect<A, E, Scope.Scope | RxRegistry>,
  options?: {
    readonly initialValue?: A
  }
): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException> => {
  const [read, write] = makeResultFn(f, options)
  return writable(read, write) as any
}

function makeResultFn<Arg, E, A>(
  f: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | RxRegistry> | Stream.Stream<A, E, RxRegistry>,
  options?: { readonly initialValue?: A }
) {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const initialValue = options?.initialValue !== undefined
    ? Result.success<A, E>(options.initialValue)
    : Result.initial<A, E>()

  function read(get: Context, runtime?: Runtime.Runtime<any>): Result.Result<A, E | NoSuchElementException> {
    ;(get as any).isFn = true
    const [counter, arg] = get.get(argRx)
    if (counter === 0) {
      return initialValue
    }
    const value = f(arg, get)
    if (Effect.EffectTypeId in value) {
      return makeEffect(get, value, initialValue, runtime)
    }
    return makeStream(get, value, initialValue, runtime)
  }
  function write(ctx: WriteContext<Result.Result<A, E | NoSuchElementException>>, arg: Arg | Reset) {
    batch(() => {
      if (arg === Reset) {
        ctx.set(argRx, [0, undefined as any])
      } else {
        ctx.set(argRx, [ctx.get(argRx)[0] + 1, arg])
      }
      ctx.refreshSelf()
    })
  }
  return [read, write, argRx] as const
}

/**
 * @since 1.0.0
 * @category models
 */
export type PullResult<A, E = never> = Result.Result<{
  readonly done: boolean
  readonly items: ReadonlyArray<A>
}, E>

/**
 * @since 1.0.0
 * @category constructors
 */
export const pull = <A, E>(
  create: ((get: Context) => Stream.Stream<A, E, RxRegistry>) | Stream.Stream<A, E, RxRegistry>,
  options?: {
    readonly disableAccumulation?: boolean
  }
): Writable<PullResult<A, E>, void> => {
  const pullSignal = state(0)
  const pullRx = readable(
    makeRead(function(get) {
      return makeStreamPullEffect(get, pullSignal, create, options)
    })
  )
  return makeStreamPull(pullSignal, pullRx)
}

const makeStreamPullEffect = <A, E>(
  get: Context,
  pullSignal: Rx<number>,
  create: Stream.Stream<A, E, RxRegistry> | ((get: Context) => Stream.Stream<A, E, RxRegistry>),
  options?: {
    readonly disableAccumulation?: boolean
  }
): Effect.Effect<
  { readonly done: boolean; readonly items: Array<A> },
  E,
  Scope.Scope | RxRegistry
> =>
  Effect.flatMap(
    Channel.toPull(
      Stream.toChannel(typeof create === "function" ? create(get) : create)
    ),
    (pullChunk) => {
      const semaphore = Effect.unsafeMakeSemaphore(1)
      const fiber = Option.getOrThrow(Fiber.getCurrentFiber())
      const context = fiber.currentContext as EffectContext.Context<RxRegistry | Scope.Scope>
      let acc = Chunk.empty<A>()
      const pull = semaphore.withPermits(1)(Effect.flatMap(
        Effect.locally(
          Effect.suspend(() => {
            return pullChunk
          }),
          FiberRef.currentContext,
          context
        ),
        Either.match({
          onLeft: () =>
            Effect.succeed({
              done: true,
              items: Chunk.toReadonlyArray(acc) as Array<A>
            }),
          onRight(chunk) {
            let items: Chunk.Chunk<A>
            if (options?.disableAccumulation) {
              items = chunk
            } else {
              items = Chunk.appendAll(acc, chunk)
              acc = items
            }
            return Effect.succeed({
              done: false,
              items: Chunk.toReadonlyArray(items) as Array<A>
            })
          }
        })
      ))

      const runCallback = runCallbackSync(Runtime.make({
        context,
        fiberRefs: fiber.getFiberRefs(),
        runtimeFlags: Runtime.defaultRuntime.runtimeFlags
      }))
      const cancels = new Set<() => void>()
      get.addFinalizer(() => {
        for (const cancel of cancels) cancel()
      })
      get.once(pullSignal)
      get.subscribe(pullSignal, () => {
        get.setSelf(Result.waitingFrom(get.self<PullResult<A, E>>()))
        let cancel: (() => void) | undefined
        // eslint-disable-next-line prefer-const
        cancel = runCallback(pull, (exit) => {
          if (cancel) cancels.delete(cancel)
          const result = Result.fromExitWithPrevious(exit, get.self())
          const pending = cancels.size > 0
          get.setSelf(pending ? Result.waiting(result) : result)
        })
        if (cancel) cancels.add(cancel)
      })

      return pull
    }
  )

const makeStreamPull = <A, E>(
  pullSignal: Writable<number>,
  pullRx: Rx<PullResult<A, E>>
) =>
  writable(pullRx.read, function(ctx, _) {
    ctx.set(pullSignal, ctx.get(pullSignal) + 1)
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const family = typeof WeakRef === "undefined" || typeof FinalizationRegistry === "undefined" ?
  <Arg, T extends object>(
    f: (arg: Arg) => T
  ): (arg: Arg) => T => {
    const atoms = MutableHashMap.empty<Arg, T>()
    return function(arg) {
      const atomEntry = MutableHashMap.get(atoms, arg)
      if (atomEntry._tag === "Some") {
        return atomEntry.value
      }
      const newAtom = f(arg)
      MutableHashMap.set(atoms, arg, newAtom)
      return newAtom
    }
  } :
  <Arg, T extends object>(
    f: (arg: Arg) => T
  ): (arg: Arg) => T => {
    const atoms = MutableHashMap.empty<Arg, WeakRef<T>>()
    const registry = new FinalizationRegistry<Arg>((arg) => {
      MutableHashMap.remove(atoms, arg)
    })
    return function(arg) {
      const atomEntry = MutableHashMap.get(atoms, arg).pipe(
        Option.flatMapNullable((ref) => ref.deref())
      )

      if (atomEntry._tag === "Some") {
        return atomEntry.value
      }
      const newAtom = f(arg)
      MutableHashMap.set(atoms, arg, new WeakRef(newAtom))
      registry.register(newAtom, arg)
      return newAtom
    }
  }

/**
 * @since 1.0.0
 * @category combinators
 */
export const withFallback: {
  <E2, A2>(
    fallback: Rx<Result.Result<A2, E2>>
  ): <R extends Rx<Result.Result<any, any>>>(
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>, RW>
    : Rx<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>>
  <R extends Rx<Result.Result<any, any>>, A2, E2>(
    self: R,
    fallback: Rx<Result.Result<A2, E2>>
  ): [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>, RW>
    : Rx<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>>
} = dual(2, <R extends Rx<Result.Result<any, any>>, A2, E2>(
  self: R,
  fallback: Rx<Result.Result<A2, E2>>
): [R] extends [Writable<infer _, infer RW>]
  ? Writable<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>, RW>
  : Rx<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>> =>
{
  function withFallback(get: Context) {
    const result = get(self)
    if (result._tag === "Initial") {
      return Result.waiting(get(fallback))
    }
    return result
  }
  return isWritable(self)
    ? writable(
      withFallback,
      self.write,
      self.refresh ?? function(refresh) {
        refresh(self)
      }
    ) as any
    : readable(
      withFallback,
      self.refresh ?? function(refresh) {
        refresh(self)
      }
    ) as any
})

/**
 * @since 1.0.0
 * @category combinators
 */
export const keepAlive = <A extends Rx<any>>(self: A): A =>
  Object.assign(Object.create(Object.getPrototypeOf(self)), {
    ...self,
    keepAlive: true
  })

/**
 * @since 1.0.0
 * @category combinators
 */
export const setLazy: {
  (lazy: boolean): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, lazy: boolean): A
} = dual(2, <A extends Rx<any>>(self: A, lazy: boolean) =>
  Object.assign(Object.create(Object.getPrototypeOf(self)), {
    ...self,
    lazy
  }))

/**
 * @since 1.0.0
 * @category combinators
 */
export const refreshable = <T extends Rx<any>>(
  self: T
): T & Refreshable =>
  Object.assign(Object.create(Object.getPrototypeOf(self)), {
    ...self,
    [RefreshableTypeId]: RefreshableTypeId
  })

/**
 * @since 1.0.0
 * @category combinators
 */
export const withLabel: {
  (name: string): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, name: string): A
} = dual<
  (name: string) => <A extends Rx<any>>(self: A) => A,
  <A extends Rx<any>>(self: A, name: string) => A
>(2, (self, name) =>
  Object.assign(Object.create(Object.getPrototypeOf(self)), {
    ...self,
    label: [name, new Error().stack?.split("\n")[5] ?? ""]
  }))

/**
 * @since 1.0.0
 * @category combinators
 */
export const setIdleTTL: {
  (duration: Duration.DurationInput): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, duration: Duration.DurationInput): A
} = dual<
  (duration: Duration.DurationInput) => <A extends Rx<any>>(self: A) => A,
  <A extends Rx<any>>(self: A, duration: Duration.DurationInput) => A
>(2, (self, duration) =>
  Object.assign(Object.create(Object.getPrototypeOf(self)), {
    ...self,
    keepAlive: false,
    idleTTL: Duration.toMillis(duration)
  }))

/**
 * @since 1.0.0
 * @category combinators
 */
export const initialValue: {
  <A>(initialValue: A): (self: Rx<A>) => readonly [Rx<A>, A]
  <A>(self: Rx<A>, initialValue: A): readonly [Rx<A>, A]
} = dual<
  <A>(initialValue: A) => (self: Rx<A>) => readonly [Rx<A>, A],
  <A>(self: Rx<A>, initialValue: A) => readonly [Rx<A>, A]
>(2, (self, initialValue) => [self, initialValue])

/**
 * @since 1.0.0
 * @category combinators
 */
export const transform: {
  <R extends Rx<any>, B>(
    f: (get: Context) => B
  ): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
  <R extends Rx<any>, B>(
    self: R,
    f: (get: Context) => B
  ): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
} = dual(
  2,
  (<A, B>(self: Rx<A>, f: (get: Context) => B): Rx<B> =>
    isWritable(self)
      ? writable(
        f,
        function(ctx, value) {
          ctx.set(self, value)
        },
        self.refresh ?? function(refresh) {
          refresh(self)
        }
      )
      : readable(
        f,
        self.refresh ?? function(refresh) {
          refresh(self)
        }
      )) as any
)

/**
 * @since 1.0.0
 * @category combinators
 */
export const map: {
  <R extends Rx<any>, B>(
    f: (_: Rx.Infer<R>) => B
  ): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
  <R extends Rx<any>, B>(
    self: R,
    f: (_: Rx.Infer<R>) => B
  ): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
} = dual(
  2,
  <A, B>(self: Rx<A>, f: (_: A) => B): Rx<B> => transform(self, (get) => f(get(self)))
)

/**
 * @since 1.0.0
 * @category combinators
 */
export const mapResult: {
  <R extends Rx<Result.Result<any, any>>, B>(
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ): (
    self: R
  ) => [R] extends [Writable<infer _, infer RW>] ? Writable<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>>
  <R extends Rx<Result.Result<any, any>>, B>(
    self: R,
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ): [R] extends [Writable<infer _, infer RW>] ? Writable<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>>
} = dual(2, <R extends Rx<Result.Result<any, any>>, B>(
  self: R,
  f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
): [R] extends [Writable<infer _, infer RW>] ? Writable<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>, RW>
  : Rx<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>> => map(self, Result.map(f)))

/**
 * @since 1.0.0
 * @category combinators
 */
export const debounce: {
  (duration: Duration.DurationInput): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, duration: Duration.DurationInput): A
} = dual(
  2,
  <A>(self: Rx<A>, duration: Duration.DurationInput): Rx<A> => {
    const millis = Duration.toMillis(duration)
    return transform(self, function(get) {
      let timeout: number | undefined
      let value = get.once(self)
      function update() {
        timeout = undefined
        get.setSelf(value)
      }
      get.addFinalizer(function() {
        if (timeout) clearTimeout(timeout)
      })
      get.subscribe(self, function(val) {
        value = val
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(update, millis)
      })
      return value
    })
  }
)

/**
 * @since 1.0.0
 * @category batching
 */
export const batch: (f: () => void) => void = internalRegistry.batch

// -----------------------------------------------------------------------------
// KeyValueStore
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category KeyValueStore
 */
export const kvs = <A>(options: {
  readonly runtime: RxRuntime<KeyValueStore.KeyValueStore, any>
  readonly key: string
  readonly schema: Schema.Schema<A, any>
  readonly defaultValue: LazyArg<A>
}): Writable<A> => {
  const setRx = options.runtime.fn(
    Effect.fnUntraced(function*(value: A) {
      const store = (yield* KeyValueStore.KeyValueStore).forSchema(
        options.schema
      )
      yield* store.set(options.key, value)
    })
  )
  const resultRx = options.runtime.rx(
    Effect.flatMap(
      KeyValueStore.KeyValueStore,
      (store) => Effect.flatten(store.forSchema(options.schema).get(options.key))
    )
  )
  return writable(
    (get) => {
      get.mount(setRx)
      return Result.getOrElse(get(resultRx), options.defaultValue)
    },
    (ctx, value: A) => {
      ctx.set(setRx, value as any)
      ctx.setSelf(value)
    }
  )
}

// -----------------------------------------------------------------------------
// URL search params
// -----------------------------------------------------------------------------

/**
 * Create an Rx that reads and writes a URL search parameter.
 *
 * Note: If you pass a schema, it has to be synchronous and have no context.
 *
 * @since 1.0.0
 * @category URL search params
 */
export const searchParam = <A = never, I extends string = never>(name: string, options?: {
  readonly schema?: Schema.Schema<A, I>
}): Writable<[A] extends [never] ? string : Option.Option<A>> => {
  const decode = options?.schema && Schema.decodeEither(options.schema)
  const encode = options?.schema && Schema.encodeEither(options.schema)
  return writable(
    (get) => {
      const handleUpdate = () => {
        if (searchParamState.updating) return
        const searchParams = new URLSearchParams(window.location.search)
        const newValue = searchParams.get(name) || ""
        if (decode) {
          get.setSelf(Either.getRight(decode(newValue as I)))
        } else if (newValue !== Option.getOrUndefined(get.self())) {
          get.setSelf(newValue)
        }
      }
      window.addEventListener("popstate", handleUpdate)
      window.addEventListener("pushstate", handleUpdate)
      get.addFinalizer(() => {
        window.removeEventListener("popstate", handleUpdate)
        window.removeEventListener("pushstate", handleUpdate)
      })
      const value = new URLSearchParams(window.location.search).get(name) || ""
      return decode ? Either.getRight(decode(value as I)) : value as any
    },
    (ctx, value: any) => {
      if (encode) {
        const encoded = Option.flatMap(value, (v) => Either.getRight(encode(v as A)))
        searchParamState.updates.set(name, Option.getOrElse(encoded, () => ""))
        value = Option.zipRight(encoded, value)
      } else {
        searchParamState.updates.set(name, value)
      }
      ctx.setSelf(value)
      if (searchParamState.timeout) {
        clearTimeout(searchParamState.timeout)
      }
      searchParamState.timeout = setTimeout(updateSearchParams, 500)
    }
  )
}

const searchParamState = {
  timeout: undefined as number | undefined,
  updates: new Map<string, string>(),
  updating: false
}

function updateSearchParams() {
  searchParamState.timeout = undefined
  searchParamState.updating = true
  const searchParams = new URLSearchParams(window.location.search)
  for (const [key, value] of searchParamState.updates.entries()) {
    if (value.length > 0) {
      searchParams.set(key, value)
    } else {
      searchParams.delete(key)
    }
  }
  searchParamState.updates.clear()
  const newUrl = `${window.location.pathname}?${searchParams.toString()}`
  window.history.pushState({}, "", newUrl)
  searchParamState.updating = false
}

// -----------------------------------------------------------------------------
// conversions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStream = <A>(self: Rx<A>): Stream.Stream<A, never, RxRegistry> =>
  Stream.unwrap(Effect.map(RxRegistry, Registry.toStream(self)))

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStreamResult = <A, E>(self: Rx<Result.Result<A, E>>): Stream.Stream<A, E, RxRegistry> =>
  Stream.unwrap(Effect.map(RxRegistry, Registry.toStreamResult(self)))

/**
 * @since 1.0.0
 * @category Conversions
 */
export const get = <A>(self: Rx<A>): Effect.Effect<A, never, RxRegistry> => Effect.map(RxRegistry, (_) => _.get(self))

/**
 * @since 1.0.0
 * @category Conversions
 */
export const modify: {
  <R, W, A>(f: (_: R) => [returnValue: A, nextValue: W]): (self: Writable<R, W>) => Effect.Effect<A, never, RxRegistry>
  <R, W, A>(self: Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]): Effect.Effect<A, never, RxRegistry>
} = dual(
  2,
  <R, W, A>(self: Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]): Effect.Effect<A, never, RxRegistry> =>
    Effect.map(RxRegistry, (_) => _.modify(self, f))
)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const set: {
  <W>(value: W): <R>(self: Writable<R, W>) => Effect.Effect<void, never, RxRegistry>
  <R, W>(self: Writable<R, W>, value: W): Effect.Effect<void, never, RxRegistry>
} = dual(
  2,
  <R, W>(self: Writable<R, W>, value: W): Effect.Effect<void, never, RxRegistry> =>
    Effect.map(RxRegistry, (_) => _.set(self, value))
)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const update: {
  <R, W>(f: (_: R) => W): (self: Writable<R, W>) => Effect.Effect<void, never, RxRegistry>
  <R, W>(self: Writable<R, W>, f: (_: R) => W): Effect.Effect<void, never, RxRegistry>
} = dual(
  2,
  <R, W>(self: Writable<R, W>, f: (_: R) => W): Effect.Effect<void, never, RxRegistry> =>
    Effect.map(RxRegistry, (_) => _.update(self, f))
)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const getResult = <A, E>(
  self: Rx<Result.Result<A, E>>
): Effect.Effect<A, E, RxRegistry> => Effect.flatMap(RxRegistry, Registry.getResult(self))
