/**
 * @since 1.0.0
 */
import * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Effectable from "effect/Effectable"
import type { Exit } from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import type { Handle, Notifiable, Reactive } from "./Reactive.js"
import * as Result from "./Result.js"
import type { PullResult } from "./Rx.js"

/**
 * @since 1.0.0
 * @category Symbols
 */
export const TypeId: unique symbol = Symbol.for("@effect-rx/rx/ReactiveRef")

/**
 * @since 1.0.0
 * @category Symbols
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category Models
 */
export interface ReadonlyReactiveRef<out A> extends Handle, Effect.Effect<A, never, Reactive> {
  readonly [TypeId]: TypeId
  subscribe(notifiable: Notifiable): void
  value: A
}

/**
 * @since 1.0.0
 * @category Models
 */
export interface ReactiveRef<in out A> extends ReadonlyReactiveRef<A> {
  readonly [TypeId]: TypeId
  subscribe(notifiable: Notifiable): void
  unsafeSet(value: A): void
  value: A
}

const proto = {
  ...Effectable.CommitPrototype,
  [TypeId]: TypeId,
  commit(this: ReactiveRef<any>) {
    return subscribe(this)
  }
}

/**
 * @since 1.0.0
 * @category Constructors
 */
export const unsafeMake = <A>(value: A): ReactiveRef<A> => {
  const subscribers = new Set<Notifiable>()
  const self = {
    ...proto,
    subscribe(reactive) {
      subscribers.add(reactive)
    },
    unsubscribe(reactive) {
      subscribers.delete(reactive)
    },
    unsafeSet(value) {
      if (self.value === value) return
      self.value = value
      for (const subscriber of subscribers) {
        subscriber.notify()
      }
    },
    value
  } as ReactiveRef<A>
  return self
}

/**
 * @since 1.0.0
 * @category Constructors
 */
export const make = <A>(value: A): Effect.Effect<ReactiveRef<A>> => Effect.sync(() => unsafeMake(value))

/**
 * @since 1.0.0
 * @category Combinators
 */
export const unsafeGet = <A>(self: ReactiveRef<A>): A => self.value

/**
 * @since 1.0.0
 * @category Combinators
 */
export const get = <A>(self: ReadonlyReactiveRef<A>): Effect.Effect<A> => Effect.sync(() => self.value)

const reactiveTag = Context.GenericTag<Reactive, Reactive["Type"]>("@effect-rx/rx/Reactive")
const reactiveWith = <A, E, R>(
  f: (reactive: Reactive["Type"]) => Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | Reactive> =>
  Effect.withFiberRuntime((fiber) => f(Context.unsafeGet(fiber.currentContext, reactiveTag)))

/**
 * @since 1.0.0
 * @category Combinators
 */
export const subscribe = <A>(self: ReadonlyReactiveRef<A>): Effect.Effect<A, never, Reactive> =>
  reactiveWith((reactive) => {
    reactive.addHandle(self)
    self.subscribe(reactive)
    return Effect.succeed(self.value)
  })

/**
 * @since 1.0.0
 * @category Combinators
 */
export const subscribeResult = <A, E>(
  self: ReactiveRef<Result.Result<A, E>>
): Effect.Effect<Result.Success<A, E> | Result.Failure<A, E>, never, Reactive> =>
  reactiveWith((reactive) => {
    reactive.addHandle(self)
    self.subscribe(reactive)
    return Result.isInitial(self.value) ? Effect.never : Effect.succeed(self.value)
  })

/**
 * @since 1.0.0
 * @category Combinators
 */
export const subscribeResultUnwrap = <A, E>(
  self: ReadonlyReactiveRef<Result.Result<A, E>>
): Effect.Effect<A, E, Reactive> =>
  reactiveWith((reactive) => {
    reactive.addHandle(self)
    self.subscribe(reactive)
    return Result.isInitial(self.value) ? Effect.never : Result.toExit(self.value) as Exit<A, E>
  })

/**
 * @since 1.0.0
 * @category Combinators
 */
export const unsafeSet: {
  <A>(value: A): (self: ReactiveRef<A>) => void
  <A>(self: ReactiveRef<A>, value: A): void
} = dual(2, <A>(self: ReactiveRef<A>, value: A) => self.unsafeSet(value))

/**
 * @since 1.0.0
 * @category Combinators
 */
export const set: {
  <A>(value: A): (self: ReactiveRef<A>) => Effect.Effect<void>
  <A>(self: ReactiveRef<A>, value: A): Effect.Effect<void>
} = dual(2, <A>(self: ReactiveRef<A>, value: A) => Effect.sync(() => unsafeSet(self, value)))

/**
 * @since 1.0.0
 * @category Combinators
 */
export const unsafeModify: {
  <R, A>(f: (_: A) => readonly [returnValue: R, nextValue: A]): (self: ReactiveRef<A>) => R
  <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): R
} = dual(2, <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): R => {
  const [returnValue, nextValue] = f(self.value)
  unsafeSet(self, nextValue)
  return returnValue
})

