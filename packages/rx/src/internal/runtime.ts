/**
 * @since 1.0.0
 */
import { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
import { SyncScheduler } from "effect/Scheduler"

const fastPath = <R, E, A>(effect: Effect.Effect<R, E, A>): Exit.Exit<E, A> | undefined => {
  const op = effect as any
  switch (op._tag) {
    case "Failure":
    case "Success": {
      return op
    }
    case "Left": {
      return Exit.fail(op.left)
    }
    case "Right": {
      return Exit.succeed(op.right)
    }
    case "Some": {
      return Exit.succeed(op.value)
    }
    case "None": {
      // @ts-expect-error
      return Exit.fail(NoSuchElementException())
    }
  }
}

/** @internal */
export const runCallbackSync =
  <R>(runtime: Runtime.Runtime<R>) =>
  <E, A>(effect: Effect.Effect<R, E, A>, onExit: (exit: Exit.Exit<E, A>) => void): (() => void) | undefined => {
    const op = fastPath(effect)
    if (op) {
      onExit(op)
      return undefined
    }
    const scheduler = new SyncScheduler()
    const fiberRuntime = Runtime.runFork(runtime)(effect, { scheduler })
    scheduler.flush()
    const result = fiberRuntime.unsafePoll()
    if (result) {
      onExit(result)
      return undefined
    }
    fiberRuntime.addObserver(onExit)
    return function() {
      Effect.runFork(fiberRuntime.interruptAsFork(fiberRuntime.id()))
    }
  }

/** @internal */
export const runCallbackSyncDefault = runCallbackSync(Runtime.defaultRuntime)
