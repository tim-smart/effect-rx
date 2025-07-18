/**
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as FiberRef from "effect/FiberRef"
import { dual } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Mailbox from "effect/Mailbox"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import type { Registry } from "./index.js"
import * as internal from "./internal/registry.js"
import * as Result from "./Result.js"
import type * as Rx from "./Rx.js"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Registry {
  readonly [TypeId]: TypeId
  readonly getNodes: () => ReadonlyMap<Rx.Rx<any> | string, Node<any>>
  readonly get: <A>(rx: Rx.Rx<A>) => A
  readonly mount: <A>(rx: Rx.Rx<A>) => () => void
  readonly refresh: <A>(rx: Rx.Rx<A>) => void
  readonly set: <R, W>(rx: Rx.Writable<R, W>, value: W) => void
  readonly setSerializable: (key: string, encoded: unknown) => void
  readonly modify: <R, W, A>(rx: Rx.Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]) => A
  readonly update: <R, W>(rx: Rx.Writable<R, W>, f: (_: R) => W) => void
  readonly subscribe: <A>(rx: Rx.Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void
  readonly reset: () => void
  readonly dispose: () => void
}

/**
 * @since 1.0.0
 * @category models
 */
interface Node<A> {
  readonly rx: Rx.Rx<A>
  readonly value: () => A
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const make: (
  options?: {
    readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
    readonly scheduleTask?: ((f: () => void) => void) | undefined
    readonly timeoutResolution?: number | undefined
    readonly defaultIdleTTL?: number | undefined
  } | undefined
) => Registry = internal.make

/**
 * @since 1.0.0
 * @category Tags
 */
export class RxRegistry extends Context.Tag("@effect/rx/Registry/CurrentRegistry")<
  RxRegistry,
  Registry
>() {}

/**
 * @since 1.0.0
 * @category Layers
 */
export const layerOptions = (options?: {
  readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}): Layer.Layer<RxRegistry> =>
  Layer.scoped(
    RxRegistry,
    Effect.gen(function*() {
      const scope = yield* Effect.scope
      const scheduler = yield* FiberRef.get(FiberRef.currentScheduler)
      const registry = internal.make({
        ...options,
        scheduleTask: options?.scheduleTask ?? ((f) => scheduler.scheduleTask(f, 0))
      })
      yield* Scope.addFinalizer(scope, Effect.sync(() => registry.dispose()))
      return registry
    })
  )

/**
 * @since 1.0.0
 * @category Layers
 */
export const layer: Layer.Layer<Registry.RxRegistry> = layerOptions()

// -----------------------------------------------------------------------------
// conversions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStream: {
  <A>(rx: Rx.Rx<A>): (self: Registry) => Stream.Stream<A>
  <A>(self: Registry, rx: Rx.Rx<A>): Stream.Stream<A>
} = dual(
  2,
  <A>(self: Registry, rx: Rx.Rx<A>) =>
    Stream.unwrapScoped(
      Effect.contextWithEffect((context: Context.Context<Scope.Scope>) => {
        const scope = Context.get(context, Scope.Scope)
        return Mailbox.make<A>().pipe(
          Effect.tap((mailbox) => {
            const cancel = self.subscribe(rx, (value) => mailbox.unsafeOffer(value), {
              immediate: true
            })
            return Scope.addFinalizer(
              scope,
              Effect.suspend(() => {
                cancel()
                return mailbox.shutdown
              })
            )
          }),
          Effect.uninterruptible,
          Effect.map((mailbox) => Mailbox.toStream(mailbox))
        )
      })
    )
)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const toStreamResult: {
  <A, E>(rx: Rx.Rx<Result.Result<A, E>>): (self: Registry) => Stream.Stream<A, E, RxRegistry>
  <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Stream.Stream<A, E, RxRegistry>
} = dual(
  2,
  <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Stream.Stream<A, E, RxRegistry> =>
    toStream(self, rx).pipe(
      Stream.filter(Result.isNotInitial),
      Stream.mapEffect((result) =>
        result._tag === "Success" ? Effect.succeed(result.value) : Effect.failCause(result.cause)
      )
    )
)

/**
 * @since 1.0.0
 * @category Conversions
 */
export const getResult: {
  <A, E>(rx: Rx.Rx<Result.Result<A, E>>): (self: Registry) => Effect.Effect<A, E>
  <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Effect.Effect<A, E>
} = dual(2, <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Effect.Effect<A, E> =>
  Effect.async((resume) => {
    const result = self.get(rx)
    if (result._tag !== "Initial") {
      return resume(Result.toExit(result) as any)
    }
    const cancel = self.subscribe(rx, (value) => {
      if (value._tag !== "Initial") {
        resume(Result.toExit(value) as any)
        cancel()
      }
    })
    return Effect.sync(cancel)
  }))
