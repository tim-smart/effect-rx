/**
 * @since 1.0.0
 */
import * as Result from "@effect-rx/rx/Result"
import * as Chunk from "@effect/data/Chunk"
import * as EffectContext from "@effect/data/Context"
import * as Equal from "@effect/data/Equal"
import { pipe } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import * as Inspectable from "@effect/data/Inspectable"
import * as Option from "@effect/data/Option"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import { NoSuchElementException } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Layer from "@effect/io/Layer"
import * as Runtime from "@effect/io/Runtime"
import * as Scope from "@effect/io/Scope"
import * as Channel from "@effect/stream/Channel"
import * as Sink from "@effect/stream/Sink"
import * as Stream from "@effect/stream/Stream"

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
export interface Rx<A> extends Pipeable, Effect.Effect<RxContext, never, A> {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly read: (get: Rx.Get, ctx: Context) => A
  readonly refresh: (f: <A>(rx: Rx<A>) => void) => void
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
  export type Get = <A>(rx: Rx<A>) => A

  /**
   * @since 1.0.0
   * @category models
   */
  export type Set = <R, W>(rx: Writeable<R, W>, value: W) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Refresh = <A>(rx: Rx<A> & Refreshable) => void

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
   * @category models
   */
  export type SubscribeGetter = <A>(rx: Rx<A>, f: () => void) => readonly [get: () => A, unmount: () => void]
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
export const WriteableTypeId = Symbol.for("@effect-rx/rx/Rx/Writeable")

/**
 * @since 1.0.0
 * @category type ids
 */
export type WriteableTypeId = typeof WriteableTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Writeable<R, W> extends Rx<R> {
  readonly [WriteableTypeId]: WriteableTypeId
  readonly write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void
}

/**
 * @since 1.0.0
 * @category context
 */
export interface Context {
  readonly get: Rx.Get
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly refresh: Rx.Refresh
  readonly refreshSelf: () => void
  readonly self: <A>() => Option.Option<A>
  readonly setSelf: <A>(a: A) => void
  readonly set: Rx.Set
  readonly subscribe: <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
}

/**
 * @since 1.0.0
 * @category context
 */
export interface RxContext {
  readonly _: unique symbol
}

/**
 * @since 1.0.0
 * @category context
 */
export const Context = EffectContext.Tag<RxContext, Context>("@effect-rx/rx/Rx/Context")

const RxProto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments)
  },

  // Effect
  [Effect.EffectTypeId]: undefined,
  [Stream.StreamTypeId]: undefined,
  [Sink.SinkTypeId]: undefined,
  [Channel.ChannelTypeId]: undefined,
  _tag: "Commit",
  commit(this: Rx<unknown>) {
    return access(this)
  },
  [Equal.symbol](this: Rx<any>, that: Rx<any>): boolean {
    return this === that
  },
  [Hash.symbol](this: Rx<any>): number {
    return Hash.random(this)
  },
  toJSON(this: Rx<any>) {
    return {
      _id: "Rx",
      keepAlive: this.keepAlive
    }
  },
  toString() {
    return Inspectable.toString(this)
  },
  [Inspectable.NodeInspectSymbol](this: Rx<any>) {
    return this.toJSON()
  }
} as const

const WriteableProto = {
  ...RxProto,
  [WriteableTypeId]: WriteableTypeId
} as const

