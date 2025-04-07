---
title: ReactiveRef.ts
nav_order: 3
parent: "@effect-rx/rx"
---

## ReactiveRef overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinators](#combinators)
  - [get](#get)
  - [modify](#modify)
  - [set](#set)
  - [subscribe](#subscribe)
  - [unsafeGet](#unsafeget)
  - [unsafeModify](#unsafemodify)
  - [unsafeSet](#unsafeset)
  - [unsafeUpdate](#unsafeupdate)
  - [update](#update)
- [Constructors](#constructors)
  - [make](#make)
  - [unsafeMake](#unsafemake)
- [Conversions](#conversions)
  - [fromStream](#fromstream)
  - [fromStreamPull](#fromstreampull)
  - [intoStream](#intostream)
  - [intoStreamPull](#intostreampull)
- [Models](#models)
  - [ReactiveRef (interface)](#reactiveref-interface)
- [Symbols](#symbols)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# Combinators

## get

**Signature**

```ts
export declare const get: <A>(self: ReactiveRef<A>) => Effect.Effect<A>
```

Added in v1.0.0

## modify

**Signature**

```ts
export declare const modify: {
  <R, A>(f: (_: A) => readonly [returnValue: R, nextValue: A]): (self: ReactiveRef<A>) => Effect.Effect<R>
  <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): Effect.Effect<R>
}
```

Added in v1.0.0

## set

**Signature**

```ts
export declare const set: {
  <A>(value: A): (self: ReactiveRef<A>) => Effect.Effect<void>
  <A>(self: ReactiveRef<A>, value: A): Effect.Effect<void>
}
```

Added in v1.0.0

## subscribe

**Signature**

```ts
export declare const subscribe: <A>(self: ReactiveRef<A>) => Effect.Effect<A, never, Reactive.Reactive>
```

Added in v1.0.0

## unsafeGet

**Signature**

```ts
export declare const unsafeGet: <A>(self: ReactiveRef<A>) => A
```

Added in v1.0.0

## unsafeModify

**Signature**

```ts
export declare const unsafeModify: {
  <R, A>(f: (_: A) => readonly [returnValue: R, nextValue: A]): (self: ReactiveRef<A>) => R
  <A, R>(self: ReactiveRef<A>, f: (_: A) => readonly [returnValue: R, nextValue: A]): R
}
```

Added in v1.0.0

## unsafeSet

**Signature**

```ts
export declare const unsafeSet: {
  <A>(value: A): (self: ReactiveRef<A>) => void
  <A>(self: ReactiveRef<A>, value: A): void
}
```

Added in v1.0.0

## unsafeUpdate

**Signature**

```ts
export declare const unsafeUpdate: {
  <A>(f: (_: A) => A): (self: ReactiveRef<A>) => void
  <A>(self: ReactiveRef<A>, f: (_: A) => A): void
}
```

Added in v1.0.0

## update

**Signature**

```ts
export declare const update: {
  <A>(f: (_: A) => A): (self: ReactiveRef<A>) => Effect.Effect<void>
  <A>(self: ReactiveRef<A>, f: (_: A) => A): Effect.Effect<void>
}
```

Added in v1.0.0

# Constructors

## make

**Signature**

```ts
export declare const make: <A>(value: A) => Effect.Effect<ReactiveRef<A>>
```

Added in v1.0.0

## unsafeMake

**Signature**

```ts
export declare const unsafeMake: <A>(value: A) => ReactiveRef<A>
```

Added in v1.0.0

# Conversions

## fromStream

**Signature**

```ts
export declare const fromStream: <A, E, R>(
  stream: Stream.Stream<A, E, R>
) => Effect.Effect<ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>, never, R | Scope.Scope>
```

Added in v1.0.0

## fromStreamPull

**Signature**

```ts
export declare const fromStreamPull: <A, E, R>(
  stream: Stream.Stream<A, E, R>
) => Effect.Effect<{ readonly ref: ReactiveRef<PullResult<A, E>>; readonly pull: () => void }, never, R | Scope.Scope>
```

Added in v1.0.0

## intoStream

**Signature**

```ts
export declare const intoStream: {
  <A, E>(
    self: ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>
  ): <R>(stream: Stream.Stream<A, E, R>) => Effect.Effect<void, never, R | Scope.Scope>
  <A, E, R>(
    self: ReactiveRef<Result.Result<A, E | Cause.NoSuchElementException>>,
    stream: Stream.Stream<A, E, R>
  ): Effect.Effect<void, never, R | Scope.Scope>
}
```

Added in v1.0.0

## intoStreamPull

**Signature**

```ts
export declare const intoStreamPull: {
  <A, E>(
    self: ReactiveRef<PullResult<A, E>>
  ): <R>(stream: Stream.Stream<A, E, R>) => Effect.Effect<() => void, never, R | Scope.Scope>
  <A, E, R>(
    self: ReactiveRef<PullResult<A, E>>,
    stream: Stream.Stream<A, E, R>
  ): Effect.Effect<() => void, never, R | Scope.Scope>
}
```

Added in v1.0.0

# Models

## ReactiveRef (interface)

**Signature**

```ts
export interface ReactiveRef<in out A> extends Handle, Effect.Effect<A, never, Reactive.Reactive> {
  readonly [TypeId]: TypeId
  subscribe(reactive: Reactive.Reactive["Type"]): void
  unsafeSet(value: A): void
  value: A
}
```

Added in v1.0.0

# Symbols

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
