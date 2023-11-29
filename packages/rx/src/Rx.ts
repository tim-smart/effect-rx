/**
 * @since 1.0.0
 */
import { NoSuchElementException } from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { dual, pipe } from "effect/Function"
import * as Hash from "effect/Hash"
import * as Inspectable from "effect/Inspectable"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { type Pipeable, pipeArguments } from "effect/Pipeable"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as internalRegistry from "./internal/registry.js"
import { runCallbackSync } from "./internal/runtime.js"
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
  readonly read: Rx.Read<A>
  readonly refresh?: Rx.Refresh
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
   * @category models
   */
  export type Read<A> = (ctx: Context) => A

  /**
   * @since 1.0.0
   * @category models
   */
  export type ReadFn<Arg, A> = (arg: Arg, ctx: Context) => A

  /**
   * @since 1.0.0
   * @category models
   */
  export type Write<R, W> = (ctx: WriteContext<R>, value: W) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Refresh = (f: <A>(rx: Rx<A>) => void) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Get = <A>(rx: Rx<A>) => A

  /**
   * @since 1.0.0
   * @category models
   */
  export type GetResult = <E, A>(rx: Rx<Result.Result<E, A>>) => Exit.Exit<E | NoSuchElementException, A>

  /**
   * @since 1.0.0
   * @category models
   */
  export type Set = <R, W>(rx: Writable<R, W>, value: W) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type SetEffect = <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<never, never, void>

  /**
   * @since 1.0.0
   * @category models
   */
  export type RefreshRxSync = <A>(rx: Rx<A> & Refreshable) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type RefreshRx = <A>(rx: Rx<A> & Refreshable) => Effect.Effect<never, never, void>

  /**
   * @since 1.0.0
   * @category models
   */
  export type Mount = <A>(rx: Rx<A>) => () => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Subscribe = <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void

  /**
   * @since 1.0.0
   */
  export type Infer<T extends Rx<any>> = T extends Rx<infer A> ? A : never
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
export interface Writable<R, W> extends Rx<R> {
  readonly [WritableTypeId]: WritableTypeId
  readonly write: Rx.Write<R, W>
}

/**
 * @since 1.0.0
 * @category context
 */
