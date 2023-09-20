---
title: Rx.ts
nav_order: 3
parent: "@effect-rx/rx"
---

## Rx overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [keepAlive](#keepalive)
  - [refreshable](#refreshable)
- [constructors](#constructors)
  - [effect](#effect)
  - [effectFn](#effectfn)
  - [family](#family)
  - [readable](#readable)
  - [runtime](#runtime)
  - [scoped](#scoped)
  - [scopedFn](#scopedfn)
  - [state](#state)
  - [stream](#stream)
  - [streamPull](#streampull)
  - [writeable](#writeable)
- [context](#context)
  - [Context (interface)](#context-interface)
- [models](#models)
  - [Refreshable (interface)](#refreshable-interface)
  - [Rx (interface)](#rx-interface)
  - [Rx (namespace)](#rx-namespace)
    - [Get (type alias)](#get-type-alias)
    - [GetResult (type alias)](#getresult-type-alias)
    - [Mount (type alias)](#mount-type-alias)
    - [Refresh (type alias)](#refresh-type-alias)
    - [Set (type alias)](#set-type-alias)
    - [Subscribe (type alias)](#subscribe-type-alias)
    - [SubscribeGetter (type alias)](#subscribegetter-type-alias)
  - [RxResultFn (interface)](#rxresultfn-interface)
  - [RxRuntime (interface)](#rxruntime-interface)
  - [Writeable (interface)](#writeable-interface)
- [type ids](#type-ids)
  - [RefreshableTypeId](#refreshabletypeid)
  - [RefreshableTypeId (type alias)](#refreshabletypeid-type-alias)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)
  - [WriteableTypeId](#writeabletypeid)
  - [WriteableTypeId (type alias)](#writeabletypeid-type-alias)

---

# combinators

## keepAlive

**Signature**

```ts
export declare const keepAlive: <A extends Rx<any>>(self: A) => A
```

Added in v1.0.0

## refreshable

**Signature**

```ts
export declare const refreshable: <T extends Rx<any>>(self: T) => T & Refreshable
```

Added in v1.0.0

# constructors

## effect

**Signature**

```ts
export declare const effect: {
  <E, A>(create: (get: Rx.Get, ctx: Context) => Effect.Effect<never, E, A>): Rx<Result.Result<E, A>>
  <RR, R extends RR, E, A, RE>(
    create: (get: Rx.Get, ctx: Context) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<E | RE, A>>
}
```

Added in v1.0.0

## effectFn

**Signature**

```ts
export declare const effectFn: {
  <Arg, E, A>(fn: (arg: Arg, get: Rx.Get, ctx: Context) => Effect.Effect<never, E, A>): RxResultFn<E, A, Arg>
  <Arg, RR, R extends RR, E, A, RE>(
    fn: (arg: Arg, get: Rx.Get, ctx: Context) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): RxResultFn<E | RE, A, Arg>
}
```

Added in v1.0.0

## family

**Signature**

```ts
export declare const family: <Arg, T extends Rx<any>>(f: (arg: Arg) => T) => (arg: Arg) => T
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A>(
  read: (get: Rx.Get, ctx: Context) => A,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
) => Rx<A>
```

Added in v1.0.0

## runtime

**Signature**

```ts
export declare const runtime: {
  <E, A>(layer: Layer.Layer<never, E, A>): RxRuntime<E, A>
  <R, E, A, RR extends R, RE>(layer: Layer.Layer<R, E, A>, runtime: RxRuntime<RE, RR>): RxRuntime<E, A | RR>
}
```

Added in v1.0.0

## scoped

**Signature**

```ts
export declare const scoped: {
  <E, A>(create: (get: Rx.Get, ctx: Context) => Effect.Effect<Scope.Scope, E, A>): Rx<Result.Result<E, A>>
  <RR, R extends RR | Scope.Scope, E, A, RE>(
    create: (get: Rx.Get, ctx: Context) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<E | RE, A>>
}
```

Added in v1.0.0

## scopedFn

**Signature**

```ts
export declare const scopedFn: {
  <Arg, E, A>(fn: (arg: Arg, get: Rx.Get, ctx: Context) => Effect.Effect<Scope.Scope, E, A>): RxResultFn<E, A, Arg>
  <Arg, RR, R extends Scope.Scope | RR, E, A, RE>(
    fn: (arg: Arg, get: Rx.Get, ctx: Context) => Effect.Effect<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR> }
  ): RxResultFn<E | RE, A, Arg>
}
```

Added in v1.0.0

## state

**Signature**

```ts
export declare const state: <A>(initialValue: A) => Writeable<A, A>
```

Added in v1.0.0

## stream

**Signature**

```ts
export declare const stream: {
  <E, A>(create: (get: Rx.Get, ctx: Context) => Stream.Stream<never, E, A>): Rx<
    Result.Result<E | NoSuchElementException, A>
  >
  <RR, R extends RR, E, A, RE>(
    create: (get: Rx.Get, ctx: Context) => Stream.Stream<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): Rx<Result.Result<E | RE | NoSuchElementException, A>>
}
```

Added in v1.0.0

## streamPull

**Signature**

```ts
export declare const streamPull: {
  <E, A>(
    create: (get: Rx.Get, ctx: Context) => Stream.Stream<never, E, A>,
    options?: { readonly disableAccumulation?: boolean }
  ): Writeable<Result.Result<NoSuchElementException | E, A[]>, void>
  <RR, R extends RR, E, A, RE>(
    create: (get: Rx.Get, ctx: Context) => Stream.Stream<R, E, A>,
    options: { readonly runtime: RxRuntime<RE, RR>; readonly disableAccumulation?: boolean | undefined }
  ): Writeable<Result.Result<NoSuchElementException | E | RE, A[]>, void>
}
```

Added in v1.0.0

## writeable

**Signature**

```ts
export declare const writeable: <R, W>(
  read: (get: Rx.Get, ctx: Context) => R,
  write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
) => Writeable<R, W>
```

Added in v1.0.0

# context

## Context (interface)

**Signature**

```ts
export interface Context {
  readonly get: Rx.Get
  readonly getResult: Rx.GetResult
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly refresh: Rx.Refresh
  readonly refreshSelf: () => void
  readonly self: <A>() => Option.Option<A>
  readonly setSelf: <A>(a: A) => void
  readonly set: Rx.Set
  readonly subscribe: <A>(
    rx: Rx<A>,
    f: (_: A) => void,
    options?: {
      readonly immediate?: boolean
    }
  ) => void
}
```

Added in v1.0.0

# models

## Refreshable (interface)

**Signature**

```ts
export interface Refreshable {
  readonly [RefreshableTypeId]: RefreshableTypeId
}
```

Added in v1.0.0

## Rx (interface)

**Signature**

```ts
export interface Rx<A> extends Pipeable, Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly read: (get: Rx.Get, ctx: Context) => A
  readonly refresh: (f: <A>(rx: Rx<A>) => void) => void
}
```

Added in v1.0.0

## Rx (namespace)

Added in v1.0.0

### Get (type alias)

**Signature**

```ts
export type Get = <A>(rx: Rx<A>) => A
```

Added in v1.0.0

### GetResult (type alias)

**Signature**

```ts
export type GetResult = <E, A>(rx: Rx<Result.Result<E, A>>) => Exit.Exit<E | NoSuchElementException, A>
```

Added in v1.0.0

### Mount (type alias)

**Signature**

```ts
export type Mount = <A>(rx: Rx<A>) => () => void
```

Added in v1.0.0

### Refresh (type alias)

**Signature**

```ts
export type Refresh = <A>(rx: Rx<A> & Refreshable) => void
```

Added in v1.0.0

### Set (type alias)

**Signature**

```ts
export type Set = <R, W>(rx: Writeable<R, W>, value: W) => void
```

Added in v1.0.0

### Subscribe (type alias)

**Signature**

```ts
export type Subscribe = <A>(
  rx: Rx<A>,
  f: (_: A) => void,
  options?: {
    readonly immediate?: boolean
  }
) => () => void
```

Added in v1.0.0

### SubscribeGetter (type alias)

**Signature**

```ts
export type SubscribeGetter = <A>(rx: Rx<A>, f: () => void) => readonly [get: () => A, unmount: () => void]
```

Added in v1.0.0

## RxResultFn (interface)

**Signature**

```ts
export interface RxResultFn<E, A, Arg> extends Writeable<Result.Result<E, A>, Arg> {}
```

Added in v1.0.0

## RxRuntime (interface)

**Signature**

```ts
export interface RxRuntime<E, A> extends Rx<Result.Result<E, Runtime.Runtime<A>>> {}
```

Added in v1.0.0

## Writeable (interface)

**Signature**

```ts
export interface Writeable<R, W> extends Rx<R> {
  readonly [WriteableTypeId]: WriteableTypeId
  readonly write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void
}
```

Added in v1.0.0

# type ids

## RefreshableTypeId

**Signature**

```ts
export declare const RefreshableTypeId: typeof RefreshableTypeId
```

Added in v1.0.0

## RefreshableTypeId (type alias)

**Signature**

```ts
export type RefreshableTypeId = typeof RefreshableTypeId
```

Added in v1.0.0

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

## WriteableTypeId

**Signature**

```ts
export declare const WriteableTypeId: typeof WriteableTypeId
```

Added in v1.0.0

## WriteableTypeId (type alias)

**Signature**

```ts
export type WriteableTypeId = typeof WriteableTypeId
```

Added in v1.0.0
