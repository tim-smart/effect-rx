/**
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { globalValue } from "effect/GlobalValue"
import * as Layer from "effect/Layer"
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
    notify(): void
    emit(value: unknown): void
    addHandle(handle: Handle): void
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
 * @since 1.0.0
 * @category Reactive
 */
export const emit = <A = unknown>(value: A): Effect.Effect<void, never, Reactive> =>
  Effect.withFiberRuntime((fiber) => {
    const reactive = fiber.currentContext.unsafeMap.get(Reactive.key) as Reactive["Type"]
    reactive.emit(value)
    return Effect.void
  })

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
    let running = false
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
      running = false
      cancel = undefined
      setResult(Result.fromExitWithPrevious(exit, Option.some(result)))
    }

    function emit(value: A) {
      if (!running) return
      setResult(Result.success(value, true))
    }

    function start() {
      scope = Effect.runSync(Scope.make())
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
            running = true
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

          reactive = {
            notify() {
              if (pending) return
              pending = true
              queueMicrotask(run)
            },
            emit,
            addHandle(handle) {
              handles.push(handle)
            }
          }

          const fiber = Option.getOrThrow(Fiber.getCurrentFiber())
          const contextReactive = Context.add(context, Reactive, reactive)
          const runtime = Runtime.make({
            context: contextReactive,
            runtimeFlags: Runtime.defaultRuntime.runtimeFlags,
            fiberRefs: fiber.getFiberRefs()
          })
          currentScope = Effect.runSync(Scope.make())
          const runCallback = runCallbackSync(runtime)
          return Effect.provide(effect, Context.add(contextReactive, Scope.Scope, currentScope))
        }
      )

      waiting = true
      running = true
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
