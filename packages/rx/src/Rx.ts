/**
 * @since 1.0.0
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as KeyValueStore from "@effect/platform/KeyValueStore"
import { NoSuchElementException } from "effect/Cause"
import * as Cause from "effect/Cause"
import * as Channel from "effect/Channel"
import * as Chunk from "effect/Chunk"
import * as EffectContext from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Exit from "effect/Exit"
import * as FiberRef from "effect/FiberRef"
import type { LazyArg } from "effect/Function"
import { constVoid, dual, pipe } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Inspectable from "effect/Inspectable"
import * as Layer from "effect/Layer"
import * as Mailbox from "effect/Mailbox"
import * as MutableHashMap from "effect/MutableHashMap"
import * as Option from "effect/Option"
import { type Pipeable, pipeArguments } from "effect/Pipeable"
import * as Runtime from "effect/Runtime"
import type * as Schema from "effect/Schema"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as Subscribable from "effect/Subscribable"
import * as SubscriptionRef from "effect/SubscriptionRef"
import * as internalRegistry from "./internal/registry.js"
import { runCallbackSync } from "./internal/runtime.js"
import type { Registry } from "./Registry.js"
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
  readonly refreshSync: <A>(rx: Rx<A> & Refreshable) => void
  readonly refresh: <A>(rx: Rx<A> & Refreshable) => Effect.Effect<void>
  readonly refreshSelfSync: () => void
  readonly refreshSelf: Effect.Effect<void>
  readonly self: <A>() => Option.Option<A>
  readonly setSelfSync: <A>(a: A) => void
  readonly setSelf: <A>(a: A) => Effect.Effect<void>
  readonly setSync: <R, W>(rx: Writable<R, W>, value: W) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<void>
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
  readonly registry: Registry
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
    const [read, write, argRx] = makeResultFn(arg, options)
    return writable((get) => {
      get(argRx)
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return read(get, runtimeResult.value)
    }, write)
  },

  pull(this: RxRuntime<any, any>, arg: any, options?: {
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<any>
  }) {
    const pullRx = readable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return makeEffect(
        get,
        makeStreamPullEffect(get, arg, options),
        Result.initial(true),
        runtimeResult.value
      )
    })
    return makeStreamPull(pullRx as any, options)
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
    return readable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      const value = typeof arg === "function" ? arg(get) : arg
      const sub = Subscribable.isSubscribable(value)
        ? value
        : makeEffect(get, value as any, Result.initial(true), runtimeResult.value)
      return readSubscribable(get, sub as any, runtimeResult.value)
    })
  }
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
  <A, E>(effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(stream: Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<A, E>>
  <A, E>(create: (get: Context) => Stream.Stream<A, E, RxRegistry>, options?: {
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
  const cancel = runCallbackSync(scopedRuntime)(
    effect,
    function(exit) {
      syncResult = Result.fromExitWithPrevious(exit, previous)
      ctx.setSelfSync(syncResult)
    },
    uninterruptible
  )
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
    <A, E>(effect: Effect.Effect<A, E, Scope.Scope | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | R | RxRegistry>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(stream: Stream.Stream<A, E, RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
    <A, E>(create: (get: Context) => Stream.Stream<A, E, RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<A, E | ER>>
  }

  readonly fn: {
    <Arg, E, A>(fn: (arg: Arg, get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry | R>, options?: {
      readonly initialValue?: A
    }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER>
    <Arg, E, A>(fn: (arg: Arg, get: Context) => Stream.Stream<A, E, RxRegistry | R>, options?: {
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
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const context: (options?: {
  readonly memoMap?: Layer.MemoMap | undefined
}) => RuntimeFactory = (options) => {
  const memoMap = options?.memoMap ?? Effect.runSync(Layer.makeMemoMap)
  function factory<E, R>(
    create: Layer.Layer<R, E, RxRegistry> | ((get: Context) => Layer.Layer<R, E, RxRegistry>)
  ): RxRuntime<R, E> {
    const rx = Object.create(RxRuntimeProto)
    rx.keepAlive = false
    rx.refresh = undefined

    const layerRx = keepAlive(typeof create === "function" ? readable(create) : readable(() => create))
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
          ctx.setSelfSync(Result.success(last.value, true))
        }
        return writer
      })
    },
    onFailure(cause: Cause.Cause<E>) {
      return Channel.sync(() => {
        ctx.setSelfSync(Result.failureWithPrevious(cause, previous))
      })
    },
    onDone(_done: unknown) {
      return Channel.sync(() => {
        pipe(
          ctx.self<Result.Result<A, E | NoSuchElementException>>(),
          Option.flatMap(Result.value),
          Option.match({
            onNone: () => ctx.setSelfSync(Result.failWithPrevious(new NoSuchElementException(), previous)),
            onSome: (a) => ctx.setSelfSync(Result.success(a))
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
        Stream.runForEach((value) => get.setSelf(value)),
        Effect.runCallback
      )
    )
    return Effect.runSync(sub.get)
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
  readable((get) => {
    const value = typeof ref === "function" ? ref(get) : ref
    const sub = Subscribable.isSubscribable(value)
      ? value
      : makeEffect(get, value, Result.initial(true))
    return readSubscribable(get, sub)
  })

// -----------------------------------------------------------------------------
// constructors - functions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category constructors
 */