/**
 * @since 1.0.0
 * @category Combinators
 */
export const modify: {
  <R, A>(f: (_: A) => readonly [returnValue: R, nextValue: A]): (self: ReactiveRef<A>) => Effect.Effect<R>
  <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): Effect.Effect<R>
} = dual(
  2,
  <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): Effect.Effect<R> =>
    Effect.sync(() => unsafeModify(self, f))
)

/**
 * @since 1.0.0
 * @category Combinators
 */
export const unsafeUpdate: {
  <A>(f: (_: A) => A): (self: ReactiveRef<A>) => void
  <A>(self: ReactiveRef<A>, f: (_: A) => A): void
} = dual(2, <A>(self: ReactiveRef<A>, f: (_: A) => A) => {
  unsafeSet(self, f(self.value))
})

/**
 * @since 1.0.0
 * @category Combinators
 */
export const update: {
  <A>(f: (_: A) => A): (self: ReactiveRef<A>) => Effect.Effect<void>
  <A>(self: ReactiveRef<A>, f: (_: A) => A): Effect.Effect<void>
} = dual(2, <A>(self: ReactiveRef<A>, f: (_: A) => A) => Effect.sync(() => unsafeUpdate(self, f)))

/**
 * @since 1.0.0
 * @category Conversions
 */
