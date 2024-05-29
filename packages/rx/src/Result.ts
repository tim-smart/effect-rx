/**
 * @since 1.0.0
 */
import * as Cause from "effect/Cause"
import * as Data from "effect/Data"
import * as Exit from "effect/Exit"
import type { LazyArg } from "effect/Function"
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
export type Result<A, E = never> = Initial<A, E> | Success<A, E> | Failure<A, E>

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Result {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface Proto<A, E> extends Pipeable {
    readonly [TypeId]: {
      readonly E: (_: never) => E
      readonly A: (_: never) => A
    }
    readonly waiting: boolean
  }

  /**
   * @since 1.0.0
   */
  export type InferA<R extends Result<any, any>> = R extends Result<infer A, infer _> ? A : never

  /**
   * @since 1.0.0
   */
  export type InferE<R extends Result<any, any>> = R extends Result<infer _, infer E> ? E : never

  /**
   * @since 1.0.0
   */
  export type With<R extends Result<any, any>, A, E> = R extends Initial<infer _A, infer _E> ? Initial<A, E>
    : R extends Success<infer _A, infer _E> ? Success<A, E>
    : R extends Failure<infer _A, infer _E> ? Failure<A, E>
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
export interface Initial<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Initial"
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const fromExit = <A, E>(exit: Exit.Exit<A, E>): Success<A, E> | Failure<A, E> =>
  exit._tag === "Success" ? success(exit.value) : failure(exit.cause)

/**
 * @since 1.0.0
 * @category constructors
 */
export const fromExitWithPrevious = <A, E>(
  exit: Exit.Exit<A, E>,
  previous: Option.Option<Result<A, E>>
): Success<A, E> | Failure<A, E> =>
  exit._tag === "Success" ? success(exit.value) : failureWithPrevious(exit.cause, previous)

/**
 * @since 1.0.0
 * @category constructors
 */
export const waitingFrom = <A, E>(previous: Option.Option<Result<A, E>>): Result<A, E> => {
  if (previous._tag === "None") {
    return initial(true)
  }
  return waiting(previous.value)
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isInitial = <A, E>(result: Result<A, E>): result is Initial<A, E> => result._tag === "Initial"

/**
 * @since 1.0.0
 * @category refinements
 */
export const isNotInitial = <A, E>(result: Result<A, E>): result is Success<A, E> | Failure<A, E> =>
  result._tag !== "Initial"

/**
 * @since 1.0.0
 * @category constructors
 */
export const initial = <A, E>(waiting = false): Initial<A, E> => {
  const result = Object.create(ResultProto)
  result._tag = "Initial"
  result.waiting = waiting
  return result
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Success<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Success"
  readonly value: A
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isSuccess = <A, E>(result: Result<A, E>): result is Success<A, E> => result._tag === "Success"

/**
 * @since 1.0.0
 * @category constructors
 */
export const success = <A, E>(value: A, waiting = false): Success<A, E> => {
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
export interface Failure<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Failure"
  readonly cause: Cause.Cause<E>
  readonly previousValue: Option.Option<A>
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isFailure = <A, E>(result: Result<A, E>): result is Failure<A, E> => result._tag === "Failure"

/**
 * @since 1.0.0
 * @category refinements
 */
export const isInterrupted = <A, E>(result: Result<A, E>): result is Failure<A, E> =>
  result._tag === "Failure" && Cause.isInterruptedOnly(result.cause)

/**
 * @since 1.0.0
 * @category constructors
 */
export const failure = <A, E>(
  cause: Cause.Cause<E>,
  previousValue: Option.Option<A> = Option.none(),
  waiting = false
): Failure<A, E> => {
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
export const failureWithPrevious = <A, E>(
  cause: Cause.Cause<E>,
  previous: Option.Option<Result<A, E>>,
  waiting = false
): Failure<A, E> => failure(cause, Option.flatMap(previous, value), waiting)

/**
 * @since 1.0.0
 * @category constructors
 */
export const fail = <A, E>(error: E, previousData?: Option.Option<A>, waiting?: boolean): Failure<A, E> =>
  failure(Cause.fail(error), previousData, waiting)

/**
 * @since 1.0.0
 * @category constructors
 */
export const failWithPrevious = <A, E>(
  error: E,
  previous: Option.Option<Result<A, E>>,
  waiting?: boolean
): Failure<A, E> => fail(error, Option.flatMap(previous, value), waiting)

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
  previous: Option.Option<Result<A, XE>>
): Result.With<R, A, Result.InferE<R>> => {
  if (self._tag === "Failure") {
    return failureWithPrevious(self.cause, previous, self.waiting) as any
  }
  return self as any
}

/**
 * @since 1.0.0
 * @category accessors
 */
export const value = <A, E>(self: Result<A, E>): Option.Option<A> => {
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
export const getOrElse: {
  <B>(orElse: LazyArg<B>): <A, E>(self: Result<A, E>) => A | B
  <A, E, B>(self: Result<A, E>, orElse: LazyArg<B>): A | B
} = dual(2, <A, E, B>(self: Result<A, E>, orElse: LazyArg<B>): A | B => self._tag === "Success" ? self.value : orElse())

/**
 * @since 1.0.0
 * @category accessors
 */
export const cause = <A, E>(self: Result<A, E>): Option.Option<Cause.Cause<E>> => {
  if (self._tag === "Failure") {
    return Option.some(self.cause)
  }
  return Option.none()
}

/**
 * @since 1.0.0
 * @category combinators
 */
export const toExit = <A, E>(
  self: Result<A, E>
): Exit.Exit<A, E | Cause.NoSuchElementException> => {
  switch (self._tag) {
    case "Success": {
      return Exit.succeed(self.value)
    }
    case "Failure": {
      return Exit.failCause(self.cause)
    }
    default: {
      return Exit.fail(new Cause.NoSuchElementException())
    }
  }
}

/**
 * @since 1.0.0
 * @category combinators
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(self: Result<A, E>) => Result<B, E>
  <E, A, B>(self: Result<A, E>, f: (a: A) => B): Result<B, E>
} = dual(2, <E, A, B>(self: Result<A, E>, f: (a: A) => B): Result<B, E> => {
  switch (self._tag) {
    case "Initial":
      return self as any as Result<B, E>
    case "Failure":
      return failure(self.cause, Option.map(self.previousValue, f), self.waiting)
    case "Success":
      return success(f(self.value), self.waiting)
  }
})

/**
 * @since 1.0.0
 * @category combinators
 */
export const match: {
  <A, E, X, Y, Z>(options: {
    readonly onInitial: (_: Initial<A, E>) => X
    readonly onFailure: (_: Failure<A, E>) => Y
    readonly onSuccess: (_: Success<A, E>) => Z
  }): (self: Result<A, E>) => X | Y | Z
  <A, E, X, Y, Z>(self: Result<A, E>, options: {
    readonly onInitial: (_: Initial<A, E>) => X
    readonly onFailure: (_: Failure<A, E>) => Y
    readonly onSuccess: (_: Success<A, E>) => Z
  }): X | Y | Z
} = dual(2, <A, E, X, Y, Z>(self: Result<A, E>, options: {
  readonly onInitial: (_: Initial<A, E>) => X
  readonly onFailure: (_: Failure<A, E>) => Y
  readonly onSuccess: (_: Success<A, E>) => Z
}): X | Y | Z => {
  switch (self._tag) {
    case "Initial":
      return options.onInitial(self)
    case "Failure":
      return options.onFailure(self)
    case "Success":
      return options.onSuccess(self)
  }
})
