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
export type Result<E, A> = Initial<E, A> | Success<E, A> | Failure<E, A>

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
    readonly waiting: boolean
  }

  /**
   * @since 1.0.0
   */
  export type InferA<R extends Result<any, any>> = R extends Result<infer _, infer A> ? A : never

  /**
   * @since 1.0.0
   */
  export type InferE<R extends Result<any, any>> = R extends Result<infer E, infer _> ? E : never

  /**
   * @since 1.0.0
   */
  export type With<R extends Result<any, any>, E, A> = R extends Initial<infer _E, infer _A> ? Initial<E, A>
    : R extends Success<infer _E, infer _A> ? Success<E, A>
    : R extends Failure<infer _E, infer _A> ? Failure<E, A>
    : never
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
export const fromExitWithPrevious = <E, A>(
  exit: Exit.Exit<E, A>,
  previous: Option.Option<Result<E, A>>
): Success<E, A> | Failure<E, A> =>
  exit._tag === "Success" ? success(exit.value) : failureWithPrevious(exit.cause, previous)

/**
 * @since 1.0.0
 * @category constructors
 */
export const waitingFrom = <E, A>(previous: Option.Option<Result<E, A>>): Result<E, A> => {
  if (previous._tag === "None") {
    return initial(true)
  }
  return waiting(previous.value)
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
export const initial = <E, A>(waiting = false): Initial<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Initial"
  result.waiting = waiting
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
export const success = <E, A>(value: A, waiting = false): Success<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Success"
  result.value = value
  result.waiting = waiting
  return result
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Failure<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Failure"
  readonly cause: Cause.Cause<E>
  readonly previousValue: Option.Option<A>
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
export const failure = <E, A>(
  cause: Cause.Cause<E>,
  previousValue: Option.Option<A> = Option.none(),
  waiting = false
): Failure<E, A> => {
  const result = Object.create(ResultProto)
  result._tag = "Failure"
  result.cause = cause
  result.previousValue = previousValue
  result.waiting = waiting
  return result
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const failureWithPrevious = <E, A>(
  cause: Cause.Cause<E>,
  previous: Option.Option<Result<E, A>>,
  waiting = false
): Failure<E, A> => failure(cause, Option.flatMap(previous, value), waiting)

/**
 * @since 1.0.0
 * @category constructors
 */
export const fail = <E, A>(error: E, previousData?: Option.Option<A>, waiting?: boolean): Failure<E, A> =>
  failure(Cause.fail(error), previousData, waiting)

/**
 * @since 1.0.0
 * @category constructors
 */
export const failWithPrevious = <E, A>(
  error: E,
  previous: Option.Option<Result<E, A>>,
  waiting?: boolean
): Failure<E, A> => fail(error, Option.flatMap(previous, value), waiting)

/**
 * @since 1.0.0
 * @category constructors
 */
export const waiting = <R extends Result<any, any>>(self: R): R => {
  if (self.waiting) {
    return self
  }
  const result = Object.assign(Object.create(ResultProto), self)
  result.waiting = true
  return result
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const replacePrevious = <R extends Result<any, any>, XE, A>(
  self: R,
  previous: Option.Option<Result<XE, A>>
): Result.With<R, Result.InferE<R>, A> => {
  if (self._tag === "Failure") {
    return failureWithPrevious(self.cause, previous, self.waiting) as any
  }
  return self as any
}

/**
 * @since 1.0.0
 * @category accessors
 */
export const value = <E, A>(self: Result<E, A>): Option.Option<A> => {
  if (self._tag === "Success") {
    return Option.some(self.value)
  } else if (self._tag === "Failure") {
    return self.previousValue
  }
  return Option.none()
}

/**
 * @since 1.0.0
 * @category accessors
 */
export const cause = <E, A>(self: Result<E, A>): Option.Option<Cause.Cause<E>> => {
  if (self._tag === "Failure") {
    return Option.some(self.cause)
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
  switch (self._tag) {
    case "Success": {
      return Exit.succeed(self.value)
    }
    case "Failure": {
      return Exit.failCause(self.cause)
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
      return self as any as Result<E, B>
    case "Failure":
      return failure(self.cause, Option.map(self.previousValue, f), self.waiting)
    case "Success":
      return success(f(self.value), self.waiting)
  }
})