function defaultRefresh(this: Rx<any>, f: any) {
  f(this)
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const readable = <A>(
  read: (get: Rx.Get, ctx: Context) => A,
  refresh: (f: <A>(rx: Rx<A>) => void) => void = defaultRefresh
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
export const writeable = <R, W>(
  read: (get: Rx.Get, ctx: Context) => R,
  write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void,
  refresh: (f: <A>(rx: Rx<A>) => void) => void = defaultRefresh
): Writeable<R, W> => {
  const rx = Object.create(WriteableProto)
  rx.keepAlive = false
  rx.read = read
  rx.write = write
  rx.refresh = refresh
  return rx
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const state = <A>(
  initialValue: A
): Writeable<A, A> =>
  writeable(
    function(_ctx) {
      return initialValue
    },
    function(_get, _set, setSelf, value) {
      setSelf(value)
    }
  )

function makeEffect<E, A>(
  ctx: Context,
  effect: Effect.Effect<RxContext, E, A>,
  runCallback = Effect.runCallback
): Result.Result<E, A> {
  const previous = ctx.self<Result.Result<E, A>>()

  const cancel = runCallback(
    Effect.provideService(
      effect as Effect.Effect<RxContext, E, A>,
      Context,
      ctx
    ),
    function(exit) {
      ctx.setSelf(Result.fromExit(exit))
    }
  )
  ctx.addFinalizer(cancel)

  if (previous._tag === "Some") {
    return Result.waitingFrom(previous)
  }
  return Result.waiting(Option.none())
}

function makeEffectRuntime<R, E, A, RE>(
  ctx: Context,
  effect: Effect.Effect<R | RxContext, E, A>,
  runtime: RxRuntime<RE, R>
): Result.Result<E, A> {
  const previous = ctx.self<Result.Result<E, A>>()
  const runtimeResult = ctx.get(runtime)

  if (runtimeResult._tag !== "Success") {
    if (runtimeResult._tag === "Waiting") {
      return Result.waitingFrom(previous)
    }
    return runtimeResult as any
  }

  return makeEffect(ctx, effect as any, Runtime.runCallback(runtimeResult.value))
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const effect: {
  <E, A>(effect: Effect.Effect<RxContext, E, A>): Rx<Result.Result<E, A>>
  <RR, R extends (RR | RxContext), E, A, RE>(
    effect: Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<RE | E, A>>
} = <R, E, A, RE>(
  effect: Effect.Effect<R, E, A>,
  options?: { readonly runtime?: RxRuntime<RE, R> }
) =>
  readable<Result.Result<E, A>>(function(_get, ctx) {
    return options?.runtime
      ? makeEffectRuntime(ctx, effect, options.runtime)
      : makeEffect(ctx, effect as Effect.Effect<RxContext, E, A>)
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const scoped: {
  <E, A>(effect: Effect.Effect<Scope.Scope | RxContext, E, A>): Rx<Result.Result<E, A>>
  <RR, R extends (RR | RxContext | Scope.Scope), E, A, RE>(
    effect: Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<RE | E, A>>
} = <R, E, A, RE>(
  effect: Effect.Effect<R | Scope.Scope | RxContext, E, A>,
  options?: { readonly runtime?: RxRuntime<RE, R> }
) =>
  readable<Result.Result<E, A>>(function(_get, ctx) {
    const scope = Effect.runSync(Scope.make())
    ctx.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))

    const scopedEffect = Effect.provideService(
      effect as Effect.Effect<Scope.Scope | RxContext, E, A>,
      Scope.Scope,
      scope
    )

    if (options?.runtime !== undefined) {
      return makeEffectRuntime(ctx, scopedEffect, options.runtime)
    }
    return makeEffect(ctx, scopedEffect)
  })

/**
 * @since 1.0.0
 * @category models
 */
export interface RxResultFn<E, A, Args extends Array<any>> extends Writeable<Result.Result<E, A>, Args> {}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fn = <A, Args extends Array<any>>(
  initialValue: A,
  fn: (...args: Args) => A
) =>
  writeable<A, Args>(function(_ctx) {
    return initialValue
  }, function(_get, _set, setSelf, args) {
    setSelf(fn(...args))
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const effectFn: {
  <Args extends Array<any>, E, A>(fn: (...args: Args) => Effect.Effect<RxContext, E, A>): RxResultFn<E, A, Args>
  <Args extends Array<any>, RR, R extends (RR | RxContext), E, A, RE>(
    fn: (...args: Args) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): RxResultFn<RE | E, A, Args>
} = <Args extends Array<any>, R, E, A, RE>(
  f: (...args: Args) => Effect.Effect<R, E, A>,
  options?: { readonly runtime?: RxRuntime<RE, R> }
) => {
  const effectRx = state<Effect.Effect<R, E, A> | undefined>(undefined)
  return writeable<Result.Result<E, A>, Args>(function(get, ctx) {
    const effect = get(effectRx)
    if (effect === undefined) {
      return Result.initial()
    }
    return options?.runtime
      ? makeEffectRuntime(ctx, effect, options.runtime)
      : makeEffect(ctx, effect as Effect.Effect<RxContext, E, A>)
  }, function(_get, set, _setSelf, args) {
    set(effectRx, f(...args))
  })
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const scopedFn: {
  <Args extends Array<any>, E, A>(
    fn: (...args: Args) => Effect.Effect<RxContext | Scope.Scope, E, A>
  ): RxResultFn<E, A, Args>
  <Args extends Array<any>, RR, R extends (RR | RxContext | Scope.Scope), E, A, RE>(
    fn: (...args: Args) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): RxResultFn<RE | E, A, Args>
} = <Args extends Array<any>, R, E, A, RE>(
  f: (...args: Args) => Effect.Effect<R, E, A>,
  options?: { readonly runtime?: RxRuntime<RE, R> }
) => {
  const effectRx = state<Effect.Effect<R, E, A> | undefined>(undefined)
  return writeable<Result.Result<E, A>, Args>(function(_get, ctx) {
    const effect = ctx.get(effectRx)
    if (effect === undefined) {
      return Result.initial()
    }
    const scope = Effect.runSync(Scope.make())
    ctx.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))

    const scopedEffect = Effect.provideService(
      effect as Effect.Effect<Scope.Scope | RxContext, E, A>,
      Scope.Scope,
      scope
    )
    return options?.runtime
      ? makeEffectRuntime(ctx, scopedEffect, options.runtime)
      : makeEffect(ctx, scopedEffect as Effect.Effect<RxContext, E, A>)
  }, function(_get, set, _setSelf, args) {
    set(effectRx, f(...args))
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
  <E, A>(layer: Layer.Layer<never, E, A>): RxRuntime<E, A>
  <R, E, A, RR extends R, RE>(layer: Layer.Layer<R, E, A>, runtime: RxRuntime<RE, RR>): RxRuntime<E, A | RR>
} = <R, E, A, RE>(layer: Layer.Layer<R, E, A>, runtime?: RxRuntime<RE, R>): RxRuntime<E | RE, A> => {
  if (runtime === undefined) {
    return scoped(Layer.toRuntime(layer) as any)
  }

  return scoped(
    Effect.flatMap(
      Layer.build(layer),
      (context) => Effect.provideSomeContext(Effect.runtime<A>(), context)
    ),
    { runtime }
  )
}

function makeStream<E, A>(
  ctx: Context,
  stream: Stream.Stream<RxContext, E, A>,
  runCallback = Effect.runCallback
): Result.Result<E | NoSuchElementException, A> {
  const previous = ctx.self<Result.Result<E | NoSuchElementException, A>>()

  const cancel = runCallback(
    Effect.provideService(
      Stream.runForEach(
        stream,
        (a) => Effect.sync(() => ctx.setSelf(Result.waiting(Option.some(Result.success(a)))))
      ),
      Context,
      ctx
    ),
    (exit) => {
      if (exit._tag === "Failure") {
        ctx.setSelf(Result.failure(exit.cause))
      } else {
        pipe(
          ctx.self<Result.Result<E | NoSuchElementException, A>>(),
          Option.flatMap(Result.value),
          Option.match({
            onNone: () => ctx.setSelf(Result.fail(NoSuchElementException())),
            onSome: (a) => ctx.setSelf(Result.success(a))
          })
        )
      }
    }
  )
  ctx.addFinalizer(cancel)

  if (previous._tag === "Some") {
    return Result.waitingFrom(previous)
  }
  return Result.initial()
}

function makeStreamRuntime<R, E, A, RE>(
  ctx: Context,
  stream: Stream.Stream<R | RxContext, E, A>,
  runtime: RxRuntime<RE, R>
): Result.Result<E | NoSuchElementException, A> {
  const previous = ctx.self<Result.Result<E | NoSuchElementException, A>>()
  const runtimeResult = ctx.get(runtime)

  if (runtimeResult._tag !== "Success") {
    if (runtimeResult._tag === "Waiting") {
      return Result.waitingFrom(previous)
    }
    return runtimeResult as any
  }

  return makeStream(ctx, stream as any, Runtime.runCallback(runtimeResult.value))
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const stream: {
  <E, A>(stream: Stream.Stream<RxContext, E, A>): Rx<Result.Result<E | NoSuchElementException, A>>
  <RR, R extends (RR | RxContext), E, A, RE>(
    stream: Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): Rx<Result.Result<RE | E | NoSuchElementException, A>>
} = <R, E, A, RE>(
  stream: Stream.Stream<R, E, A>,
  runtime?: RxRuntime<RE, R>
) =>
  readable<Result.Result<E | NoSuchElementException, A>>(function(_get, ctx) {
    if (runtime !== undefined) {
      return makeStreamRuntime(ctx, stream, runtime)
    }
    return makeStream(ctx, stream as Stream.Stream<RxContext, E, A>)
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const streamPull: {
  <E, A>(stream: Stream.Stream<RxContext, E, A>, options?: {
    readonly disableAccumulation?: boolean
  }): Writeable<Result.Result<E | NoSuchElementException, Array<A>>, void>
  <RR, R extends (RR | RxContext), E, A, RE>(
    stream: Effect.Effect<R, E, A>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly disableAccumulation?: boolean
    }
  ): Writeable<Result.Result<RE | E | NoSuchElementException, Array<A>>, void>
} = <E, A>(
  stream: Stream.Stream<RxContext, E, A>,
  options?: {
    readonly runtime?: RxRuntime<any, any>
    readonly disableAccumulation?: boolean
  }
) => {
  stream = options?.disableAccumulation ? stream : pipe(
    Stream.chunks(stream),
    Stream.mapAccum(Chunk.empty<A>(), (acc, chunk) => {
      const next = Chunk.appendAll(acc, chunk)
      return [next, next]
    }),
    Stream.mapChunks(Chunk.flatten)
  )
  const pullRx = scoped(Stream.toPull(stream), options?.runtime as any)
  const counter = state(0)

  return writeable<Result.Result<E | NoSuchElementException, Array<A>>, void>(function(get, ctx) {
    const previous = ctx.self<Result.Result<E | NoSuchElementException, Array<A>>>()
    const pullResult = get(pullRx)
    if (pullResult._tag !== "Success") {
      if (pullResult._tag === "Waiting") {
        return Result.waitingFrom(previous)
      }
      return pullResult as any
    }
    get(counter)
    const pull = pipe(
      pullResult.value,
      Effect.map((_) => Chunk.toReadonlyArray(_) as Array<A>),
      Effect.catchAll((error): Effect.Effect<never, E | NoSuchElementException, Array<A>> =>
        Option.match(error, {
          onNone: () =>
            pipe(
              ctx.self<Result.Result<E | NoSuchElementException, Array<A>>>(),
              Option.flatMap(Result.value),
              Option.match({
                onNone: () => Effect.fail(NoSuchElementException()),
                onSome: Effect.succeed
              })
            ),
          onSome: Effect.fail
        })
      )
    )
    return options?.runtime
      ? makeEffectRuntime(ctx, pull, options.runtime)
      : makeEffect(ctx, pull)
  }, function(get, set, _setSelf, _) {
    set(counter, get(counter) + 1)
  }, function(refresh) {
    refresh(pullRx)
  })
}

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
 * @category accessors
 */
export const access = <A>(rx: Rx<A>): Effect.Effect<RxContext, never, A> =>
  Effect.map(
    Context,
    (ctx) => ctx.get(rx)
  )

/**
 * @since 1.0.0
 * @category accessors
 */
export const accessResult = <E, A>(
  rx: Rx<Result.Result<E, A>>
): Effect.Effect<RxContext, E | NoSuchElementException, A> =>
  Effect.flatMap(
    Context,
    (ctx): Effect.Effect<never, E | NoSuchElementException, A> => {
      const result = Result.noWaiting(ctx.get(rx))
      switch (result._tag) {
        case "Success": {
          return Effect.succeed(result.value)
        }
        case "Failure": {
          return Effect.failCause(result.cause)
        }
        default: {
          return Effect.fail(NoSuchElementException())
        }
      }
    }
  )