export interface Context {
  <A>(rx: Rx<A>): A
  readonly get: <A>(rx: Rx<A>) => A
  readonly result: <E, A>(rx: Rx<Result.Result<E, A>>) => Exit.Exit<E | NoSuchElementException, A>
  readonly once: <A>(rx: Rx<A>) => A
  readonly addFinalizer: (f: () => void) => void
  readonly mount: <A>(rx: Rx<A>) => void
  readonly refreshSync: <A>(rx: Rx<A> & Refreshable) => void
  readonly refresh: <A>(rx: Rx<A> & Refreshable) => Effect.Effect<never, never, void>
  readonly refreshSelfSync: () => void
  readonly refreshSelf: Effect.Effect<never, never, void>
  readonly self: <A>() => Option.Option<A>
  readonly setSelfSync: <A>(a: A) => void
  readonly setSelf: <A>(a: A) => Effect.Effect<never, never, void>
  readonly setSync: <R, W>(rx: Writable<R, W>, value: W) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<never, never, void>
  readonly subscribe: <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
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
    return Inspectable.toString(this)
  },
  [Inspectable.NodeInspectSymbol](this: Rx<any>) {
    return this.toJSON()
  },

  // runtime api
  rx(this: RxRuntime<any, any>, arg: any, options?: { readonly initialValue?: unknown }) {
    const read = makeRead(arg, options)
    return readable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return read(runtimeResult.value)(get)
    })
  },

  fn(this: RxRuntime<any, any>, arg: any, options?: { readonly initialValue?: unknown }) {
    const [makeRead, write] = makeResultFn(arg, options)
    return writable((get) => {
      const previous = get.self<Result.Result<any, any>>()
      const runtimeResult = get(this)
      if (runtimeResult._tag !== "Success") {
        return Result.replacePrevious(runtimeResult, previous)
      }
      return makeRead(runtimeResult.value)(get)
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
        makeStreamPullEffect(get, arg, options, runtimeResult.value),
        Result.initial(true),
        runtimeResult.value
      )
    })
    return makeStreamPull(pullRx as any, options)
  }
} as const

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
  read: Rx.Read<A>,
  refresh?: Rx.Refresh
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
  read: Rx.Read<R>,
  write: Rx.Write<R, W>,
  refresh?: Rx.Refresh
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
  <E, A>(effect: Effect.Effect<Scope.Scope, E, A>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<E, A>>
  <E, A>(create: Rx.Read<Effect.Effect<Scope.Scope, E, A>>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<E, A>>
  <E, A>(stream: Stream.Stream<never, E, A>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<E, A>>
  <E, A>(create: Rx.Read<Stream.Stream<never, E, A>>, options?: {
    readonly initialValue?: A
  }): Rx<Result.Result<E, A>>
  <E, A>(layer: Layer.Layer<never, E, A>): RxRuntime<E, A>
  <E, A>(create: Rx.Read<Layer.Layer<never, E, A>>): RxRuntime<E, A>
  <A>(create: Rx.Read<A>): Rx<A>
  <A>(initialValue: A): Writable<A, A>
} = (arg: any, options?: { readonly initialValue?: unknown }) => {
  const readOrRx = makeRead(arg, options)()
  if (TypeId in readOrRx) {
    return readOrRx as any
  }
  return readable(readOrRx)
}

// -----------------------------------------------------------------------------
// constructors - effect
// -----------------------------------------------------------------------------

const makeRead: {
  <E, A>(effect: Effect.Effect<Scope.Scope, E, A>, options?: {
    readonly initialValue?: A
  }): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, A>>
  <E, A>(create: Rx.Read<Effect.Effect<Scope.Scope, E, A>>, options?: {
    readonly initialValue?: A
  }): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, A>>
  <E, A>(stream: Stream.Stream<never, E, A>, options?: {
    readonly initialValue?: A
  }): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, A>>
  <E, A>(create: Rx.Read<Stream.Stream<never, E, A>>, options?: {
    readonly initialValue?: A
  }): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, A>>
  <E, A>(
    layer: Layer.Layer<never, E, A>
  ): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, Runtime.Runtime<any>>>
  <E, A>(
    create: Rx.Read<Layer.Layer<never, E, A>>
  ): (runtime?: Runtime.Runtime<any>) => Rx.Read<Result.Result<E, Runtime.Runtime<any>>>
  <A>(create: Rx.Read<A>): (runtime?: Runtime.Runtime<any>) => Rx.Read<A>
  <A>(initialValue: A): (runtime?: Runtime.Runtime<any>) => Writable<A, A>
} = <E, A>(
  arg:
    | Effect.Effect<Scope.Scope, E, A>
    | Rx.Read<Effect.Effect<Scope.Scope, E, A>>
    | Stream.Stream<never, E, A>
    | Rx.Read<Stream.Stream<never, E, A>>
    | Layer.Layer<never, E, A>
    | Rx.Read<Layer.Layer<never, E, A>>
    | Rx.Read<A>
    | A,
  options?: { readonly initialValue?: unknown }
) =>
(providedRuntime?: Runtime.Runtime<any>) => {
  if (typeof arg === "function") {
    const create = arg as Rx.Read<any>
    return function(get: Context) {
      const value = create(get)
      if (typeof value === "object" && value !== null) {
        if (Effect.EffectTypeId in value) {
          return effect(get, value, options, providedRuntime)
        } else if (Stream.StreamTypeId in value) {
          return stream(get, value, options, providedRuntime)
        } else if (Layer.LayerTypeId in value) {
          return runtime(get, value, providedRuntime)
        }
      }
      return value
    }
  } else if (typeof arg === "object" && arg !== null) {
    if (Effect.EffectTypeId in arg) {
      return function(get: Context) {
        return effect(get, arg, options, providedRuntime)
      }
    } else if (Stream.StreamTypeId in arg) {
      return function(get: Context) {
        return stream(get, arg, options, providedRuntime)
      }
    } else if (Layer.LayerTypeId in arg) {
      return function(get: Context) {
        return runtime(get, arg, providedRuntime)
      }
    }
  }

  return state(arg) as any
}

const state = <A>(
  initialValue: A
): Writable<A, A> =>
  writable(function(_get) {
    return initialValue
  }, constSetSelf)

const effect = <E, A>(
  get: Context,
  effect: Effect.Effect<Scope.Scope, E, A>,
  options?: { readonly initialValue?: A },
  runtime?: Runtime.Runtime<any>
): Result.Result<E, A> => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return makeEffect(get, effect, initialValue, runtime)
}

function makeEffect<E, A>(
  ctx: Context,
  effect: Effect.Effect<Scope.Scope, E, A>,
  initialValue: Result.Result<E, A>,
  runtime = Runtime.defaultRuntime
): Result.Result<E, A> {
  const previous = ctx.self<Result.Result<E, A>>()

  const scope = Effect.runSync(Scope.make())
  ctx.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))
  const scopedEffect = Effect.provideService(
    effect,
    Scope.Scope,
    scope
  )
  const cancel = runCallbackSync(runtime)(
    scopedEffect,
    function(exit) {
      if (!Exit.isInterrupted(exit)) {
        ctx.setSelfSync(Result.fromExitWithPrevious(exit, previous))
      }
    }
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
// constructors - layer
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export interface RxRuntime<ER, R> extends Rx<Result.Result<ER, Runtime.Runtime<R>>> {
  readonly rx: {
    <E, A>(effect: Effect.Effect<Scope.Scope | R, E, A>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<E | ER, A>>
    <E, A>(create: Rx.Read<Effect.Effect<Scope.Scope | R, E, A>>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<E | ER, A>>
    <E, A>(stream: Stream.Stream<never | R, E, A>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<E | ER, A>>
    <E, A>(create: Rx.Read<Stream.Stream<never | R, E, A>>, options?: {
      readonly initialValue?: A
    }): Rx<Result.Result<E | ER, A>>
    <E, A>(layer: Layer.Layer<R, E, A>): RxRuntime<E | ER, A | R>
    <E, A>(create: Rx.Read<Layer.Layer<R, E, A>>): RxRuntime<E | ER, A | R>
  }

  readonly fn: {
    <Arg, E, A>(fn: Rx.ReadFn<Arg, Effect.Effect<Scope.Scope | R, E, A>>, options?: {
      readonly initialValue?: A
    }): RxResultFn<E | ER, A, Arg>
    <Arg, E, A>(fn: Rx.ReadFn<Arg, Stream.Stream<R, E, A>>, options?: {
      readonly initialValue?: A
    }): RxResultFn<E | ER | NoSuchElementException, A, Arg>
  }

  readonly pull: <E, A>(create: Rx.Read<Stream.Stream<R, E, A>> | Stream.Stream<R, E, A>, options?: {
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<A>
  }) => Writable<PullResult<E | ER, A>, void>
}

const runtime = <E, A>(
  get: Context,
  layer: Layer.Layer<never, E, A>,
  runtime?: Runtime.Runtime<any>
): Result.Result<E, Runtime.Runtime<A>> => {
  const buildEffect = runtime ?
    Effect.flatMap(
      Layer.build(layer),
      (context) => Effect.provide(Effect.runtime<A>(), context)
    ) :
    Layer.toRuntime(layer)

  return effect(get, buildEffect, undefined, runtime)
}

// -----------------------------------------------------------------------------
// constructors - stream
// -----------------------------------------------------------------------------

const stream = <E, A>(
  get: Context,
  stream: Stream.Stream<never, E, A>,
  options?: { readonly initialValue?: A },
  runtime?: Runtime.Runtime<any>
): Result.Result<E | NoSuchElementException, A> => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return makeStream(get, stream, initialValue, runtime)
}

function makeStream<E, A>(
  ctx: Context,
  stream: Stream.Stream<never, E, A>,
  initialValue: Result.Result<E | NoSuchElementException, A>,
  runtime = Runtime.defaultRuntime
): Result.Result<E | NoSuchElementException, A> {
  const previous = ctx.self<Result.Result<E | NoSuchElementException, A>>()

  const cancel = runCallbackSync(runtime)(
    Stream.runForEach(
      stream,
      (a) => Effect.sync(() => ctx.setSelfSync(Result.waiting(Result.success(a))))
    ),
    (exit) => {
      if (exit._tag === "Failure") {
        if (!Exit.isInterrupted(exit)) {
          ctx.setSelfSync(Result.failureWithPrevious(exit.cause, previous))
        }
      } else {
        pipe(
          ctx.self<Result.Result<E | NoSuchElementException, A>>(),
          Option.flatMap(Result.value),
          Option.match({
            onNone: () => ctx.setSelfSync(Result.failWithPrevious(new NoSuchElementException(), previous)),
            onSome: (a) => ctx.setSelfSync(Result.success(a))
          })
        )
      }
    }
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
// constructors - functions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export interface RxResultFn<E, A, Arg> extends Writable<Result.Result<E, A>, Arg> {}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fnSync: {
  <Arg, A>(
    f: Rx.ReadFn<Arg, A>
  ): Writable<Option.Option<A>, Arg>
  <Arg, A>(
    f: Rx.ReadFn<Arg, A>,
    options: { readonly initialValue: A }
  ): Writable<A, Arg>
} = <Arg, A>(f: Rx.ReadFn<Arg, A>, options?: {
  readonly initialValue?: A
}): Writable<Option.Option<A> | A, Arg> => {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const hasInitialValue = options?.initialValue !== undefined
  return writable(function(get) {
    const [counter, arg] = get(argRx)
    if (counter === 0) {
      return hasInitialValue ? options.initialValue : Option.none()
    }
    return hasInitialValue ? f(arg, get) : Option.some(f(arg, get))
  }, function(ctx, arg) {
    ctx.set(argRx, [ctx.get(argRx)[0] + 1, arg])
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fn: {
  <Arg, E, A>(fn: Rx.ReadFn<Arg, Effect.Effect<Scope.Scope, E, A>>, options?: {
    readonly initialValue?: A
  }): RxResultFn<E, A, Arg>
  <Arg, E, A>(fn: Rx.ReadFn<Arg, Stream.Stream<never, E, A>>, options?: {
    readonly initialValue?: A
  }): RxResultFn<E | NoSuchElementException, A, Arg>
} = <Arg, E, A>(f: Rx.ReadFn<Arg, Stream.Stream<never, E, A> | Effect.Effect<Scope.Scope, E, A>>, options?: {
  readonly initialValue?: A
}): RxResultFn<E | NoSuchElementException, A, Arg> => {
  const [makeRead, write] = makeResultFn(f, options)
  return writable(makeRead(), write)
}

function makeResultFn<Arg, E, A>(
  f: Rx.ReadFn<Arg, Effect.Effect<Scope.Scope, E, A> | Stream.Stream<never, E, A>>,
  options?: { readonly initialValue?: A }
) {
  const argRx = state<[number, Arg]>([0, undefined as any])
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()

  function makeRead(runtime?: Runtime.Runtime<never>): Rx.Read<Result.Result<E | NoSuchElementException, A>> {
    return function(get) {
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
  }
  function write(ctx: WriteContext<Result.Result<E | NoSuchElementException, A>>, arg: Arg) {
    ctx.set(argRx, [ctx.get(argRx)[0] + 1, arg])
  }
  return [makeRead, write] as const
}

/**
 * @since 1.0.0
 * @category models
 */
export type PullResult<E, A> = Result.Result<E | NoSuchElementException, {
  readonly done: boolean
  readonly items: Array<A>
}>

/**
 * @since 1.0.0
 * @category constructors
 */
export const pull = <E, A>(create: Rx.Read<Stream.Stream<never, E, A>> | Stream.Stream<never, E, A>, options?: {
  readonly disableAccumulation?: boolean
  readonly initialValue?: ReadonlyArray<A>
}): Writable<PullResult<E, A>, void> => {
  const pullRx = readable(
    makeRead(function(get) {
      return makeStreamPullEffect(get, create, options)
    })()
  )
  return makeStreamPull(pullRx, options)
}

const makeStreamPullEffect = <E, A>(
  get: Context,
  create: Rx.Read<Stream.Stream<never, E, A>> | Stream.Stream<never, E, A>,
  options?: { readonly disableAccumulation?: boolean },
  runtime?: Runtime.Runtime<any>
) => {
  const stream = typeof create === "function" ? create(get) : create
  return Effect.map(
    Stream.toPull(
      options?.disableAccumulation ? stream : Stream.accumulateChunks(stream)
    ),
    (pull) => [pull, runtime] as const
  )
}

const makeStreamPull = <E, A>(
  pullRx: Rx<
    Result.Result<
      never,
      readonly [Effect.Effect<never, Option.Option<E>, Chunk.Chunk<A>>, Runtime.Runtime<any> | undefined]
    >
  >,
  options?: { readonly initialValue?: ReadonlyArray<A> }
) => {
  const initialValue: Result.Result<E | NoSuchElementException, {
    readonly done: boolean
    readonly items: Array<A>
  }> = options?.initialValue !== undefined
    ? Result.success({ done: false, items: options.initialValue as Array<A> })
    : Result.initial()

  return writable(function(get: Context): PullResult<E, A> {
    const previous = get.self<PullResult<E, A>>()
    const pullResult = get(pullRx)
    if (pullResult._tag !== "Success") {
      return Result.replacePrevious(pullResult, previous)
    }
    const [pullEffect, runtime] = pullResult.value
    const pull = pipe(
      pullEffect,
      Effect.map((_) => ({
        done: false,
        items: Chunk.toReadonlyArray(_) as Array<A>
      })),
      Effect.catchAll((error): Effect.Effect<never, E | NoSuchElementException, {
        readonly done: boolean
        readonly items: Array<A>
      }> =>
        Option.match(error, {
          onNone: () =>
            pipe(
              get.self<PullResult<E, A>>(),
              Option.flatMap(Result.value),
              Option.match({
                onNone: () => Effect.fail(new NoSuchElementException()),
                onSome: ({ items }) =>
                  Effect.succeed({
                    done: true,
                    items
                  })
              })
            ),
          onSome: Effect.fail
        })
      )
    )
    return makeEffect(get, pull, initialValue, runtime)
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
  <Arg, T extends Rx<any>>(
    f: (arg: Arg) => T
  ): (arg: Arg) => T => {
    const atoms = new Map<number, T>()
    return function(arg) {
      const hash = Hash.hash(arg)
      const atom = atoms.get(hash)
      if (atom !== undefined) {
        return atom
      }
      const newAtom = f(arg)
      atoms.set(hash, newAtom)
      return newAtom
    }
  } :
  <Arg, T extends Rx<any>>(
    f: (arg: Arg) => T
  ): (arg: Arg) => T => {
    const atoms = new Map<number, WeakRef<T>>()
    const registry = new FinalizationRegistry<number>((hash) => {
      atoms.delete(hash)
    })
    return function(arg) {
      const hash = Hash.hash(arg)
      const atom = atoms.get(hash)?.deref()
      if (atom !== undefined) {
        return atom
      }
      const newAtom = f(arg)
      atoms.set(hash, new WeakRef(newAtom))
      registry.register(newAtom, hash)
      return newAtom
    }
  }

/**
 * @since 1.0.0
 * @category combinators
 */
export const withFallback: {
  <E2, A2>(
    fallback: Rx<Result.Result<E2, A2>>
  ): <R extends Rx<Result.Result<any, any>>>(
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>>
  <R extends Rx<Result.Result<any, any>>, E2, A2>(
    self: R,
    fallback: Rx<Result.Result<E2, A2>>
  ): [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>>
} = dual<
  <E2, A2>(
    fallback: Rx<Result.Result<E2, A2>>
  ) => <R extends Rx<Result.Result<any, any>>>(
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>>,
  <R extends Rx<Result.Result<any, any>>, E2, A2>(
    self: R,
    fallback: Rx<Result.Result<E2, A2>>
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>> | E2, Result.Result.InferA<Rx.Infer<R>> | A2>>
>(2, (self, fallback) => {
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
    )
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
export const map = dual<
  <R extends Rx<any>, B>(
    f: (_: Rx.Infer<R>) => B
  ) => (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>,
  <R extends Rx<any>, B>(
    self: R,
    f: (_: Rx.Infer<R>) => B
  ) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
>(
  2,
  (<A, B>(self: Rx<A>, f: (_: A) => B): Rx<B> =>
    isWritable(self)
      ? writable(
        (get) => f(get(self)),
        self.write as any,
        self.refresh ?? function(refresh) {
          refresh(self)
        }
      )
      : readable(
        (get) => f(get(self)),
        self.refresh ?? function(refresh) {
          refresh(self)
        }
      )) as any
)

/**
 * @since 1.0.0
 * @category combinators
 */
export const mapResult = dual<
  <R extends Rx<Result.Result<any, any>>, B>(
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ) => (
    self: R
  ) => [R] extends [Writable<infer _, infer RW>] ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>>,
  <R extends Rx<Result.Result<any, any>>, B>(
    self: R,
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ) => [R] extends [Writable<infer _, infer RW>] ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>>
>(2, (self, f) => map(self, Result.map(f)) as any)

/**
 * @since 1.0.0
 * @category batching
 */
export const batch: (f: () => void) => void = internalRegistry.batch
