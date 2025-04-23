---
title: Rx.ts
nav_order: 4
parent: "@effect-rx/rx"
---

## Rx overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Conversions](#conversions)
  - [get](#get)
  - [getResult](#getresult)
  - [toStream](#tostream)
  - [toStreamResult](#tostreamresult)
- [KeyValueStore](#keyvaluestore)
  - [kvs](#kvs)
- [URL search params](#url-search-params)
  - [searchParam](#searchparam)
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
  - [defaultMemoMap](#defaultmemomap)
  - [runtime](#runtime)
- [models](#models)
  - [PullResult (type alias)](#pullresult-type-alias)
  - [Refreshable (interface)](#refreshable-interface)
  - [RuntimeFactory (interface)](#runtimefactory-interface)
  - [Rx (interface)](#rx-interface)
  - [Rx (namespace)](#rx-namespace)
    - [Infer (type alias)](#infer-type-alias)
    - [InferFailure (type alias)](#inferfailure-type-alias)
    - [InferPullSuccess (type alias)](#inferpullsuccess-type-alias)
    - [InferSuccess (type alias)](#infersuccess-type-alias)
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

# Conversions

## get

**Signature**

```ts
export declare const get: <A>(self: Rx<A>) => Effect.Effect<A, never, RxRegistry>
```

Added in v1.0.0

## getResult

**Signature**

```ts
export declare const getResult: <A, E>(self: Rx<Result.Result<A, E>>) => Effect.Effect<A, E, RxRegistry>
```

Added in v1.0.0

## toStream

**Signature**

```ts
export declare const toStream: <A>(self: Rx<A>) => Stream.Stream<A, never, RxRegistry>
```

Added in v1.0.0

## toStreamResult

**Signature**

```ts
export declare const toStreamResult: <A, E>(self: Rx<Result.Result<A, E>>) => Stream.Stream<A, E, RxRegistry>
```

Added in v1.0.0

# KeyValueStore

## kvs

**Signature**

```ts
export declare const kvs: <A>(options: {
  readonly runtime: RxRuntime<KeyValueStore.KeyValueStore, any>
  readonly key: string
  readonly schema: Schema.Schema<A, any>
  readonly defaultValue: LazyArg<A>
}) => Writable<A>
```

Added in v1.0.0

# URL search params

## searchParam

**Signature**

```ts
export declare const searchParam: (name: string) => Writable<string>
```

Added in v1.0.0

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
export declare const context: (options?: { readonly memoMap?: Layer.MemoMap | undefined }) => RuntimeFactory
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
    fn: (arg: Arg, get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>,
    options?: { readonly initialValue?: A }
  ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E>
  <Arg, E, A>(
    fn: (arg: Arg, get: Context) => Stream.Stream<A, E, RxRegistry>,
    options?: { readonly initialValue?: A }
  ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | NoSuchElementException>
}
```

Added in v1.0.0

## fnSync

**Signature**

```ts
export declare const fnSync: {
  <Arg, A>(f: (arg: Arg, get: Context) => A): Writable<Option.Option<A>, RxResultFn.ArgToVoid<Arg>>
  <Arg, A>(
    f: (arg: Arg, get: Context) => A,
    options: { readonly initialValue: A }
  ): Writable<A, RxResultFn.ArgToVoid<Arg>>
}
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: {
  <A, E>(
    effect: Effect.Effect<A, E, Scope.Scope | RxRegistry>,
    options?: { readonly initialValue?: A }
  ): Rx<Result.Result<A, E>>
  <A, E>(
    create: (get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry>,
    options?: { readonly initialValue?: A }
  ): Rx<Result.Result<A, E>>
  <A, E>(stream: Stream.Stream<A, E, RxRegistry>, options?: { readonly initialValue?: A }): Rx<Result.Result<A, E>>
  <A, E>(
    create: (get: Context) => Stream.Stream<A, E, RxRegistry>,
    options?: { readonly initialValue?: A }
  ): Rx<Result.Result<A, E>>
  <A>(create: (get: Context) => A): Rx<A>
  <A>(initialValue: A): Writable<A>
}
```

Added in v1.0.0

## pull

**Signature**

```ts
export declare const pull: <A, E>(
  create: ((get: Context) => Stream.Stream<A, E, RxRegistry>) | Stream.Stream<A, E, RxRegistry>,
  options?: { readonly disableAccumulation?: boolean; readonly initialValue?: ReadonlyArray<A> }
) => Writable<PullResult<A, E>, void>
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A>(read: (get: Context) => A, refresh?: (f: <A>(rx: Rx<A>) => void) => void) => Rx<A>
```

Added in v1.0.0

## subscribable

**Signature**

```ts
export declare const subscribable: {
  <A, E>(ref: Subscribable.Subscribable<A, E> | ((get: Context) => Subscribable.Subscribable<A, E>)): Rx<A>
  <A, E, E1>(
    effect:
      | Effect.Effect<Subscribable.Subscribable<A, E1>, E, Scope.Scope | RxRegistry>
      | ((get: Context) => Effect.Effect<Subscribable.Subscribable<A, E1>, E, Scope.Scope | RxRegistry>)
  ): Rx<Result.Result<A, E | E1>>
}
```

Added in v1.0.0

## subscriptionRef

**Signature**

```ts
export declare const subscriptionRef: {
  <A>(ref: SubscriptionRef.SubscriptionRef<A> | ((get: Context) => SubscriptionRef.SubscriptionRef<A>)): Writable<A>
  <A, E>(
    effect:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | RxRegistry>
      | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | RxRegistry>)
  ): Writable<Result.Result<A, E>, A>
}
```

Added in v1.0.0

## writable

**Signature**

```ts
export declare const writable: <R, W>(
  read: (get: Context) => R,
  write: (ctx: WriteContext<R>, value: W) => void,
  refresh?: (f: <A>(rx: Rx<A>) => void) => void
) => Writable<R, W>
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
  readonly resultOnce: <A, E>(rx: Rx<Result.Result<A, E>>) => Effect.Effect<A, E>
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
  readonly someOnce: <A>(rx: Rx<Option.Option<A>>) => Effect.Effect<A>
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
  readonly registry: Registry
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

## defaultMemoMap

**Signature**

```ts
export declare const defaultMemoMap: Layer.MemoMap
```

Added in v1.0.0

## runtime

**Signature**

```ts
export declare const runtime: RuntimeFactory
```

Added in v1.0.0

# models

## PullResult (type alias)

**Signature**

```ts
export type PullResult<A, E = never> = Result.Result<
  {
    readonly done: boolean
    readonly items: ReadonlyArray<A>
  },
  E
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

## RuntimeFactory (interface)

**Signature**

```ts
export interface RuntimeFactory {
  <R, E>(create: Layer.Layer<R, E, RxRegistry> | ((get: Context) => Layer.Layer<R, E, RxRegistry>)): RxRuntime<R, E>
  readonly memoMap: Layer.MemoMap
}
```

Added in v1.0.0

## Rx (interface)

**Signature**

```ts
export interface Rx<A> extends Pipeable, Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly read: (get: Context) => A
  readonly refresh?: (f: <A>(rx: Rx<A>) => void) => void
  readonly label?: readonly [name: string, stack: string]
  readonly idleTTL?: number
}
```

Added in v1.0.0

## Rx (namespace)

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
      create: (get: Context) => Effect.Effect<A, E, Scope.Scope | R | RxRegistry>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
    <A, E>(
      stream: Stream.Stream<A, E, RxRegistry | R>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
    <A, E>(
      create: (get: Context) => Stream.Stream<A, E, RxRegistry | R>,
      options?: {
        readonly initialValue?: A
      }
    ): Rx<Result.Result<A, E | ER>>
  }

  readonly fn: {
    <Arg, E, A>(
      fn: (arg: Arg, get: Context) => Effect.Effect<A, E, Scope.Scope | RxRegistry | R>,
      options?: {
        readonly initialValue?: A
      }
    ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER>
    <Arg, E, A>(
      fn: (arg: Arg, get: Context) => Stream.Stream<A, E, RxRegistry | R>,
      options?: {
        readonly initialValue?: A
      }
    ): RxResultFn<RxResultFn.ArgToVoid<Arg>, A, E | ER | NoSuchElementException>
  }

  readonly pull: <A, E>(
    create: ((get: Context) => Stream.Stream<A, E, R | RxRegistry>) | Stream.Stream<A, E, R | RxRegistry>,
    options?: {
      readonly disableAccumulation?: boolean
      readonly initialValue?: ReadonlyArray<A>
    }
  ) => Writable<PullResult<A, E | ER>, void>

  readonly subscriptionRef: <A, E>(
    create:
      | Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R | RxRegistry>
      | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, R | RxRegistry>)
  ) => Writable<Result.Result<A, E>, A>

  readonly subscribable: <A, E, E1 = never>(
    create:
      | Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R | RxRegistry>
      | ((get: Context) => Effect.Effect<Subscribable.Subscribable<A, E, R>, E1, R | RxRegistry>)
  ) => Rx<Result.Result<A, E | E1>>
}
```

Added in v1.0.0

## Writable (interface)

**Signature**

```ts
export interface Writable<R, W = R> extends Rx<R> {
  readonly [WritableTypeId]: WritableTypeId
  readonly write: (ctx: WriteContext<R>, value: W) => void
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
