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
  - [value](#value)
- [combinators](#combinators)
  - [map](#map)
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
export declare const cause: <E, A>(self: Result<E, A>) => Option.Option<Cause.Cause<E>>
```

Added in v1.0.0

## value

**Signature**

```ts
export declare const value: <E, A>(self: Result<E, A>) => Option.Option<A>
```

Added in v1.0.0

# combinators

## map

**Signature**

```ts
export declare const map: (<A, B>(f: (a: A) => B) => <E>(self: Result<E, A>) => Result<E, B>) &
  (<E, A, B>(self: Result<E, A>, f: (a: A) => B) => Result<E, B>)
```

Added in v1.0.0

## toExit

**Signature**

```ts
export declare const toExit: <E, A>(self: Result<E, A>) => Exit.Exit<Cause.NoSuchElementException | E, A>
```

Added in v1.0.0

# constructors

## fail

**Signature**

```ts
export declare const fail: <E, A>(
  error: E,
  previousData?: Option.Option<A> | undefined,
  waiting?: boolean
) => Failure<E, A>
```

Added in v1.0.0

## failWithPrevious

**Signature**

```ts
export declare const failWithPrevious: <E, A>(
  error: E,
  previous: Option.Option<Result<E, A>>,
  waiting?: boolean
) => Failure<E, A>
```

Added in v1.0.0

## failure

**Signature**

```ts
export declare const failure: <E, A>(
  cause: Cause.Cause<E>,
  previousValue?: Option.Option<A>,
  waiting?: boolean
) => Failure<E, A>
```

Added in v1.0.0

## failureWithPrevious

**Signature**

```ts
export declare const failureWithPrevious: <E, A>(
  cause: Cause.Cause<E>,
  previous: Option.Option<Result<E, A>>,
  waiting?: boolean
) => Failure<E, A>
```

Added in v1.0.0

## fromExit

**Signature**

```ts
export declare const fromExit: <E, A>(exit: Exit.Exit<E, A>) => Success<E, A> | Failure<E, A>
```

Added in v1.0.0

## fromExitWithPrevious

**Signature**

```ts
export declare const fromExitWithPrevious: <E, A>(
  exit: Exit.Exit<E, A>,
  previous: Option.Option<Result<E, A>>
) => Success<E, A> | Failure<E, A>
```

Added in v1.0.0

## initial

**Signature**

```ts
export declare const initial: <E, A>(waiting?: boolean) => Initial<E, A>
```

Added in v1.0.0

## replacePrevious

**Signature**

```ts
export declare const replacePrevious: <R extends Result<any, any>, XE, A>(
  self: R,
  previous: Option.Option<Result<XE, A>>
) => Result.With<R, Result.InferE<R>, A>
```

Added in v1.0.0

## success

**Signature**

```ts
export declare const success: <E, A>(value: A, waiting?: boolean) => Success<E, A>
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
export declare const waitingFrom: <E, A>(previous: Option.Option<Result<E, A>>) => Result<E, A>
```

Added in v1.0.0

# models

## Failure (interface)

**Signature**

```ts
export interface Failure<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Failure"
  readonly cause: Cause.Cause<E>
  readonly previousValue: Option.Option<A>
}
```

Added in v1.0.0

## Initial (interface)

**Signature**

```ts
export interface Initial<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Initial"
}
```

Added in v1.0.0

## Result (type alias)

**Signature**

```ts
export type Result<E, A> = Initial<E, A> | Success<E, A> | Failure<E, A>
```

Added in v1.0.0

## Result (namespace)

Added in v1.0.0

### Proto (interface)

**Signature**

```ts
export interface Proto<E, A> extends Pipeable, Data.Case {
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
export type InferA<R extends Result<any, any>> = R extends Result<infer _, infer A> ? A : never
```

Added in v1.0.0

### InferE (type alias)

**Signature**

```ts
export type InferE<R extends Result<any, any>> = R extends Result<infer E, infer _> ? E : never
```

Added in v1.0.0

### With (type alias)

**Signature**

```ts
export type With<R extends Result<any, any>, E, A> =
  R extends Initial<infer _E, infer _A>
    ? Initial<E, A>
    : R extends Success<infer _E, infer _A>
      ? Success<E, A>
      : R extends Failure<infer _E, infer _A>
        ? Failure<E, A>
        : never
```

Added in v1.0.0

## Success (interface)

**Signature**

```ts
export interface Success<E, A> extends Result.Proto<E, A> {
  readonly _tag: "Success"
  readonly value: A
}
```

Added in v1.0.0

# refinements

## isFailure

**Signature**

```ts
export declare const isFailure: <E, A>(result: Result<E, A>) => result is Failure<E, A>
```

Added in v1.0.0

## isInitial

**Signature**

```ts
export declare const isInitial: <E, A>(result: Result<E, A>) => result is Initial<E, A>
```

Added in v1.0.0

## isNotInitial

**Signature**

```ts
export declare const isNotInitial: <E, A>(result: Result<E, A>) => result is Success<E, A> | Failure<E, A>
```

Added in v1.0.0

## isSuccess

**Signature**

```ts
export declare const isSuccess: <E, A>(result: Result<E, A>) => result is Success<E, A>
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
