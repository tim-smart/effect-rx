/**
 * @since 1.0.0
 */
import * as Result from "@effect-rx/rx/Result"
import * as EffectContext from "@effect/data/Context"
import * as Equal from "@effect/data/Equal"
import * as Hash from "@effect/data/Hash"
import * as Inspectable from "@effect/data/Inspectable"
import type * as Option from "@effect/data/Option"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import { NoSuchElementException } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Layer from "@effect/io/Layer"
import type * as Queue_ from "@effect/io/Queue"
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
  readonly read: (ctx: Context<A>) => A
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
  export type SubscribeWithPrevious = <A>(rx: Rx<A>, f: (prev: Option.Option<A>, value: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Queue = <A>(rx: Rx<A>) => Effect.Effect<Scope.Scope, never, Queue_.Dequeue<A>>
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
export interface Context<A> {
  readonly get: Rx.Get
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly refresh: Rx.Refresh
  readonly refreshSelf: () => void
  readonly self: () => Option.Option<A>
  readonly setSelf: (a: A) => void
  readonly set: Rx.Set
  readonly subscribe: <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
  readonly subscribeWithPrevious: <A>(rx: Rx<A>, f: (prev: Option.Option<A>, value: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
  readonly queue: <A>(rx: Rx<A>) => Effect.Effect<never, never, Queue_.Dequeue<A>>
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
export const Context = EffectContext.Tag<RxContext, Context<unknown>>("@effect-rx/rx/Rx/Context")

/**
 * @since 1.0.0
 * @category context
 */
export const context = <A>(): Effect.Effect<RxContext, never, Context<A>> => Context as any

/**
 * @since 1.0.0
 * @category context
 */
export const contextResult = <E, A>(): Effect.Effect<RxContext, never, Context<Result.Result<E, A>>> => Context as any

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
  read: (ctx: Context<A>) => A,
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
export const writable = <R, W>(
  read: (ctx: Context<R>) => R,
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
  writable(
    function(_ctx) {
      return initialValue
    },
    function(_get, _set, setSelf, value) {
      setSelf(value)
    }
  )

/**
 * @since 1.0.0
 * @category models
 */
export interface RxResult<E, A> extends Rx<Result.Result<E, A>> {}

function makeEffect<E, A>(
  ctx: Context<Result.Result<E, A>>,
  effect: Effect.Effect<RxContext, E, A>,
  runCallback = Effect.runCallback
): Result.Result<E, A> {
  const previous = ctx.self()

  const cancel = runCallback(
    Effect.provideService(
      effect as Effect.Effect<RxContext, E, A>,
      Context,
      ctx as Context<unknown>
    ),
    function(exit) {
      ctx.setSelf(Result.fromExit(exit))
    }
  )
  ctx.addFinalizer(cancel)

  if (previous._tag === "Some") {
    return Result.waitingFrom(previous)
  }
  return Result.initial()
}

function makeEffectRuntime<R, E, A, RE>(
  ctx: Context<Result.Result<E, A>>,
  effect: Effect.Effect<R | RxContext, E, A>,
  runtime: RxRuntime<RE, R>
): Result.Result<E, A> {
  const previous = ctx.self()
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
  <E, A>(effect: Effect.Effect<RxContext, E, A>): RxResult<E, A>
  <RR, R extends (RR | RxContext), E, A, RE>(
    effect: Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): RxResult<RE | E, A>
} = <R, E, A, RE>(
  effect: Effect.Effect<R, E, A>,
  runtime?: RxRuntime<RE, Exclude<R, RxContext>>
) =>
  readable<Result.Result<E, A>>(function(ctx) {
    if (runtime !== undefined) {
      return makeEffectRuntime(ctx, effect, runtime as any)
    }
    return makeEffect(ctx, effect as Effect.Effect<RxContext, E, A>)
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const scoped: {
  <E, A>(effect: Effect.Effect<Scope.Scope | RxContext, E, A>): RxResult<E, A>
  <RR, R extends (RR | RxContext | Scope.Scope), E, A, RE>(
    effect: Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): RxResult<RE | E, A>
} = <R, E, A, RE>(
  effect: Effect.Effect<R | Scope.Scope | RxContext, E, A>,
  runtime?: RxRuntime<RE, R>
) =>
  readable<Result.Result<E, A>>(function(ctx) {
    const scope = Effect.runSync(Scope.make())
    ctx.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))

    const scopedEffect = Effect.provideService(
      effect as Effect.Effect<Scope.Scope | RxContext, E, A>,
      Scope.Scope,
      scope
    )

    if (runtime !== undefined) {
      return makeEffectRuntime(ctx, scopedEffect, runtime)
    }

    return makeEffect(ctx, scopedEffect)
  })

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
    runtime
  )
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
export const accessResult = <E, A>(rx: RxResult<E, A>): Effect.Effect<RxContext, E | NoSuchElementException, A> =>
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
