/**
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Deferred from "effect/Deferred"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { dual } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import * as MutableHashMap from "effect/MutableHashMap"
import * as Option from "effect/Option"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import { runCallbackSync } from "./internal/runtime.js"
import * as Result from "./Result.js"

/**
 * @since 1.0.0
 * @category Reactive
 */
export class Reactive extends Context.Tag("@effect-rx/rx/Reactive")<
  Reactive,
  {
    disposed: boolean
    notify(): void
    emit(value: unknown): void
    addHandle(handle: Handle): void
    cache<A, E, R>(key: unknown, value: Effect.Effect<A, E, R>): Effect.Effect<A, E, Exclude<R, Scope.Scope>>
  }
>() {
  /**
   * @since 1.0.0
   */
  static with<A, E, R>(f: (reactive: Reactive["Type"]) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R | Reactive> {
    return Effect.withFiberRuntime((fiber) => {
      const reactive = fiber.currentContext.unsafeMap.get(Reactive.key) as Reactive["Type"]
      return f(reactive)
    })
  }
}

/**
 * Immediately emits a value for the current reactive context.
 *
 * @since 1.0.0
 * @category Reactive
 */
export const emit = <A = unknown>(value: A): Effect.Effect<void, never, Reactive> =>
  Reactive.with((reactive) => {
    reactive.emit(value)
    return Effect.void
  })

/**
 * Cache an Effect for the lifetime of the current reactive context.
 *
 * @since 1.0.0
 * @category Reactive
 */
export const cache =
  (...key: ReadonlyArray<unknown>) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, Exclude<R, Scope.Scope> | Reactive> =>
    Reactive.with((reactive) => reactive.cache(Data.array(key), effect))

/**
 * @since 1.0.0
 * @category Handle
 */
export interface Handle {
  unsubscribe(reactive: Reactive["Type"]): void
}

/**
 * @since 1.0.0
 * @category Subscribable
 */
export interface Subscribable<out A, out E> {
  subscribe(onResult: (result: Result.Result<A, E>) => void): () => void
}

const defaultMemoMap = globalValue(
  "@effect-rx/rx/Reactive/defaultMemoMap",
  () => Effect.runSync(Layer.makeMemoMap)
)

/**
 * @since 1.0.0
 * @category Subscribable
 */
export const toSubscribableWith = <R, ER>(
  build: (scope: Scope.Scope, memoMap: Layer.MemoMap) => Effect.Effect<Context.Context<R>, ER>,
  memoMap?: Layer.MemoMap | undefined
) => {
  const buildMemoMap = memoMap ?? defaultMemoMap

  return <A, E>(effect: Effect.Effect<A, E, R | Reactive | Scope.Scope>): Subscribable<A, E | ER> => {
    let result: Result.Result<A, E | ER> = Result.initial(true)
    let waiting = false
    const callbacks = new Set<(result: Result.Result<A, E | ER>) => void>()
    let scope: Scope.CloseableScope | undefined
    let cancel: (() => void) | undefined
    let currentScope: Scope.CloseableScope | undefined
    let handles: Array<Handle> = []
    let reactive: Reactive["Type"] | undefined

    function setResult(newResult: Result.Result<A, E | ER>) {
      waiting = false
      result = newResult
      for (const callback of callbacks) {
        callback(result)
      }
    }

    function onExit(exit: Exit.Exit<A, E | ER>) {
      waiting = false
      cancel = undefined
      setResult(Result.fromExitWithPrevious(exit, Option.some(result)))
    }

    function start() {
      scope = Effect.runSync(Scope.make())
      currentScope = Effect.runSync(Scope.make())

      const initial = Effect.flatMap(
        build(scope, buildMemoMap),
        (context) => {
          let pending = false
          function run() {
            pending = false

            if (cancel) cancel()
            Effect.runFork(Scope.close(currentScope!, Exit.void))

            const prevHandles = handles
            handles = []
            waiting = true
            currentScope = Effect.runSync(Scope.make())
            cancel = runCallback(Scope.extend(effect, currentScope), onExit)

            if (waiting) {
              setResult(Result.waitingFrom(Option.some(result)))
            }

            for (const handle of prevHandles) {
              if (handles.includes(handle)) continue
              handle.unsubscribe(reactive!)
            }
          }

          let cache: MutableHashMap.MutableHashMap<unknown, Effect.Effect<any, any>> | undefined
          reactive = {
            disposed: false,
            notify() {
              if (pending || this.disposed) return
              pending = true
              queueMicrotask(run)
            },
            emit(value: A) {
              if (this.disposed) return
              setResult(Result.success(value, true))
            },
            addHandle(handle) {
              if (this.disposed) {
                queueMicrotask(() => handle.unsubscribe(reactive!))
                return
              }
              handles.push(handle)
            },
            cache<A, E, R>(key: unknown, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, Exclude<R, Scope.Scope>> {
              return Effect.withFiberRuntime((fiber) => {
                if (!cache) {
                  cache = MutableHashMap.empty()
                }
                const maybeValue = MutableHashMap.get(cache, key)
                if (Option.isSome(maybeValue)) {
                  return maybeValue.value
                }
                const deferred = Deferred.unsafeMake<any, any>(fiber.id())
                MutableHashMap.set(cache, key, Deferred.await(deferred))
                return effect.pipe(
                  Scope.extend(scope!),
                  Effect.onExit((exit) => Deferred.done(deferred, exit))
                )
              })
            }
          }

          const fiber = Option.getOrThrow(Fiber.getCurrentFiber())
          const contextReactive = Context.add(context, Reactive, reactive)
          const runtime = Runtime.make({
            context: contextReactive,
            runtimeFlags: Runtime.defaultRuntime.runtimeFlags,
            fiberRefs: fiber.getFiberRefs()
          })
          const runCallback = runCallbackSync(runtime)
          return Effect.provide(effect, Context.add(contextReactive, Scope.Scope, currentScope!))
        }
      )

      waiting = true
      cancel = runCallbackSync(Runtime.defaultRuntime)(initial, onExit)
    }

    return {
      subscribe(onResult) {
        callbacks.add(onResult)

        if (!scope) {
          start()
          if (waiting) {
            onResult(result)
          }
        } else {
          onResult(result)
        }

        return () => {
          callbacks.delete(onResult)
          if (callbacks.size > 0) return
          result = Result.initial(true)
          reactive!.disposed = true
          if (cancel) cancel()
          Effect.runFork(Scope.close(currentScope!, Exit.void))
          cancel = currentScope = undefined
          for (const handle of handles) {
            handle.unsubscribe(reactive!)
          }
          handles = []
          reactive = undefined
          Effect.runFork(Scope.close(scope!, Exit.void))
          scope = undefined
        }
      }
    }
  }
}

/**
 * @since 1.0.0
 * @category Subscribable
 */
export const toSubscribable = <R, ER>(
  layer: Layer.Layer<R, ER>,
  memoMap?: Layer.MemoMap | undefined
): <A, E>(effect: Effect.Effect<A, E, Reactive | Scope.Scope | R>) => Subscribable<A, ER | E> =>
  toSubscribableWith((scope, memoMap) => Layer.buildWithMemoMap(layer, memoMap, scope), memoMap)

/**
 * @since 1.0.0
 * @category Readable
 */
export interface Readable<out A, out E, out R> {
  readonly effect: Effect.Effect<A, E, R | Reactive>
  readonly result: Effect.Effect<Result.Result<A, E>, never, R | Reactive>
  readonly success: Effect.Effect<Result.Success<A, never>, E, R | Reactive>
}

/**
 * @since 1.0.0
 * @category Readable
 */
export const readable = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Readable<A, E, Exclude<R, Reactive | Scope.Scope>> => {
  let context: Context.Context<R> | undefined
  const sub = toSubscribableWith(() => Effect.succeed(context!))(effect)

  const subscribers = new Set<Reactive["Type"]>()
  const pending = new Set<Reactive["Type"]>()
  let cancel: (() => void) | undefined
  const handle: Handle = {
    unsubscribe(reactive) {
      subscribers.delete(reactive)
      pending.delete(reactive)
      if (subscribers.size === 0 && cancel) {
        cancel()
        cancel = context = currentResult = undefined
      }
    }
  }

  const resumes = {
    effect: new Set<(_: Effect.Effect<A, E>) => void>(),
    success: new Set<(_: Effect.Effect<Result.Success<A>, E>) => void>()
  }

  let currentResult: Result.Result<A, E> | undefined
  function start() {
    cancel = sub.subscribe((result) => {
      currentResult = result
      if (result._tag !== "Initial") {
        if (resumes.effect.size > 0) {
          const exit = Result.toExit(result)
          for (const resume of resumes.effect) {
            resume(exit as any)
          }
          resumes.effect.clear()
        }
        if (resumes.success.size > 0) {
          const exit: Exit.Exit<Result.Success<A, E>, E> = result._tag === "Success"
            ? Exit.succeed(result)
            : Exit.failCause(result.cause)
          for (const resume of resumes.success) {
            resume(exit as any)
          }
          resumes.success.clear()
        }
      }
      for (const reactive of pending) {
        reactive.notify()
      }
      pending.clear()
    })
  }

  return {
    effect: Effect.withFiberRuntime((fiber) => {
      const reactive = fiber.currentContext.unsafeMap.get(Reactive.key) as Reactive["Type"]
      context = fiber.currentContext as any
      reactive.addHandle(handle)
      subscribers.add(reactive)
      if (!cancel) {
        start()
      }
      if (currentResult!._tag !== "Initial") {
        pending.add(reactive)
        return Result.toExit(currentResult!) as Effect.Effect<A, E>
      }
      return Effect.tap(
        Effect.async<A, E>((resume) => {
          if (currentResult!._tag !== "Initial") {
            return resume(Result.toExit(currentResult!) as any)
          }
          resumes.effect.add(resume)
          return Effect.sync(() => {
            resumes.effect.delete(resume)
          })
        }),
        () => {
          pending.add(reactive)
        }
      )
    }),
    success: Effect.withFiberRuntime((fiber) => {
      const reactive = fiber.currentContext.unsafeMap.get(Reactive.key) as Reactive["Type"]
      context = fiber.currentContext as any
      reactive.addHandle(handle)
      subscribers.add(reactive)
      if (!cancel) {
        start()
      }
      if (currentResult!._tag !== "Initial") {
        pending.add(reactive)
        return currentResult!._tag === "Success"
          ? Effect.succeed(currentResult as Result.Success<A>)
          : Effect.failCause(currentResult!.cause)
      }
      return Effect.tap(
        Effect.async<Result.Success<A>, E>((resume) => {
          if (currentResult!._tag !== "Initial") {
            return resume(
              currentResult!._tag === "Success"
                ? Effect.succeed(currentResult as Result.Success<A>)
                : Effect.failCause(currentResult!.cause)
            )
          }
          resumes.success.add(resume)
          return Effect.sync(() => {
            resumes.success.delete(resume)
          })
        }),
        () => {
          pending.add(reactive)
        }
      )
    }),
    result: Effect.withFiberRuntime((fiber) => {
      const reactive = fiber.currentContext.unsafeMap.get(Reactive.key) as Reactive["Type"]
      context = fiber.currentContext as any
      reactive.addHandle(handle)
      subscribers.add(reactive)
      if (!cancel) {
        start()
      }
      pending.add(reactive)
      return Effect.succeed(currentResult!)
    })
  }
}

/**
 * @since 1.0.0
 * @category Layer
 */
export const layerTimeToLive: {
  (duration: Duration.DurationInput): <A, E, R>(self: Layer.Layer<A, E, R>) => Layer.Layer<A, E, R>
  <A, E, R>(self: Layer.Layer<A, E, R>, duration: Duration.DurationInput): Layer.Layer<A, E, R>
} = dual(2, <A, E, R>(self: Layer.Layer<A, E, R>, duration: Duration.DurationInput): Layer.Layer<A, E, R> => {
  const cache = new Map<Layer.MemoMap, {
    readonly context: Context.Context<A>
    readonly finalizer: Effect.Effect<void>
    refCount: number
    fiber: Fiber.Fiber<void> | undefined
  }>()
  const resolvedDuration = Duration.decode(duration)

  return Layer.scopedContext(Effect.gen(function*() {
    const context = yield* Effect.context<Scope.Scope>()
    const memoMap = Context.get(context, Layer.CurrentMemoMap)
    const layerScope = Context.get(context, Scope.Scope)

    if (cache.has(memoMap)) {
      const entry = cache.get(memoMap)!
      if (entry.fiber) {
        yield* Fiber.interrupt(entry.fiber)
        entry.fiber = undefined
      }
      if (Duration.isFinite(resolvedDuration)) {
        yield* Scope.addFinalizer(layerScope, entry.finalizer)
        entry.refCount++
      }
      return entry.context
    }

    const childScope = yield* Scope.make()
    const built = yield* Layer.buildWithMemoMap(self, memoMap, childScope)
    const entry = {
      context: built,
      finalizer: Effect.sync(() => {
        entry.refCount--
        if (entry.refCount > 0) return
        entry.fiber = Effect.runFork(Effect.flatMap(Effect.sleep(resolvedDuration), () => {
          cache.delete(memoMap)
          return Scope.close(childScope, Exit.void)
        }))
      }),
      refCount: 1,
      fiber: undefined as Fiber.Fiber<void> | undefined
    }
    if (Duration.isFinite(resolvedDuration)) {
      yield* Scope.addFinalizer(layerScope, entry.finalizer)
    }
    cache.set(memoMap, entry)
    return built
  }))
})
