---
title: Rx.ts
nav_order: 3
parent: "@effect-rx/rx"
---

## Rx overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [accessors](#accessors)
  - [access](#access)
  - [accessResult](#accessresult)
- [combinators](#combinators)
  - [keepAlive](#keepalive)
  - [refreshable](#refreshable)
- [constructors](#constructors)
  - [effect](#effect)
  - [effectFn](#effectfn)
  - [fn](#fn)
  - [readable](#readable)
  - [runtime](#runtime)
  - [scoped](#scoped)
  - [scopedFn](#scopedfn)
  - [state](#state)
  - [writable](#writable)
- [context](#context)
  - [Context](#context-1)
  - [Context (interface)](#context-interface)
  - [RxContext (interface)](#rxcontext-interface)
  - [context](#context-2)
  - [contextResult](#contextresult)
- [models](#models)
  - [Refreshable (interface)](#refreshable-interface)
  - [Rx (interface)](#rx-interface)
  - [Rx (namespace)](#rx-namespace)
    - [Get (type alias)](#get-type-alias)
    - [Mount (type alias)](#mount-type-alias)
    - [Refresh (type alias)](#refresh-type-alias)
    - [Set (type alias)](#set-type-alias)
    - [Subscribe (type alias)](#subscribe-type-alias)
    - [SubscribeGetter (type alias)](#subscribegetter-type-alias)
  - [RxResult (interface)](#rxresult-interface)
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

# accessors

## access

**Signature**

```ts
export declare const access: <A>(rx: Rx<A>) => Effect.Effect<RxContext, never, A>
```

Added in v1.0.0

## accessResult

**Signature**

```ts
export declare const accessResult: <E, A>(rx: RxResult<E, A>) => Effect.Effect<RxContext, E | NoSuchElementException, A>
```

Added in v1.0.0

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
  <E, A>(effect: Effect.Effect<RxContext, E, A>): RxResult<E, A>
  <RR, R extends RxContext | RR, E, A, RE>(effect: Effect.Effect<R, E, A>, runtime: RxRuntime<RE, RR>): RxResult<
    E | RE,
    A
  >
}
```

Added in v1.0.0

## effectFn

**Signature**

```ts
export declare const effectFn: {
  <Args extends any[], E, A>(fn: (...args: Args) => Effect.Effect<RxContext, E, A>): RxResultFn<E, A, Args>
  <Args extends any[], RR, R extends RxContext | RR, E, A, RE>(
    fn: (...args: Args) => Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): RxResultFn<E | RE, A, Args>
}
```

Added in v1.0.0

## fn

**Signature**

```ts
export declare const fn: <A, Args extends any[]>(initialValue: A, fn: (...args: Args) => A) => Writeable<A, Args>
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A>(read: (ctx: Context<A>) => A, refresh?: (f: <A>(rx: Rx<A>) => void) => void) => Rx<A>
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
  <E, A>(effect: Effect.Effect<RxContext | Scope.Scope, E, A>): RxResult<E, A>
  <RR, R extends RxContext | RR | Scope.Scope, E, A, RE>(
    effect: Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): RxResult<E | RE, A>
}
```

Added in v1.0.0

## scopedFn

**Signature**

```ts
export declare const scopedFn: {
  <Args extends any[], E, A>(fn: (...args: Args) => Effect.Effect<RxContext | Scope.Scope, E, A>): RxResultFn<
    E,
    A,
    Args
  >
  <Args extends any[], RR, R extends RxContext | Scope.Scope | RR, E, A, RE>(
    fn: (...args: Args) => Effect.Effect<R, E, A>,
    runtime: RxRuntime<RE, RR>
  ): RxResultFn<E | RE, A, Args>
}
```

Added in v1.0.0

## state

**Signature**

```ts
export declare const state: <A>(initialValue: A) => Writeable<A, A>
```

Added in v1.0.0

## writable

**Signature**

```ts
export declare const writable: <R, W>(
  read: (ctx: Context<R>) => R,
  write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
) => Writeable<R, W>
```

Added in v1.0.0

# context

## Context

**Signature**

```ts
export declare const Context: EffectContext.Tag<RxContext, Context<unknown>>
```

Added in v1.0.0

## Context (interface)

**Signature**

```ts
export interface Context<A> {
  readonly get: Rx.Get
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly refresh: Rx.Refresh
  readonly refreshSelf: () => void
  readonly self: () => Option.Option<A>
  readonly setSelf: (a: A) => void
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

## RxContext (interface)

**Signature**

```ts
export interface RxContext {
  readonly _: unique symbol
}
```

Added in v1.0.0

## context

**Signature**

```ts
export declare const context: <A>() => Effect.Effect<RxContext, never, Context<A>>
```

Added in v1.0.0

## contextResult

**Signature**

```ts
export declare const contextResult: <E, A>() => Effect.Effect<RxContext, never, Context<Result.Result<E, A>>>
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
export interface Rx<A> extends Pipeable, Effect.Effect<RxContext, never, A> {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly read: (ctx: Context<A>) => A
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

## RxResult (interface)

**Signature**

```ts
export interface RxResult<E, A> extends Rx<Result.Result<E, A>> {}
```

Added in v1.0.0

## RxResultFn (interface)

**Signature**

```ts
export interface RxResultFn<E, A, Args extends Array<any>> extends Writeable<Result.Result<E, A>, Args> {}
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
