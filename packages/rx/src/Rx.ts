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
import type * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as internalRegistry from "./internal/registry.js"
import { runCallbackSync, runCallbackSyncDefault } from "./internal/runtime.js"
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

/**
 * @since 1.0.0
 * @category constructors
 */
export const state = <A>(
  initialValue: A
): Writable<A, A> =>
  writable(function(_get) {
    return initialValue
  }, constSetSelf)

function makeEffect<E, A>(
  ctx: Context,
  create: Rx.Read<Effect.Effect<never, E, A>>,
  initialValue: Result.Result<E, A>,
  runCallback = runCallbackSyncDefault
): Result.Result<E, A> {
  const previous = ctx.self<Result.Result<E, A>>()

  const cancel = runCallback(
    create(ctx),
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

function makeEffectRuntime<R, E, A, RE>(
  ctx: Context,
  create: Rx.Read<Effect.Effect<R, E, A>>,
  initialValue: Result.Result<E, A>,
  runtime: RxRuntime<RE, R>
): Result.Result<E | RE, A> {
  const previous = ctx.self<Result.Result<E, A>>()
  const runtimeResult = ctx.get(runtime)

  if (runtimeResult._tag !== "Success") {
    return Result.replacePrevious(runtimeResult, previous)
  }

  return makeEffect(ctx, create as any, initialValue, runCallbackSync(runtimeResult.value))
}

function makeScoped<R, E, A, RE>(
  ctx: Context,
  create: Rx.Read<Effect.Effect<R, E, A>>,
  initialValue: Result.Result<E, A>,
  options?: {
    readonly runtime?: RxRuntime<RE, R>
  }
): Result.Result<E | RE, A> {
  function createScoped(ctx: Context) {
    const scope = Effect.runSync(Scope.make())
    ctx.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))
    return Effect.provideService(
      create(ctx),
      Scope.Scope,
      scope
    )
  }
  return options?.runtime
    ? makeEffectRuntime(ctx, createScoped, initialValue, options.runtime)
    : makeEffect(ctx, createScoped as any, initialValue)
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fn: {
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

function makeFn<Arg, A, B>(
  f: Rx.ReadFn<Arg, A>,
  transform: (get: Context, _: Option.Option<Rx.Read<A>>) => B
) {
  const argRx = state<[number, Arg]>([0, undefined as any])
  return writable<B, Arg>(function(get) {
    const [counter, arg] = get(argRx)
    if (counter === 0) {
      return transform(get, Option.none())
    }
    return transform(
      get,
      Option.some(function(ctx) {
        return f(arg, ctx)
      })
    )
  }, function(ctx, arg) {
    ctx.set(argRx, [ctx.get(argRx)[0] + 1, arg])
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const effect: {
  <E, A>(create: Rx.Read<Effect.Effect<never, E, A>>, options?: {
    readonly initialValue?: A
    readonly runtime?: undefined
  }): Rx<Result.Result<E, A>>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Effect.Effect<R, E, A>>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly initialValue?: A
    }
  ): Rx<Result.Result<RE | E, A>>
} = <R, E, A, RE>(
  create: Rx.Read<Effect.Effect<R, E, A>>,
  options?: {
    readonly runtime?: RxRuntime<RE, R>
    readonly initialValue?: A
  }
) => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return readable<Result.Result<E | RE, A>>(function(get) {
    return options?.runtime
      ? makeEffectRuntime(get, create, initialValue, options.runtime)
      : makeEffect(get, create as any, initialValue)
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const scoped: {
  <E, A>(create: Rx.Read<Effect.Effect<Scope.Scope, E, A>>, options?: {
    readonly initialValue?: A
    readonly runtime?: undefined
  }): Rx<Result.Result<E, A>>
  <RR, R extends (RR | Scope.Scope), E, A, RE>(
    create: Rx.Read<Effect.Effect<R, E, A>>,
    options: {
      readonly initialValue?: A
      readonly runtime: RxRuntime<RE, RR>
    }
  ): Rx<Result.Result<RE | E, A>>
} = <R, E, A, RE>(
  create: Rx.Read<Effect.Effect<R, E, A>>,
  options?: {
    readonly initialValue?: A
    readonly runtime?: RxRuntime<RE, R>
  }
) => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return readable<Result.Result<E | RE, A>>(function(get) {
    return makeScoped(get, create, initialValue, options)
  })
}

/**
 * @since 1.0.0
 * @category models
 */
export interface RxResultFn<E, A, Arg> extends Writable<Result.Result<E, A>, Arg> {}

/**
 * @since 1.0.0
 * @category constructors
 */
export const effectFn: {
  <Arg, E, A>(fn: Rx.ReadFn<Arg, Effect.Effect<never, E, A>>, options?: {
    readonly initialValue?: A
    readonly runtime?: undefined
  }): RxResultFn<E, A, Arg>
  <Arg, RR, R extends RR, E, A, RE>(
    fn: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly initialValue?: A
    }
  ): RxResultFn<RE | E, A, Arg>
} = <Arg, R, E, A, RE>(
  f: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
  options?: {
    readonly runtime?: RxRuntime<RE, R>
    readonly initialValue?: A
  }
) => {
  const initialValue = options?.initialValue !== undefined ? Result.success(options.initialValue) : Result.initial()
  return makeFn(f, function(get, create) {
    if (create._tag === "None") {
      return initialValue
    }
    return options?.runtime
      ? makeEffectRuntime(get, create.value, initialValue, options.runtime)
      : makeEffect(get, create.value as any, initialValue)
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const scopedFn: {
  <Arg, E, A>(fn: Rx.ReadFn<Arg, Effect.Effect<Scope.Scope, E, A>>, options?: {
    readonly initialValue?: A
    readonly runtime?: undefined
  }): RxResultFn<E, A, Arg>
  <Arg, RR, R extends (RR | Scope.Scope), E, A, RE>(
    fn: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
    options: {
      readonly initialValue?: A
      readonly runtime: RxRuntime<RE, RR>
    }
  ): RxResultFn<RE | E, A, Arg>
} = <Arg, R, E, A, RE>(
  f: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
  options?: {
    readonly initialValue?: A
    readonly runtime?: RxRuntime<RE, R>
  }
) => {
  const initialValue = options?.initialValue !== undefined ? Result.success(options.initialValue) : Result.initial()
  return makeFn(f, function(get, create) {
    if (create._tag === "None") {
      return initialValue
    }
    return makeScoped(get, create.value, initialValue, options)
  })
}

/**
 * @since 1.0.0
 * @category models
 */
export interface RxRuntime<E, A> extends Rx<Result.Result<E, Runtime.Runtime<A>>> {}

/**
 * @since 1.0.0
 * @category constructors
 */
export const runtime: {
  <E, A>(create: (get: Context) => Layer.Layer<never, E, A>, options?: {
    readonly autoDispose?: boolean
    readonly idleTTL?: Duration.DurationInput
    readonly runtime?: undefined
  }): RxRuntime<E, A>
  <RR, R extends RR, E, A, RE>(create: (get: Context) => Layer.Layer<R, E, A>, options?: {
    readonly autoDispose?: boolean
    readonly idleTTL?: Duration.DurationInput
    readonly runtime: RxRuntime<RE, RR>
  }): RxRuntime<E, A | RR>
} = <R, E, A, RE>(create: (get: Context) => Layer.Layer<R, E, A>, options?: {
  readonly autoDispose?: boolean
  readonly idleTTL?: Duration.DurationInput
  readonly runtime?: RxRuntime<RE, R>
}): RxRuntime<E | RE, A> => {
  let rx = options?.runtime
    ? scoped((get) =>
      Effect.flatMap(
        Layer.build(create(get)),
        (context) => Effect.provide(Effect.runtime<A>(), context)
      ), { runtime: options.runtime })
    : scoped((get) => Layer.toRuntime(create(get)) as Effect.Effect<Scope.Scope, E, Runtime.Runtime<A>>)

  if (options?.idleTTL !== undefined) {
    rx = setIdleTTL(rx, options.idleTTL)
  }
  if (options?.autoDispose !== true) {
    rx = keepAlive(rx)
  }

  return rx
}

function makeStream<E, A>(
  ctx: Context,
  create: Rx.Read<Stream.Stream<never, E, A>>,
  initialValue: Result.Result<E | NoSuchElementException, A>,
  runCallback = runCallbackSyncDefault
): Result.Result<E | NoSuchElementException, A> {
  const previous = ctx.self<Result.Result<E | NoSuchElementException, A>>()

  const cancel = runCallback(
    Stream.runForEach(
      create(ctx),
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

function makeStreamRuntime<R, E, A, RE>(
  ctx: Context,
  create: Rx.Read<Stream.Stream<R, E, A>>,
  initialValue: Result.Result<E | RE | NoSuchElementException, A>,
  runtime: RxRuntime<RE, R>
): Result.Result<E | RE | NoSuchElementException, A> {
  const previous = ctx.self<Result.Result<E | RE | NoSuchElementException, A>>()
  const runtimeResult = ctx.get(runtime)

  if (runtimeResult._tag !== "Success") {
    return Result.replacePrevious(runtimeResult, previous)
  }

  return makeStream(ctx, create as any, initialValue, runCallbackSync(runtimeResult.value))
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const stream: {
  <E, A>(
    create: Rx.Read<Stream.Stream<never, E, A>>,
    options?: {
      readonly initialValue?: A
      readonly runtime?: undefined
    }
  ): Rx<Result.Result<E | NoSuchElementException, A>>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Stream.Stream<R, E, A>>,
    options: {
      readonly initialValue?: A
      readonly runtime: RxRuntime<RE, RR>
    }
  ): Rx<Result.Result<RE | E | NoSuchElementException, A>>
} = <R, E, A, RE>(
  create: Rx.Read<Stream.Stream<R, E, A>>,
  options?: {
    readonly initialValue?: A
    readonly runtime?: RxRuntime<RE, R>
  }
) => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return readable<Result.Result<E | RE | NoSuchElementException, A>>(function(get) {
    return options?.runtime
      ? makeStreamRuntime(get, create, initialValue, options.runtime)
      : makeStream(get, create as any, initialValue)
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const streamFn: {
  <Arg, E, A>(fn: Rx.ReadFn<Arg, Stream.Stream<never, E, A>>, options?: {
    readonly initialValue?: A
    readonly runtime?: undefined
  }): RxResultFn<E | NoSuchElementException, A, Arg>
  <Arg, RR, R extends RR, E, A, RE>(
    fn: Rx.ReadFn<Arg, Stream.Stream<R, E, A>>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly initialValue?: A
    }
  ): RxResultFn<RE | E | NoSuchElementException, A, Arg>
} = <Arg, R, E, A, RE>(
  f: Rx.ReadFn<Arg, Stream.Stream<R, E, A>>,
  options?: {
    readonly runtime?: RxRuntime<RE, R>
    readonly initialValue?: A
  }
) => {
  const initialValue = options?.initialValue !== undefined
    ? Result.success<E, A>(options.initialValue)
    : Result.initial<E, A>()
  return makeFn(f, function(get, create) {
    if (create._tag === "None") {
      return initialValue
    }
    return options?.runtime
      ? makeStreamRuntime(get, create.value, initialValue, options.runtime)
      : makeStream(get, create.value as any, initialValue)
  })
}

/**
 * @since 1.0.0
 * @category models
 */
export type StreamPullResult<E, A> = Result.Result<E | NoSuchElementException, {
  readonly done: boolean
  readonly items: Array<A>
}>

/**
 * @since 1.0.0
 * @category constructors
 */
export const streamPull: {
  <E, A>(create: Rx.Read<Stream.Stream<never, E, A>>, options?: {
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<A>
    readonly runtime?: undefined
  }): Writable<StreamPullResult<E, A>, void>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Stream.Stream<R, E, A>>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly disableAccumulation?: boolean
      readonly initialValue?: ReadonlyArray<A>
    }
  ): Writable<StreamPullResult<RE | E, A>, void>
} = <R, E, A, RE>(
  create: Rx.Read<Stream.Stream<R, E, A>>,
  options?: {
    readonly runtime?: RxRuntime<RE, R>
    readonly disableAccumulation?: boolean
    readonly initialValue?: ReadonlyArray<A>
  }
) => {
  const initialValue: Result.Result<E | RE | NoSuchElementException, {
    readonly done: boolean
    readonly items: Array<A>
  }> = options?.initialValue !== undefined
    ? Result.success({ done: false, items: options.initialValue as Array<A> })
    : Result.initial()
  const pullRx = scoped(function(get) {
    const stream = create(get)
    return Stream.toPull(
      options?.disableAccumulation ? stream : Stream.accumulateChunks(stream)
    )
  }, options as { readonly runtime: RxRuntime<RE, R> })

  return writable<StreamPullResult<E | RE, A>, void>(function(get) {
    const previous = get.self<StreamPullResult<E | RE, A>>()
    const pullResult = get(pullRx)
    if (pullResult._tag !== "Success") {
      return Result.replacePrevious(pullResult, previous)
    }
    const pull = pipe(
      pullResult.value,
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
              get.self<StreamPullResult<E, A>>(),
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
    return options?.runtime
      ? makeEffectRuntime(get, (_) => pull, initialValue, options.runtime)
      : makeEffect(get, (_) => pull as any, initialValue)
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
