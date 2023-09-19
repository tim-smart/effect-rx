/**
 * @since 1.0.0
 */
import * as Data from "@effect/data/Data"
import { identity } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import type * as Exit from "@effect/io/Exit"

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
  export interface Variance<E, A> {
    readonly [TypeId]: {
      readonly E: (_: never) => E
      readonly A: (_: never) => A
    }
  }
}

const ResultProto = Data.struct({
  [TypeId]: {
    E: identity,
    A: identity
  }
})

/**
 * @since 1.0.0
 * @category models
 */
export interface Initial<E, A> extends Result.Variance<E, A>, Data.Case {
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
    return waiting(Option.none())
  }

  switch (previous.value._tag) {
    case "Initial":
      return waiting(Option.none())
    case "Waiting":
      return previous.value
    case "Success":
    case "Failure":
      return waiting(Option.some(previous.value))
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
export interface Waiting<E, A> extends Result.Variance<E, A> {
  readonly _tag: "Waiting"
  readonly previous: Option.Option<Success<E, A> | Failure<E, A>>
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isWaiting = <E, A>(result: Result<E, A>): result is Waiting<E, A> => result._tag === "Waiting"

/**
 * @since 1.0.0
 * @category constructors
 */
export const waiting = <E, A>(previous: Option.Option<Success<E, A> | Failure<E, A>>): Waiting<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Waiting"
  result.previous = previous
  return result
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Success<E, A> extends Result.Variance<E, A> {
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
export interface Failure<E, A> extends Result.Variance<E, A> {
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
 * @category accessors
 */
export const noWaiting = <E, A>(result: Result<E, A>): NoWaiting<E, A> => {
  switch (result._tag) {
    case "Initial":
    case "Success":
    case "Failure":
      return result
    case "Waiting":
      return result.previous._tag === "None" ? constInitial : result.previous.value
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
