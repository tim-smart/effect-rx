---
title: Result.ts
nav_order: 3
parent: "@effect-rx/rx"
---

## Result overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [accessors](#accessors)
  - [cause](#cause)
  - [getOrElse](#getorelse)
  - [getOrThrow](#getorthrow)
  - [value](#value)
- [combinators](#combinators)
  - [map](#map)
  - [match](#match)
  - [matchWithError](#matchwitherror)
  - [matchWithWaiting](#matchwithwaiting)
  - [toExit](#toexit)
- [constructors](#constructors)
  - [fail](#fail)
  - [failWithPrevious](#failwithprevious)
  - [failure](#failure)
  - [failureWithPrevious](#failurewithprevious)
  - [fromExit](#fromexit)
  - [fromExitWithPrevious](#fromexitwithprevious)
  - [initial](#initial)
  - [replacePrevious](#replaceprevious)
  - [success](#success)
  - [waiting](#waiting)
  - [waitingFrom](#waitingfrom)
- [models](#models)
  - [Failure (interface)](#failure-interface)
  - [Initial (interface)](#initial-interface)
  - [Result (type alias)](#result-type-alias)
  - [Result (namespace)](#result-namespace)
    - [Proto (interface)](#proto-interface)
    - [InferA (type alias)](#infera-type-alias)
    - [InferE (type alias)](#infere-type-alias)
    - [With (type alias)](#with-type-alias)
  - [Success (interface)](#success-interface)
- [refinements](#refinements)
  - [isFailure](#isfailure)
  - [isInitial](#isinitial)
  - [isInterrupted](#isinterrupted)
  - [isNotInitial](#isnotinitial)
  - [isSuccess](#issuccess)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# accessors

## cause

**Signature**

```ts
export declare const cause: <A, E>(self: Result<A, E>) => Option.Option<Cause.Cause<E>>
```

Added in v1.0.0

## getOrElse

**Signature**

```ts
export declare const getOrElse: {
  <B>(orElse: LazyArg<B>): <A, E>(self: Result<A, E>) => A | B
  <A, E, B>(self: Result<A, E>, orElse: LazyArg<B>): A | B
}
```

Added in v1.0.0

## getOrThrow

**Signature**

```ts
export declare const getOrThrow: <A, E>(self: Result<A, E>) => A
```

Added in v1.0.0

## value

**Signature**

```ts
export declare const value: <A, E>(self: Result<A, E>) => Option.Option<A>
```

Added in v1.0.0

# combinators

## map

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <E>(self: Result<A, E>) => Result<B, E>
  <E, A, B>(self: Result<A, E>, f: (a: A) => B): Result<B, E>
}
```

Added in v1.0.0

## match

**Signature**

```ts
export declare const match: {
  <A, E, X, Y, Z>(options: {
    readonly onInitial: (_: Initial<A, E>) => X
    readonly onFailure: (_: Failure<A, E>) => Y
    readonly onSuccess: (_: Success<A, E>) => Z
  }): (self: Result<A, E>) => X | Y | Z
  <A, E, X, Y, Z>(
    self: Result<A, E>,
    options: {
      readonly onInitial: (_: Initial<A, E>) => X
      readonly onFailure: (_: Failure<A, E>) => Y
      readonly onSuccess: (_: Success<A, E>) => Z
    }
  ): X | Y | Z
}
```

Added in v1.0.0

## matchWithError

**Signature**

```ts
export declare const matchWithError: {
  <A, E, W, X, Y, Z>(options: {
    readonly onInitial: (_: Initial<A, E>) => W
    readonly onError: (error: E, _: Failure<A, E>) => X
    readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y
    readonly onSuccess: (_: Success<A, E>) => Z
  }): (self: Result<A, E>) => W | X | Y | Z
  <A, E, W, X, Y, Z>(
    self: Result<A, E>,
    options: {
      readonly onInitial: (_: Initial<A, E>) => W
      readonly onError: (error: E, _: Failure<A, E>) => X
      readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y
      readonly onSuccess: (_: Success<A, E>) => Z
    }
  ): W | X | Y | Z
}
```

Added in v1.0.0

## matchWithWaiting

**Signature**

```ts
export declare const matchWithWaiting: {
  <A, E, W, X, Y, Z>(options: {
    readonly onWaiting: (_: Result<A, E>) => W
    readonly onError: (error: E, _: Failure<A, E>) => X
    readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y
    readonly onSuccess: (_: Success<A, E>) => Z
  }): (self: Result<A, E>) => W | X | Y | Z
  <A, E, W, X, Y, Z>(
    self: Result<A, E>,
    options: {
      readonly onWaiting: (_: Result<A, E>) => W
      readonly onError: (error: E, _: Failure<A, E>) => X
      readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y
      readonly onSuccess: (_: Success<A, E>) => Z
    }
  ): W | X | Y | Z
}
```

Added in v1.0.0

## toExit

**Signature**

```ts
export declare const toExit: <A, E>(self: Result<A, E>) => Exit.Exit<A, E | Cause.NoSuchElementException>
```

Added in v1.0.0

# constructors

## fail

**Signature**

```ts
export declare const fail: <E, A = never>(error: E, previousData?: Option.Option<A>, waiting?: boolean) => Failure<A, E>
```

Added in v1.0.0

## failWithPrevious

**Signature**

```ts
export declare const failWithPrevious: <A, E>(
  error: E,
  previous: Option.Option<Result<A, E>>,
  waiting?: boolean
) => Failure<A, E>
```

Added in v1.0.0

## failure

**Signature**

```ts
export declare const failure: <E, A = never>(
  cause: Cause.Cause<E>,
  previousValue?: Option.Option<A>,
  waiting?: boolean
) => Failure<A, E>
```

Added in v1.0.0

## failureWithPrevious

**Signature**

```ts
export declare const failureWithPrevious: <A, E>(
  cause: Cause.Cause<E>,
  previous: Option.Option<Result<A, E>>,
  waiting?: boolean
) => Failure<A, E>
```

Added in v1.0.0

## fromExit

**Signature**

```ts
export declare const fromExit: <A, E>(exit: Exit.Exit<A, E>) => Success<A, E> | Failure<A, E>
```

Added in v1.0.0

## fromExitWithPrevious

**Signature**

```ts
export declare const fromExitWithPrevious: <A, E>(
  exit: Exit.Exit<A, E>,
  previous: Option.Option<Result<A, E>>
) => Success<A, E> | Failure<A, E>
```

Added in v1.0.0

## initial

**Signature**

```ts
export declare const initial: <A = never, E = never>(waiting?: boolean) => Initial<A, E>
```

Added in v1.0.0

## replacePrevious

**Signature**

```ts
export declare const replacePrevious: <R extends Result<any, any>, XE, A>(
  self: R,
  previous: Option.Option<Result<A, XE>>
) => Result.With<R, A, Result.InferE<R>>
```

Added in v1.0.0

## success

**Signature**

```ts
export declare const success: <A, E = never>(value: A, waiting?: boolean) => Success<A, E>
```

Added in v1.0.0

## waiting

**Signature**

```ts
export declare const waiting: <R extends Result<any, any>>(self: R) => R
```

Added in v1.0.0

## waitingFrom

**Signature**

```ts
export declare const waitingFrom: <A, E>(previous: Option.Option<Result<A, E>>) => Result<A, E>
```

Added in v1.0.0

# models

## Failure (interface)

**Signature**

```ts
export interface Failure<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Failure"
  readonly cause: Cause.Cause<E>
  readonly previousValue: Option.Option<A>
}
```

Added in v1.0.0

## Initial (interface)

**Signature**

```ts
export interface Initial<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Initial"
}
```

Added in v1.0.0

## Result (type alias)

**Signature**

```ts
export type Result<A, E = never> = Initial<A, E> | Success<A, E> | Failure<A, E>
```

Added in v1.0.0

## Result (namespace)

Added in v1.0.0

### Proto (interface)

**Signature**

```ts
export interface Proto<A, E> extends Pipeable {
  readonly [TypeId]: {
    readonly E: (_: never) => E
    readonly A: (_: never) => A
  }
  readonly waiting: boolean
}
```

Added in v1.0.0

### InferA (type alias)

**Signature**

```ts
export type InferA<R extends Result<any, any>> = R extends Result<infer A, infer _> ? A : never
```

Added in v1.0.0

### InferE (type alias)

**Signature**

```ts
export type InferE<R extends Result<any, any>> = R extends Result<infer _, infer E> ? E : never
```

Added in v1.0.0

### With (type alias)

**Signature**

```ts
export type With<R extends Result<any, any>, A, E> =
  R extends Initial<infer _A, infer _E>
    ? Initial<A, E>
    : R extends Success<infer _A, infer _E>
      ? Success<A, E>
      : R extends Failure<infer _A, infer _E>
        ? Failure<A, E>
        : never
```

Added in v1.0.0

## Success (interface)

**Signature**

```ts
export interface Success<A, E = never> extends Result.Proto<A, E> {
  readonly _tag: "Success"
  readonly value: A
}
```

Added in v1.0.0

# refinements

## isFailure

**Signature**

```ts
export declare const isFailure: <A, E>(result: Result<A, E>) => result is Failure<A, E>
```

Added in v1.0.0

## isInitial

**Signature**

```ts
export declare const isInitial: <A, E>(result: Result<A, E>) => result is Initial<A, E>
```

Added in v1.0.0

## isInterrupted

**Signature**

```ts
export declare const isInterrupted: <A, E>(result: Result<A, E>) => result is Failure<A, E>
```

Added in v1.0.0

## isNotInitial

**Signature**

```ts
export declare const isNotInitial: <A, E>(result: Result<A, E>) => result is Success<A, E> | Failure<A, E>
```

Added in v1.0.0

## isSuccess

**Signature**

```ts
export declare const isSuccess: <A, E>(result: Result<A, E>) => result is Success<A, E>
```

Added in v1.0.0

# type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0
