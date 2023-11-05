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
  - [noWaiting](#nowaiting)
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
  - [success](#success)
  - [waiting](#waiting)
  - [waitingFrom](#waitingfrom)
- [models](#models)
  - [Failure (interface)](#failure-interface)
  - [Initial (interface)](#initial-interface)
  - [Loading (interface)](#loading-interface)
  - [NoWaiting (type alias)](#nowaiting-type-alias)
  - [Refreshing (interface)](#refreshing-interface)
  - [Result (type alias)](#result-type-alias)
  - [Result (namespace)](#result-namespace)
    - [Proto (interface)](#proto-interface)
    - [Failure (type alias)](#failure-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [Retrying (interface)](#retrying-interface)
  - [Success (interface)](#success-interface)
  - [Waiting (type alias)](#waiting-type-alias)
- [refinements](#refinements)
  - [isFailure](#isfailure)
  - [isInitial](#isinitial)
  - [isLoading](#isloading)
  - [isRefreshing](#isrefreshing)
  - [isRetrying](#isretrying)
  - [isSuccess](#issuccess)
  - [isWaiting](#iswaiting)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# accessors

## cause

**Signature**

```ts
export declare const cause: <E, A>(result: Result<E, A>) => Option.Option<Cause.Cause<E>>
```

Added in v1.0.0

## noWaiting

**Signature**

```ts
export declare const noWaiting: <E, A>(result: Result<E, A>) => NoWaiting<E, A>
```

Added in v1.0.0

## value

**Signature**

```ts
export declare const value: <E, A>(result: Result<E, A>) => Option.Option<A>
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
export declare const fail: <E, A>(error: E, previousData?: Option.Option<A> | undefined) => Failure<E, A>
```

Added in v1.0.0

## failWithPrevious

**Signature**

```ts
export declare const failWithPrevious: <E, A>(error: E, previous: Option.Option<Result<E, A>>) => Failure<E, A>
```

Added in v1.0.0

## failure

**Signature**

```ts
export declare const failure: <E, A>(cause: Cause.Cause<E>, previousValue?: Option.Option<A>) => Failure<E, A>
```

Added in v1.0.0

## failureWithPrevious

**Signature**

```ts
export declare const failureWithPrevious: <E, A>(
  cause: Cause.Cause<E>,
  previous: Option.Option<Result<E, A>>
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
export declare const initial: <E, A>() => Initial<E, A>
```

Added in v1.0.0

## success

**Signature**

```ts
export declare const success: <E, A>(value: A) => Success<E, A>
```

Added in v1.0.0

## waiting

**Signature**

```ts
export declare const waiting: <E, A>(previous: Initial<E, A> | Success<E, A> | Failure<E, A>) => Waiting<E, A>
```

Added in v1.0.0

## waitingFrom

**Signature**

```ts
export declare const waitingFrom: <E, A>(previous: Option.Option<Result<E, A>>) => Waiting<E, A>
```

Added in v1.0.0

# models

## Failure (interface)

**Signature**

```ts
export interface Failure<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Failure'
  readonly cause: Cause.Cause<E>
  readonly previousValue: Option.Option<A>
}
```

Added in v1.0.0

## Initial (interface)

**Signature**

```ts
export interface Initial<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Initial'
}
```

Added in v1.0.0

## Loading (interface)

**Signature**

```ts
export interface Loading<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Waiting'
  readonly previous: Initial<E, A>
}
```

Added in v1.0.0

## NoWaiting (type alias)

**Signature**

```ts
export type NoWaiting<E, A> = Initial<E, A> | Success<E, A> | Failure<E, A>
```

Added in v1.0.0

## Refreshing (interface)

**Signature**

```ts
export interface Refreshing<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Waiting'
  readonly previous: Success<E, A>
}
```

Added in v1.0.0

## Result (type alias)

**Signature**

```ts
export type Result<E, A> = Initial<E, A> | Waiting<E, A> | Success<E, A> | Failure<E, A>
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
}
```

Added in v1.0.0

### Failure (type alias)

**Signature**

```ts
export type Failure<R extends Result<any, any>> = R extends Result<infer E, infer _> ? E : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<R extends Result<any, any>> = R extends Result<infer _, infer A> ? A : never
```

Added in v1.0.0

## Retrying (interface)

**Signature**

```ts
export interface Retrying<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Waiting'
  readonly previous: Failure<E, A>
}
```

Added in v1.0.0

## Success (interface)

**Signature**

```ts
export interface Success<E, A> extends Result.Proto<E, A> {
  readonly _tag: 'Success'
  readonly value: A
}
```

Added in v1.0.0

## Waiting (type alias)

**Signature**

```ts
export type Waiting<E, A> = Refreshing<E, A> | Retrying<E, A> | Loading<E, A>
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

## isLoading

**Signature**

```ts
export declare const isLoading: <E, A>(result: Result<E, A>) => result is Loading<E, A>
```

Added in v1.0.0

## isRefreshing

**Signature**

```ts
export declare const isRefreshing: <E, A>(result: Result<E, A>) => result is Refreshing<E, A>
```

Added in v1.0.0

## isRetrying

**Signature**

```ts
export declare const isRetrying: <E, A>(result: Result<E, A>) => result is Retrying<E, A>
```

Added in v1.0.0

## isSuccess

**Signature**

```ts
export declare const isSuccess: <E, A>(result: Result<E, A>) => result is Success<E, A>
```

Added in v1.0.0

## isWaiting

**Signature**

```ts
export declare const isWaiting: <E, A>(result: Result<E, A>) => result is Waiting<E, A>
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
