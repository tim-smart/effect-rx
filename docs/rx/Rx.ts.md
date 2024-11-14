---
title: Rx.ts
nav_order: 4
parent: "@effect-rx/rx"
---

## Rx overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [batching](#batching)
  - [batch](#batch)
- [combinators](#combinators)
  - [debounce](#debounce)
  - [initialValue](#initialvalue)
  - [keepAlive](#keepalive)
  - [map](#map)
  - [mapResult](#mapresult)
  - [refreshable](#refreshable)
  - [setIdleTTL](#setidlettl)
  - [transform](#transform)
  - [withFallback](#withfallback)
  - [withLabel](#withlabel)
- [constructors](#constructors)
  - [context](#context)
  - [family](#family)
  - [fn](#fn)
  - [fnSync](#fnsync)
  - [make](#make)
  - [pull](#pull)
  - [readable](#readable)
  - [subscribable](#subscribable)
  - [subscriptionRef](#subscriptionref)
  - [writable](#writable)
- [context](#context-1)
  - [Context (interface)](#context-interface)
  - [WriteContext (interface)](#writecontext-interface)
  - [runtime](#runtime)
- [models](#models)
  - [PullResult (type alias)](#pullresult-type-alias)
  - [Refreshable (interface)](#refreshable-interface)
  - [Rx (interface)](#rx-interface)
  - [Rx (namespace)](#rx-namespace)
    - [Get (type alias)](#get-type-alias)
    - [GetResult (type alias)](#getresult-type-alias)
    - [Infer (type alias)](#infer-type-alias)
    - [InferFailure (type alias)](#inferfailure-type-alias)
    - [InferPullSuccess (type alias)](#inferpullsuccess-type-alias)
    - [InferSuccess (type alias)](#infersuccess-type-alias)
    - [Mount (type alias)](#mount-type-alias)
    - [Read (type alias)](#read-type-alias)
    - [ReadFn (type alias)](#readfn-type-alias)
    - [Refresh (type alias)](#refresh-type-alias)
    - [RefreshRx (type alias)](#refreshrx-type-alias)
    - [RefreshRxSync (type alias)](#refreshrxsync-type-alias)
    - [Set (type alias)](#set-type-alias)
    - [SetEffect (type alias)](#seteffect-type-alias)
    - [Subscribe (type alias)](#subscribe-type-alias)
    - [Write (type alias)](#write-type-alias)
  - [RxResultFn (interface)](#rxresultfn-interface)
  - [RxRuntime (interface)](#rxruntime-interface)
  - [Writable (interface)](#writable-interface)
- [refinements](#refinements)
  - [isWritable](#iswritable)
- [symbols](#symbols)
  - [Reset](#reset)
  - [Reset (type alias)](#reset-type-alias)
- [type ids](#type-ids)
  - [RefreshableTypeId](#refreshabletypeid)
  - [RefreshableTypeId (type alias)](#refreshabletypeid-type-alias)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)
  - [WritableTypeId](#writabletypeid)
  - [WritableTypeId (type alias)](#writabletypeid-type-alias)
- [utils](#utils)
  - [RxResultFn (namespace)](#rxresultfn-namespace)
    - [ArgToVoid (type alias)](#argtovoid-type-alias)

---

# batching

## batch

**Signature**

```ts
export declare const batch: (f: () => void) => void
```

Added in v1.0.0

# combinators

## debounce

**Signature**

```ts
export declare const debounce: {
  (duration: Duration.DurationInput): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, duration: Duration.DurationInput): A
}
```

Added in v1.0.0

## initialValue

**Signature**

```ts
export declare const initialValue: {
  <A>(initialValue: A): (self: Rx<A>) => readonly [Rx<A>, A]
  <A>(self: Rx<A>, initialValue: A): readonly [Rx<A>, A]
}
```

Added in v1.0.0

## keepAlive

**Signature**

```ts
export declare const keepAlive: <A extends Rx<any>>(self: A) => A
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <R extends Rx<any>, B>(
    f: (_: Rx.Infer<R>) => B
  ): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
  <R extends Rx<any>, B>(
    self: R,
    f: (_: Rx.Infer<R>) => B
  ): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
}
```

Added in v1.0.0

## mapResult

**Signature**

```ts
export declare const mapResult: {
  <R extends Rx<Result.Result<any, any>>, B>(
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ): (
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>>
  <R extends Rx<Result.Result<any, any>>, B>(
    self: R,
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ): [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<B, Result.Result.InferE<Rx.Infer<R>>>>
}
```

Added in v1.0.0

## refreshable

**Signature**

```ts
export declare const refreshable: <T extends Rx<any>>(self: T) => T & Refreshable
```

Added in v1.0.0

## setIdleTTL

**Signature**

```ts
export declare const setIdleTTL: {
  (duration: Duration.DurationInput): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, duration: Duration.DurationInput): A
}
```

Added in v1.0.0

## transform

**Signature**

```ts
export declare const transform: {
  <R extends Rx<any>, B>(
    f: (get: Context) => B
  ): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
  <R extends Rx<any>, B>(
    self: R,
    f: (get: Context) => B
  ): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>
}
```

Added in v1.0.0

## withFallback

**Signature**

```ts
export declare const withFallback: {
  <E2, A2>(
    fallback: Rx<Result.Result<A2, E2>>
  ): <R extends Rx<Result.Result<any, any>>>(
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>, RW>
    : Rx<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>>
  <R extends Rx<Result.Result<any, any>>, A2, E2>(
    self: R,
    fallback: Rx<Result.Result<A2, E2>>
  ): [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>, RW>
    : Rx<Result.Result<Result.Result.InferA<Rx.Infer<R>> | A2, Result.Result.InferE<Rx.Infer<R>> | E2>>
}
```

Added in v1.0.0

## withLabel

**Signature**

```ts
export declare const withLabel: {
  (name: string): <A extends Rx<any>>(self: A) => A
  <A extends Rx<any>>(self: A, name: string): A
}
```

Added in v1.0.0

# constructors

## context

**Signature**

```ts
export declare const context: () => <R, E>(create: Layer.Layer<R, E> | Rx.Read<Layer.Layer<R, E>>) => RxRuntime<R, E>
```

Added in v1.0.0

## family

**Signature**

```ts
export declare const family: <Arg, T extends object>(f: (arg: Arg) => T) => (arg: Arg) => T
```

Added in v1.0.0

## fn

**Signature**

```ts
export declare const fn: {
  <Arg, E, A>(
    fn: Rx.ReadFn<Arg, Effect.Effect<A, E, Scope.Scope>>,
    options?: { readonly initialValue?: A }
  ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E>
  <Arg, E, A>(
    fn: Rx.ReadFn<Arg, Stream.Stream<A, E>>,
    options?: { readonly initialValue?: A }
  ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException>
}
```

Added in v1.0.0

## fnSync

**Signature**

```ts
export declare const fnSync: {
  <Arg, A>(f: Rx.ReadFn<Arg, A>): Writable<Option.Option<A>, RxResultFn.ArgToVoid<Arg>>
  <Arg, A>(f: Rx.ReadFn<Arg, A>, options: { readonly initialValue: A }): Writable<A, RxResultFn.ArgToVoid<Arg>>
}
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: {
  <A, E>(effect: Effect.Effect<A, E, Scope.Scope>, options?: { readonly initialValue?: A }): Rx<Result.Result<A, E>>
  <A, E>(
    create: Rx.Read<Effect.Effect<A, E, Scope.Scope>>,
    options?: { readonly initialValue?: A }
  ): Rx<Result.Result<A, E>>
  <A, E>(stream: Stream.Stream<A, E>, options?: { readonly initialValue?: A }): Rx<Result.Result<A, E>>
  <A, E>(create: Rx.Read<Stream.Stream<A, E>>, options?: { readonly initialValue?: A }): Rx<Result.Result<A, E>>
  <A>(create: Rx.Read<A>): Rx<A>
  <A>(initialValue: A): Writable<A, A>
}
```

Added in v1.0.0

## pull

**Signature**

```ts
export declare const pull: <A, E>(
  create: Rx.Read<Stream.Stream<A, E>> | Stream.Stream<A, E>,
  options?: { readonly disableAccumulation?: boolean; readonly initialValue?: ReadonlyArray<A> }
) => Writable<PullResult<A, E>, void>
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A>(read: Rx.Read<A>, refresh?: Rx.Refresh) => Rx<A>
```

Added in v1.0.0

## subscribable

**Signature**

```ts
export declare const subscribable: {
  <A, E>(ref: Subscribable.Subscribable<A, E> | Rx.Read<Subscribable.Subscribable<A, E>>): Rx<A>
  <A, E, E1>(
    effect:
      | Effect.Effect<Subscribable.Subscribable<A, E1>, E, never>
      | Rx.Read<Effect.Effect<Subscribable.Subscribable<A, E1>, E, never>>
  ): Rx<Result.Result<A, E | E1>>
}
```

Added in v1.0.0

## subscriptionRef

**Signature**

```ts
export declare const subscriptionRef: {
  <A>(ref: SubscriptionRef.SubscriptionRef<A> | Rx.Read<SubscriptionRef.SubscriptionRef<A>>): Writable<A, A>
  <A, E>(
    effect:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, never>
      | Rx.Read<Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, never>>
  ): Writable<Result.Result<A, E>, A>
}
```

Added in v1.0.0

## writable

**Signature**

```ts
export declare const writable: <R, W>(read: Rx.Read<R>, write: Rx.Write<R, W>, refresh?: Rx.Refresh) => Writable<R, W>
```

Added in v1.0.0

# context

## Context (interface)

**Signature**

```ts
export interface Context {
  <A>(rx: Rx<A>): A
  readonly get: <A>(rx: Rx<A>) => A
  readonly result: <A, E>(rx: Rx<Result.Result<A, E>>) => Effect.Effect<A, E>
  readonly once: <A>(rx: Rx<A>) => A
  readonly addFinalizer: (f: () => void) => void
  readonly mount: <A>(rx: Rx<A>) => void
  readonly refreshSync: <A>(rx: Rx<A> & Refreshable) => void
  readonly refresh: <A>(rx: Rx<A> & Refreshable) => Effect.Effect<void>
  readonly refreshSelfSync: () => void
  readonly refreshSelf: Effect.Effect<void>
  readonly self: <A>() => Option.Option<A>
  readonly setSelfSync: <A>(a: A) => void
  readonly setSelf: <A>(a: A) => Effect.Effect<void>
  readonly setSync: <R, W>(rx: Writable<R, W>, value: W) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<void>
  readonly some: <A>(rx: Rx<Option.Option<A>>) => Effect.Effect<A>
  readonly stream: <A>(
    rx: Rx<A>,
    options?: {
      readonly withoutInitialValue?: boolean
      readonly bufferSize?: number
    }
  ) => Stream.Stream<A>
  readonly streamResult: <A, E>(
    rx: Rx<Result.Result<A, E>>,
    options?: {
      readonly withoutInitialValue?: boolean
      readonly bufferSize?: number
    }
  ) => Stream.Stream<A, E>
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

## WriteContext (interface)

**Signature**

```ts
export interface WriteContext<A> {
  readonly get: <A>(rx: Rx<A>) => A
  readonly refreshSelf: () => void
  readonly setSelf: (a: A) => void
  readonly set: <R, W>(rx: Writable<R, W>, value: W) => void
}
```

Added in v1.0.0

## runtime

**Signature**

```ts
export declare const runtime: <R, E>(create: Layer.Layer<R, E> | Rx.Read<Layer.Layer<R, E>>) => RxRuntime<R, E>
```

Added in v1.0.0

# models

## PullResult (type alias)

**Signature**

```ts
export type PullResult<A, E = never> = Result.Result<
  {
    readonly done: boolean
    readonly items: Array<A>
  },
  E | NoSuchElementException
>
```

Added in v1.0.0

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
  readonly read: Rx.Read<A>
  readonly refresh?: Rx.Refresh
  readonly label?: readonly [name: string, stack: string]
  readonly idleTTL?: number
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
export type GetResult = <A, E>(rx: Rx<Result.Result<A, E>>) => Effect.Effect<A, E>
```

Added in v1.0.0

### Infer (type alias)

**Signature**

```ts
export type Infer<T extends Rx<any>> = T extends Rx<infer A> ? A : never
```

Added in v1.0.0

### InferFailure (type alias)

**Signature**

```ts
export type InferFailure<T extends Rx<any>> = T extends Rx<Result.Result<infer _, infer E>> ? E : never
```

Added in v1.0.0

### InferPullSuccess (type alias)

**Signature**

```ts
export type InferPullSuccess<T extends Rx<any>> = T extends Rx<PullResult<infer A, infer _>> ? A : never
```

Added in v1.0.0

### InferSuccess (type alias)

**Signature**

```ts
export type InferSuccess<T extends Rx<any>> = T extends Rx<Result.Result<infer A, infer _>> ? A : never
```

Added in v1.0.0

### Mount (type alias)

**Signature**

```ts
export type Mount = <A>(rx: Rx<A>) => () => void
```

Added in v1.0.0

### Read (type alias)

**Signature**

```ts
export type Read<A> = (ctx: Context) => A
```

Added in v1.0.0

### ReadFn (type alias)

**Signature**

```ts
export type ReadFn<Arg, A> = (arg: Arg, ctx: Context) => A
```

Added in v1.0.0

### Refresh (type alias)

**Signature**

```ts
export type Refresh = (f: <A>(rx: Rx<A>) => void) => void
```

Added in v1.0.0

### RefreshRx (type alias)

**Signature**

```ts
export type RefreshRx = <A>(rx: Rx<A> & Refreshable) => Effect.Effect<void>
```

Added in v1.0.0

### RefreshRxSync (type alias)

**Signature**

```ts
export type RefreshRxSync = <A>(rx: Rx<A> & Refreshable) => void
```

Added in v1.0.0

### Set (type alias)

**Signature**

```ts
export type Set = <R, W>(rx: Writable<R, W>, value: W) => void
```

Added in v1.0.0

### SetEffect (type alias)

**Signature**

```ts
export type SetEffect = <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<void>
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

### Write (type alias)

**Signature**

```ts
export type Write<R, W> = (ctx: WriteContext<R>, value: W) => void
```

Added in v1.0.0

## RxResultFn (interface)

**Signature**

```ts
export interface RxResultFn<Arg, A, E = never> extends Writable<Result.Result<A, E>, Arg | Reset> {}
```

Added in v1.0.0

## RxRuntime (interface)

**Signature**

```ts
export interface RxRuntime<R, ER> extends Rx<Result.Result<Runtime.Runtime<R>, ER>> {
  readonly layer: Rx<Layer.Layer<R, ER>>

  readonly rx: {
    <A, E>(
      effect: Effect.Effect<A, E, Scope.Scope | R>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
    <A, E>(
      create: Rx.Read<Effect.Effect<A, E, Scope.Scope | R>>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
    <A, E>(
      stream: Stream.Stream<A, E, never | R>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
    <A, E>(
      create: Rx.Read<Stream.Stream<A, E, never | R>>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
  }

  readonly fn: {
    <Arg, E, A>(
      fn: Rx.ReadFn<Arg, Effect.Effect<A, E, Scope.Scope | R>>,
      options?: {
        readonly initialValue?: A
      }
    ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER>
    <Arg, E, A>(
      fn: Rx.ReadFn<Arg, Stream.Stream<A, E, R>>,
      options?: {
        readonly initialValue?: A
      }
    ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER | NoSuchElementException>
  }

  readonly pull: <A, E>(
    create: Rx.Read<Stream.Stream<A, E, R>> | Stream.Stream<A, E, R>,
    options?: {
      readonly disableAccumulation?: boolean
      readonly initialValue?: ReadonlyArray<A>
    }
  ) => Writable<PullResult<A, E | ER>, void>

  readonly subscriptionRef: <A, E>(
    create:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R>
      | Rx.Read<Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R>>
  ) => Writable<Result.Result<A, E>, A>

  readonly subscribable: <A, E, E1 = never>(
    create:
      | Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R>
      | Rx.Read<Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R>>
  ) => Rx<Result.Result<A, E | E1>>
}
```

Added in v1.0.0

## Writable (interface)

**Signature**

```ts
export interface Writable<R, W> extends Rx<R> {
  readonly [WritableTypeId]: WritableTypeId
  readonly write: Rx.Write<R, W>
}
```

Added in v1.0.0

# refinements

## isWritable

**Signature**

```ts
export declare const isWritable: <R, W>(rx: Rx<R>) => rx is Writable<R, W>
```

Added in v1.0.0

# symbols

## Reset

**Signature**

```ts
export declare const Reset: typeof Reset
```

Added in v1.0.0

## Reset (type alias)

**Signature**

```ts
export type Reset = typeof Reset
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

## WritableTypeId

**Signature**

```ts
export declare const WritableTypeId: typeof WritableTypeId
```

Added in v1.0.0

## WritableTypeId (type alias)

**Signature**

```ts
export type WritableTypeId = typeof WritableTypeId
```

Added in v1.0.0

# utils

## RxResultFn (namespace)

Added in v1.0.0

### ArgToVoid (type alias)

**Signature**

```ts
export type ArgToVoid<Arg> = Arg extends infer A ? (unknown extends A ? void : A extends undefined ? void : A) : never
```

Added in v1.0.0