export const fnSync: {
  <Arg, A>(
    f: (arg: Arg, get: Context) => A
  ): Writable<Option.Option<A>, RxResultFn.ArgToVoid<Arg>>
  <Arg, A>(
    f: (arg: Arg, get: Context) => A,
    options: { readonly initialValue: A }
  ): Writable<A, RxResultFn.ArgToVoid<Arg>>
} = <Arg, A>(f: (arg: Arg, get: Context) => A, options?: {
  readonly initialValue?: A
}): Writable<Option.Option<A> | A, RxResultFn.ArgToVoid<Arg>> => {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const hasInitialValue = options?.initialValue !== undefined
  return writable(function(get) {
    const [counter, arg] = get(argRx)
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
  <Arg, E, A>(fn: (arg: Arg, get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>, options?: {
    readonly initialValue?: A
  }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E>
  <Arg, E, A>(fn: (arg: Arg, get: Context) => Stream.Stream<A, E, RxRegistry>, options?: {
    readonly initialValue?: A
  }): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException>
} = <Arg, E, A>(
  f: (arg: Arg, get: Context) => Stream.Stream<A, E, RxRegistry> | Effect.Effect<A, E, Scope.Scope | RxRegistry>,
  options?: {
    readonly initialValue?: A
  }
): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException> => {
  const [read, write] = makeResultFn(f, options)
  return writable(read, write) as any
}

function makeResultFn<Arg, E, A>(
  f: (arg: Arg, get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry> | Stream.Stream<A, E, RxRegistry>,
  options?: { readonly initialValue?: A }
) {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const initialValue = options?.initialValue !== undefined
    ? Result.success<A, E>(options.initialValue)
    : Result.initial<A, E>()

  function read(get: Context, runtime?: Runtime.Runtime<any>): Result.Result<A, E | NoSuchElementException> {
    const [counter, arg] = get(argRx)
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
}, E | NoSuchElementException>

/**
 * @since 1.0.0
 * @category constructors
 */
export const pull = <A, E>(
  create: ((get: Context) => Stream.Stream<A, E, RxRegistry>) | Stream.Stream<A, E, RxRegistry>,
  options?: {
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<A>
  }
): Writable<PullResult<A, E>, void> => {
  const pullRx = readable(
    makeRead(function(get) {
      return makeStreamPullEffect(get, create, options)
    })
  )
  return makeStreamPull(pullRx, options)
}

const makeStreamPullEffect: <A, E>(
  get: Context,
  create: Stream.Stream<A, E, RxRegistry> | ((get: Context) => Stream.Stream<A, E, RxRegistry>),
  options?: { readonly disableAccumulation?: boolean } | undefined
) => Effect.Effect<
  Effect.Effect<{ readonly done: boolean; readonly items: Array<A> }, NoSuchElementException | E>,
  never,
  Scope.Scope | RxRegistry
> = Effect.fnUntraced(function*<A, E>(
  get: Context,
  create: Stream.Stream<A, E, RxRegistry> | ((get: Context) => Stream.Stream<A, E, RxRegistry>),
  options?: {
    readonly disableAccumulation?: boolean
  }
) {
  const stream = typeof create === "function" ? create(get) : create
  const pullChunk = yield* Stream.toPull(stream)
  let acc = Chunk.empty<A>()
  const context = yield* Effect.context<never>()
  const pull = Effect.matchCauseEffect(
    Effect.locally(
      pullChunk,
      FiberRef.currentContext,
      context
    ),
    {
      onSuccess(chunk) {
        let items: Chunk.Chunk<A>
        if (options?.disableAccumulation) {
          items = chunk
        } else {
          items = Chunk.appendAll(acc, chunk)
          acc = items
        }
        return Effect.succeed({
          done: false,
          items: Chunk.toReadonlyArray(items)
        })
      },
      onFailure(
        cause
      ): Effect.Effect<{ readonly done: boolean; readonly items: ReadonlyArray<A> }, NoSuchElementException | E> {
        const failure = Cause.failureOption(cause)
        if (failure._tag === "None") {
          return Effect.failCause(cause as Cause.Cause<never>)
        } else if (failure.value._tag === "None") {
          if (acc.length === 0) {
            return Effect.fail(new NoSuchElementException())
          }
          return Effect.succeed({
            done: true,
            items: Chunk.toReadonlyArray(acc)
          })
        }
        return Effect.fail(failure.value.value)
      }
    }
  )
  return pull as any
})

const makeStreamPull = <A, E>(
  pullRx: Rx<
    Result.Result<
      Effect.Effect<{ readonly done: boolean; readonly items: Array<A> }, NoSuchElementException | E>
    >
  >,
  options?: {
    readonly initialValue?: ReadonlyArray<A>
  }
) => {
  const initialValue: Result.Result<{
    readonly done: boolean
    readonly items: Array<A>
  }, E | NoSuchElementException> = options?.initialValue !== undefined
    ? Result.success({ done: false, items: options.initialValue as Array<A> })
    : Result.initial()

  return writable(function(get: Context): PullResult<A, E> {
    const previous = get.self<PullResult<A, E>>()
    const pullResult = get(pullRx)
    if (pullResult._tag !== "Success") {
      return Result.replacePrevious(pullResult, previous)
    }
    return makeEffect(get, pullResult.value, initialValue)
  }, function(ctx, _) {
    ctx.refreshSelf()
  }, function(refresh) {
    refresh(pullRx)
  })
}

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
        get.setSelfSync(value)
      }
      get.addFinalizer(function() {
        if (timeout) clearTimeout(timeout)
      })
      get.subscribe(self, function(val) {
        value = val
        if (timeout) return
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
 * @since 1.0.0
 * @category URL search params
 */
export const searchParam = (name: string): Writable<string> =>
  writable(
    (get) => {
      const searchParams = new URLSearchParams(window.location.search)
      const value = searchParams.get(name) || ""
      const handlePopState = () => {
        const searchParams = new URLSearchParams(window.location.search)
        const newValue = searchParams.get(name) || ""
        if (newValue !== value) {
          get.setSelfSync(newValue)
        }
      }
      window.addEventListener("popstate", handlePopState)
      get.addFinalizer(() => window.removeEventListener("popstate", handlePopState))
      return value
    },
    (ctx, value: string) => {
      searchParamState.updates.set(name, value)
      ctx.setSelf(value)
      if (!searchParamState.timeout) {
        searchParamState.timeout = setTimeout(updateSearchParams, 500)
      }
    }
  )

const searchParamState = {
  timeout: undefined as number | undefined,
  updates: new Map<string, string>()
}

function updateSearchParams() {
  searchParamState.timeout = undefined
  const searchParams = new URLSearchParams(window.location.search)
  for (const [key, value] of searchParamState.updates.entries()) {
    if (value) {
      searchParams.set(key, value)
    } else {
      searchParams.delete(key)
    }
  }
  searchParamState.updates.clear()
  const newUrl = `${window.location.pathname}?${searchParams.toString()}`
  window.history.pushState({}, "", newUrl)
}

// -----------------------------------------------------------------------------
// conversions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStream: <A>(self: Rx<A>) => Stream.Stream<
  A,
  never,
  RxRegistry
> = Effect.fnUntraced(function*<A>(self: Rx<A>) {
  const context = yield* Effect.context<RxRegistry | Scope.Scope>()
  const registry = EffectContext.get(context, RxRegistry)
  const scope = EffectContext.get(context, Scope.Scope)
  const mailbox = yield* Mailbox.make<A>()
  yield* Scope.addFinalizer(scope, mailbox.shutdown)
  const cancel = registry.subscribe(self, (value) => mailbox.unsafeOffer(value))
  yield* Scope.addFinalizer(scope, Effect.sync(cancel))
  return Mailbox.toStream(mailbox)
}, Stream.unwrapScoped)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStreamResult = <A, E>(self: Rx<Result.Result<A, E>>): Stream.Stream<A, E, RxRegistry> =>
  toStream(self).pipe(
    Stream.filter(Result.isNotInitial),
    Stream.mapEffect((result) =>
      result._tag === "Success" ? Effect.succeed(result.value) : Effect.failCause(result.cause)
    )
  )

/**
 * @since 1.0.0
 * @category Conversions
 */
export const get = <A>(self: Rx<A>): Effect.Effect<A, never, RxRegistry> =>
  Effect.map(RxRegistry, (registry) => registry.get(self))

/**
 * @since 1.0.0
 * @category Conversions
 */
export const getResult = <A, E>(
  self: Rx<Result.Result<A, E>>
): Effect.Effect<A, E, RxRegistry> =>
  Effect.flatMap(RxRegistry, (registry) =>
    Effect.async((resume) => {
      const result = registry.get(self)
      if (result._tag !== "Initial") {
        return resume(Result.toExit(result) as any)
      }
      const cancel = registry.subscribe(self, (value) => {
        if (value._tag !== "Initial") {
          resume(Result.toExit(value) as any)
          cancel()
        }
      })
      return Effect.sync(cancel)
    }))
