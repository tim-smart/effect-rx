/**
 * @since 1.0.0
 */
import * as Cause from "effect/Cause"
import * as Data from "effect/Data"
import * as Exit from "effect/Exit"
import { dual, identity } from "effect/Function"
import * as Option from "effect/Option"
import { type Pipeable, pipeArguments } from "effect/Pipeable"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId = Symbol.for("@effect-rx/rx/Result")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export type Result<E, A> = Initial<E, A> | Waiting<E, A> | Success<E, A> | Failure<E, A>

/**
 * @since 1.0.0
 * @category models
 */
export type NoWaiting<E, A> = Initial<E, A> | Success<E, A> | Failure<E, A>

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Result {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface Proto<E, A> extends Pipeable, Data.Case {
    readonly [TypeId]: {
      readonly E: (_: never) => E
      readonly A: (_: never) => A
    }
  }

  /**
   * @since 1.0.0
   */
  export type Success<R extends Result<any, any>> = R extends Result<infer _, infer A> ? A : never

  /**
   * @since 1.0.0
   */
  export type Failure<R extends Result<any, any>> = R extends Result<infer E, infer _> ? E : never
}

const ResultProto = Data.struct({
  [TypeId]: {
    E: identity,
    A: identity
  },
  pipe() {
    return pipeArguments(this, arguments)
  }
})

/**
 * @since 1.0.0
 * @category models
 */
export interface Initial<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Initial"
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fromExit = <E, A>(exit: Exit.Exit<E, A>): Success<E, A> | Failure<E, A> =>
  exit._tag === "Success" ? success(exit.value) : failure(exit.cause)

/**
 * @since 1.0.0
 * @category constructors
 */
export const waitingFrom = <E, A>(previous: Option.Option<Result<E, A>>): Waiting<E, A> => {
  if (previous._tag === "None") {
    return waiting(constInitial)
  }

  switch (previous.value._tag) {
    case "Waiting":
      return previous.value
    case "Initial":
    case "Success":
    case "Failure":
      return waiting(previous.value)
  }
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isInitial = <E, A>(result: Result<E, A>): result is Initial<E, A> => result._tag === "Initial"

/**
 * @since 1.0.0
 * @category constructors
 */
export const initial = <E, A>(): Initial<E, A> => constInitial
const constInitial: Initial<never, never> = Object.assign(Object.create(ResultProto), {
  _tag: "Initial"
})

/**
 * @since 1.0.0
 * @category models
 */
export type Waiting<E, A> = Refreshing<E, A> | Retrying<E, A> | Loading<E, A>

/**
 * @since 1.0.0
 * @category models
 */
export interface Refreshing<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Waiting"
  readonly previous: Success<E, A>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Retrying<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Waiting"
  readonly previous: Failure<E, A>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Loading<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Waiting"
  readonly previous: Initial<E, A>
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isWaiting = <E, A>(result: Result<E, A>): result is Waiting<E, A> => result._tag === "Waiting"

/**
 * @since 1.0.0
 * @category refinements
 */
export const isLoading = <E, A>(result: Result<E, A>): result is Loading<E, A> =>
  result._tag === "Waiting" && result.previous._tag === "Initial"

/**
 * @since 1.0.0
 * @category refinements
 */
export const isRetrying = <E, A>(result: Result<E, A>): result is Retrying<E, A> =>
  result._tag === "Waiting" && result.previous._tag === "Failure"

/**
 * @since 1.0.0
 * @category refinements
 */
export const isRefreshing = <E, A>(result: Result<E, A>): result is Refreshing<E, A> =>
  result._tag === "Waiting" && result.previous._tag === "Success"

/**
 * @since 1.0.0
 * @category constructors
 */
export const waiting = <E, A>(previous: Initial<E, A> | Success<E, A> | Failure<E, A>): Waiting<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Waiting"
  result.previous = previous
  return result
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Success<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Success"
  readonly value: A
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isSuccess = <E, A>(result: Result<E, A>): result is Success<E, A> => result._tag === "Success"

/**
 * @since 1.0.0
 * @category constructors
 */
export const success = <E, A>(value: A): Success<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Success"
  result.value = value
  return result
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Failure<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Failure"
  readonly cause: Cause.Cause<E>
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isFailure = <E, A>(result: Result<E, A>): result is Failure<E, A> => result._tag === "Failure"

/**
 * @since 1.0.0
 * @category constructors
 */
export const failure = <E, A>(cause: Cause.Cause<E>): Failure<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Failure"
  result.cause = cause
  return result
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fail = <E, A>(error: E): Failure<E, A> => failure(Cause.fail(error))

/**
 * @since 1.0.0
 * @category accessors
 */
export const noWaiting = <E, A>(result: Result<E, A>): NoWaiting<E, A> => {
  switch (result._tag) {
    case "Initial":
    case "Success":
    case "Failure":
      return result
    case "Waiting":
      return result.previous
  }
}

/**
 * @since 1.0.0
 * @category accessors
 */
export const value = <E, A>(result: Result<E, A>): Option.Option<A> => {
  const noWaitingResult = noWaiting(result)
  if (noWaitingResult._tag === "Success") {
    return Option.some(noWaitingResult.value)
  }
  return Option.none()
}

/**
 * @since 1.0.0
 * @category accessors
 */
export const cause = <E, A>(result: Result<E, A>): Option.Option<Cause.Cause<E>> => {
  const noWaitingResult = noWaiting(result)
  if (noWaitingResult._tag === "Failure") {
    return Option.some(noWaitingResult.cause)
  }
  return Option.none()
}

/**
 * @since 1.0.0
 * @category combinators
 */
export const toExit = <E, A>(
  self: Result<E, A>
): Exit.Exit<E | Cause.NoSuchElementException, A> => {
  const result = noWaiting(self)
  switch (result._tag) {
    case "Success": {
      return Exit.succeed(result.value)
    }
    case "Failure": {
      return Exit.failCause(result.cause)
    }
    default: {
      return Exit.fail(Cause.NoSuchElementException())
    }
  }
}

/**
 * @since 1.0.0
 * @category combinators
 */
export const map = dual<
  <A, B>(f: (a: A) => B) => <E>(self: Result<E, A>) => Result<E, B>,
  <E, A, B>(self: Result<E, A>, f: (a: A) => B) => Result<E, B>
>(2, <E, A, B>(self: Result<E, A>, f: (a: A) => B): Result<E, B> => {
  switch (self._tag) {
    case "Initial":
    case "Failure":
      return self as any as Result<E, B>
    case "Waiting":
      return waiting(map(self.previous, f) as any)
    case "Success":
      return success(f(self.value))
  }
})