export const into: {
  <A, E>(
    self: ReactiveRef<Result.Result<A, E>>
  ): <R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<void, never, R | Scope.Scope>
  <A, E, R>(
    self: ReactiveRef<Result.Result<A, E>>,
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<void, never, R | Scope.Scope>
} = function() {
  if (arguments.length === 1) {
    const ref = arguments[0] as ReactiveRef<Result.Result<any, any>>
    return (effect: Effect.Effect<any, any, any>) => intoImpl(ref, effect)
  }
  return intoImpl(arguments[0], arguments[1]) as any
}

/**
 * @since 1.0.0
 * @category Conversions
 */
export const fromEffect = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<
  ReadonlyReactiveRef<Result.Result<A, E>>,
  never,
  R | Scope.Scope
> =>
  Effect.suspend(() => {
    const ref = unsafeMake<Result.Result<A, E>>(Result.initial(true))
    return Effect.as(intoImpl(ref, effect), ref)
  })

/**
 * @since 1.0.0
 * @category Conversions
 */
export const intoStream: {
  <A, E>(
    self: ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>
  ): <R>(stream: Stream.Stream<A, E, R>) => Effect.Effect<void, never, R | Scope.Scope>
  <A, E, R>(
    self: ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>,
    stream: Stream.Stream<A, E, R>
  ): Effect.Effect<void, never, R | Scope.Scope>
} = function() {
  if (arguments.length === 1) {
    const ref = arguments[0] as ReactiveRef<Result.Result<any, any>>
    return (stream: Stream.Stream<any, any, any>) => intoStreamImpl(ref, stream)
  }
  return intoStreamImpl(arguments[0], arguments[1]) as any
}

/**
 * @since 1.0.0
 * @category Conversions
 */
export const fromStream = <A, E, R>(stream: Stream.Stream<A, E, R>): Effect.Effect<
  ReadonlyReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>,
  never,
  R | Scope.Scope
> =>
  Effect.suspend(() => {
    const ref = unsafeMake<Result.Result<A, E | Cause.NoSuchElementException>>(Result.initial(true))
    return Effect.as(intoStreamImpl(ref, stream), ref)
  })

/**
 * @since 1.0.0
 * @category Conversions
 */
export const intoStreamPull: {
  <A, E>(
    self: ReactiveRef<PullResult<A, E>>
  ): <R>(stream: Stream.Stream<A, E, R>) => Effect.Effect<() => void, never, R | Scope.Scope>
  <A, E, R>(
    self: ReactiveRef<PullResult<A, E>>,
    stream: Stream.Stream<A, E, R>
  ): Effect.Effect<() => void, never, R | Scope.Scope>
} = function() {
  if (arguments.length === 1) {
    const ref = arguments[0]
    return (stream: Stream.Stream<any, any, any>) => intoStreamPullImpl(ref, stream)
  }
  return intoStreamPullImpl(arguments[0], arguments[1]) as any
}

/**
 * @since 1.0.0
 * @category Conversions
 */
export const fromStreamPull = <A, E, R>(stream: Stream.Stream<A, E, R>): Effect.Effect<
  {
    readonly ref: ReadonlyReactiveRef<PullResult<A, E>>
    readonly pull: () => void
  },
  never,
  R | Scope.Scope
> =>
  Effect.suspend(() => {
    const ref = unsafeMake<PullResult<A, E>>(Result.initial(true))
    return Effect.map(intoStreamPullImpl(ref, stream), (pull) => ({ ref, pull }))
  })

// ----------------------------------------------------------------------------
// Internal
// ----------------------------------------------------------------------------

const intoImpl = <A, E, R>(
  self: ReactiveRef<Result.Result<A, E>>,
  effect: Effect.Effect<A, E, R>
) =>
  Effect.uninterruptible(Effect.withFiberRuntime<void, never, R | Scope.Scope>((parentFiber) => {
    const scope = Context.unsafeGet(parentFiber.currentContext, Scope.Scope)
    const runFork = Runtime.runFork(Runtime.make({
      context: parentFiber.currentContext as Context.Context<R>,
      runtimeFlags: Runtime.defaultRuntime.runtimeFlags,
      fiberRefs: parentFiber.getFiberRefs()
    }))
    const fiber = runFork(
      Effect.onExit(effect, (exit) => update(self, (prev) => Result.fromExitWithPrevious(exit, Option.some(prev))))
    )
    return Scope.addFinalizer(scope, Fiber.interrupt(fiber))
  }))

const intoStreamImpl = <A, E, R>(
  self: ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>,
  stream: Stream.Stream<A, E, R>
) =>
  Effect.uninterruptible(Effect.withFiberRuntime<void, never, R | Scope.Scope>((parentFiber) => {
    const scope = Context.unsafeGet(parentFiber.currentContext, Scope.Scope)
    const runFork = Runtime.runFork(Runtime.make({
      context: parentFiber.currentContext as Context.Context<R>,
      runtimeFlags: Runtime.defaultRuntime.runtimeFlags,
      fiberRefs: parentFiber.getFiberRefs()
    }))
    const fiber = runFork(Stream.runForEachChunk(stream, (chunk) =>
      Effect.sync(() => {
        if (Chunk.isNonEmpty(chunk)) {
          self.unsafeSet(Result.success(Chunk.lastNonEmpty(chunk), true))
        }
      })))
    fiber.addObserver((exit) => {
      if (exit._tag === "Failure") {
        unsafeUpdate(self, (result) => Result.failureWithPrevious(exit.cause, Option.some(result)))
      } else {
        unsafeUpdate(
          self,
          Result.match({
            onInitial(_) {
              return Result.fail(new Cause.NoSuchElementException("No value was emitted"))
            },
            onFailure(_) {
              return Result.failure(_.cause)
            },
            onSuccess(_) {
              return Result.success(_.value)
            }
          })
        )
      }
    })
    return Scope.addFinalizer(scope, Fiber.interrupt(fiber))
  }))

const intoStreamPullImpl = <A, E, R>(
  self: ReactiveRef<PullResult<A, E>>,
  stream: Stream.Stream<A, E, R>
): Effect.Effect<() => void, never, Scope.Scope | R> =>
  Effect.uninterruptible(Effect.withFiberRuntime<() => void, never, R | Scope.Scope>((parentFiber) => {
    const scope = Context.unsafeGet(parentFiber.currentContext, Scope.Scope)
    const latch = Effect.unsafeMakeLatch(false)
    const pull = () => latch.unsafeOpen()
    const runFork = Runtime.runFork(Runtime.make({
      context: parentFiber.currentContext as Context.Context<R>,
      runtimeFlags: Runtime.defaultRuntime.runtimeFlags,
      fiberRefs: parentFiber.getFiberRefs()
    }))
    const fiber = runFork(Stream.runForEachChunk(stream, (chunk) =>
      Effect.suspend(() => {
        if (!Chunk.isNonEmpty(chunk)) {
          return Effect.void
        }
        latch.unsafeClose()
        self.unsafeSet(Result.success({
          items: Chunk.toReadonlyArray(chunk) as any,
          done: false
        }, false))
        return Effect.tap(latch.await, () => {
          unsafeUpdate(self, (result) => Result.waitingFrom(Option.some(result)))
        })
      })))
    fiber.addObserver((exit) => {
      if (exit._tag === "Failure") {
        unsafeUpdate(self, (result) => Result.failureWithPrevious(exit.cause, Option.some(result)))
      } else {
        unsafeUpdate(
          self,
          Result.match({
            onInitial(_) {
              return Result.fail(new Cause.NoSuchElementException("No value was emitted"))
            },
            onFailure(_) {
              return Result.failure(_.cause)
            },
            onSuccess(_) {
              return Result.success({
                ..._.value,
                done: true
              })
            }
          })
        )
      }
    })
    return Effect.as(Scope.addFinalizer(scope, Fiber.interrupt(fiber)), pull)
  }))
