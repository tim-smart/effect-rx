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
  - [initialValue](#initialvalue)
  - [keepAlive](#keepalive)
  - [map](#map)
  - [mapResult](#mapresult)
  - [refreshable](#refreshable)
  - [setIdleTTL](#setidlettl)
  - [withFallback](#withfallback)
  - [withLabel](#withlabel)
- [constructors](#constructors)
  - [effect](#effect)
  - [effectFn](#effectfn)
  - [family](#family)
  - [fn](#fn)
  - [readable](#readable)
  - [runtime](#runtime)
  - [scoped](#scoped)
  - [scopedFn](#scopedfn)
  - [state](#state)
  - [stream](#stream)
  - [streamFn](#streamfn)
  - [streamPull](#streampull)
  - [writable](#writable)
- [context](#context)
  - [Context (interface)](#context-interface)
  - [WriteContext (interface)](#writecontext-interface)
- [models](#models)
  - [Refreshable (interface)](#refreshable-interface)
  - [Rx (interface)](#rx-interface)
  - [Rx (namespace)](#rx-namespace)
    - [Get (type alias)](#get-type-alias)
    - [GetResult (type alias)](#getresult-type-alias)
    - [Infer (type alias)](#infer-type-alias)
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
  - [StreamPullResult (type alias)](#streampullresult-type-alias)
  - [Writable (interface)](#writable-interface)
- [refinements](#refinements)
  - [isWritable](#iswritable)
- [type ids](#type-ids)
  - [RefreshableTypeId](#refreshabletypeid)
  - [RefreshableTypeId (type alias)](#refreshabletypeid-type-alias)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)
  - [WritableTypeId](#writabletypeid)
  - [WritableTypeId (type alias)](#writabletypeid-type-alias)

---

# batching

## batch

**Signature**

```ts
export declare const batch: (f: () => void) => void
```

Added in v1.0.0

# combinators

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
export declare const map: (<R extends Rx<any>, B>(
  f: (_: Rx.Infer<R>) => B
) => (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>) &
  (<R extends Rx<any>, B>(
    self: R,
    f: (_: Rx.Infer<R>) => B
  ) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Rx<B>)
```

Added in v1.0.0

## mapResult

**Signature**

```ts
export declare const mapResult: (<R extends Rx<Result.Result<any, any>>, B>(
  f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
) => (
  self: R
) => [R] extends [Writable<infer _, infer RW>]
  ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>, RW>
  : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>>) &
  (<R extends Rx<Result.Result<any, any>>, B>(
    self: R,
    f: (_: Result.Result.InferA<Rx.Infer<R>>) => B
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>, RW>
    : Rx<Result.Result<Result.Result.InferE<Rx.Infer<R>>, B>>)
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

## withFallback

**Signature**

```ts
export declare const withFallback: {
  <E2, A2>(fallback: Rx<Result.Result<E2, A2>>): <R extends Rx<Result.Result<any, any>>>(
    self: R
  ) => [R] extends [Writable<infer _, infer RW>]
    ? Writable<Result.Result<E2 | Result.Result.InferE<Rx.Infer<R>>, A2 | Result.Result.InferA<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<E2 | Result.Result.InferE<Rx.Infer<R>>, A2 | Result.Result.InferA<Rx.Infer<R>>>>
  <R extends Rx<Result.Result<any, any>>, E2, A2>(self: R, fallback: Rx<Result.Result<E2, A2>>): [R] extends [
    Writable<infer _, infer RW>
  ]
    ? Writable<Result.Result<E2 | Result.Result.InferE<Rx.Infer<R>>, A2 | Result.Result.InferA<Rx.Infer<R>>>, RW>
    : Rx<Result.Result<E2 | Result.Result.InferE<Rx.Infer<R>>, A2 | Result.Result.InferA<Rx.Infer<R>>>>
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

## effect

**Signature**

```ts
export declare const effect: {
  <E, A>(
    create: Rx.Read<Effect.Effect<never, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): Rx<Result.Result<E, A>>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Effect.Effect<R, E, A>>,
    options: { readonly runtime: RxRuntime<RE, RR>; readonly initialValue?: A | undefined }
  ): Rx<Result.Result<E | RE, A>>
}
```

Added in v1.0.0

## effectFn

**Signature**

```ts
export declare const effectFn: {
  <Arg, E, A>(
    fn: Rx.ReadFn<Arg, Effect.Effect<never, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): RxResultFn<E, A, Arg>
  <Arg, RR, R extends RR, E, A, RE>(
    fn: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
    options: { readonly runtime: RxRuntime<RE, RR>; readonly initialValue?: A | undefined }
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

## fn

**Signature**

```ts
export declare const fn: {
  <Arg, A>(f: Rx.ReadFn<Arg, A>): Writable<Option.Option<A>, Arg>
  <Arg, A>(f: Rx.ReadFn<Arg, A>, options: { readonly initialValue: A }): Writable<A, Arg>
}
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A>(read: Rx.Read<A>, refresh?: Rx.Refresh) => Rx<A>
```

Added in v1.0.0

## runtime

**Signature**

```ts
export declare const runtime: {
  <E, A>(
    layer: Layer.Layer<never, E, A>,
    options?: {
      readonly autoDispose?: boolean
      readonly idleTTL?: Duration.DurationInput
      readonly runtime?: undefined
    }
  ): RxRuntime<E, A>
  <RR, R extends RR, E, A, RE>(
    layer: Layer.Layer<R, E, A>,
    options?:
      | {
          readonly autoDispose?: boolean | undefined
          readonly idleTTL?: Duration.DurationInput | undefined
          readonly runtime: RxRuntime<RE, RR>
        }
      | undefined
  ): RxRuntime<E, RR | A>
}
```

Added in v1.0.0

## scoped

**Signature**

```ts
export declare const scoped: {
  <E, A>(
    create: Rx.Read<Effect.Effect<Scope.Scope, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): Rx<Result.Result<E, A>>
  <RR, R extends RR | Scope.Scope, E, A, RE>(
    create: Rx.Read<Effect.Effect<R, E, A>>,
    options: { readonly initialValue?: A | undefined; readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<E | RE, A>>
}
```

Added in v1.0.0

## scopedFn

**Signature**

```ts
export declare const scopedFn: {
  <Arg, E, A>(
    fn: Rx.ReadFn<Arg, Effect.Effect<Scope.Scope, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): RxResultFn<E, A, Arg>
  <Arg, RR, R extends Scope.Scope | RR, E, A, RE>(
    fn: Rx.ReadFn<Arg, Effect.Effect<R, E, A>>,
    options: { readonly initialValue?: A | undefined; readonly runtime: RxRuntime<RE, RR> }
  ): RxResultFn<E | RE, A, Arg>
}
```

Added in v1.0.0

## state

**Signature**

```ts
export declare const state: <A>(initialValue: A) => Writable<A, A>
```

Added in v1.0.0

## stream

**Signature**

```ts
export declare const stream: {
  <E, A>(
    create: Rx.Read<Stream.Stream<never, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): Rx<Result.Result<E | NoSuchElementException, A>>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Stream.Stream<R, E, A>>,
    options: { readonly initialValue?: A | undefined; readonly runtime: RxRuntime<RE, RR> }
  ): Rx<Result.Result<E | RE | NoSuchElementException, A>>
}
```

Added in v1.0.0

## streamFn

**Signature**

```ts
export declare const streamFn: {
  <Arg, E, A>(
    fn: Rx.ReadFn<Arg, Stream.Stream<never, E, A>>,
    options?: { readonly initialValue?: A | undefined; readonly runtime?: undefined } | undefined
  ): RxResultFn<NoSuchElementException | E, A, Arg>
  <Arg, RR, R extends RR, E, A, RE>(
    fn: Rx.ReadFn<Arg, Stream.Stream<R, E, A>>,
    options: { readonly runtime: RxRuntime<RE, RR>; readonly initialValue?: A | undefined }
  ): RxResultFn<NoSuchElementException | E | RE, A, Arg>
}
```

Added in v1.0.0

## streamPull

**Signature**

```ts
export declare const streamPull: {
  <E, A>(
    create: Rx.Read<Stream.Stream<never, E, A>>,
    options?:
      | {
          readonly disableAccumulation?: boolean | undefined
          readonly initialValue?: readonly A[] | undefined
          readonly runtime?: undefined
        }
      | undefined
  ): Writable<StreamPullResult<E, A>, void>
  <RR, R extends RR, E, A, RE>(
    create: Rx.Read<Stream.Stream<R, E, A>>,
    options: {
      readonly runtime: RxRuntime<RE, RR>
      readonly disableAccumulation?: boolean | undefined
      readonly initialValue?: readonly A[] | undefined
    }
  ): Writable<StreamPullResult<E | RE, A>, void>
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
  readonly get: Rx.Get
  readonly result: Rx.GetResult
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly mount: <A>(rx: Rx<A>) => void
  readonly refreshSync: Rx.RefreshRxSync
  readonly refresh: Rx.RefreshRx
  readonly refreshSelfSync: () => void
  readonly refreshSelf: Effect.Effect<never, never, void>
  readonly self: <A>() => Option.Option<A>
  readonly setSelfSync: <A>(a: A) => void
  readonly setSelf: <A>(a: A) => Effect.Effect<never, never, void>
  readonly setSync: Rx.Set
  readonly set: Rx.SetEffect
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
  readonly get: Rx.Get
  readonly refreshSelf: () => void
  readonly setSelf: (a: A) => void
  readonly set: Rx.Set
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
export type GetResult = <E, A>(rx: Rx<Result.Result<E, A>>) => Exit.Exit<E | NoSuchElementException, A>
```

Added in v1.0.0

### Infer (type alias)

**Signature**

```ts
export type Infer<T extends Rx<any>> = T extends Rx<infer A> ? A : never
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
export type RefreshRx = <A>(rx: Rx<A> & Refreshable) => Effect.Effect<never, never, void>
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
export type SetEffect = <R, W>(rx: Writable<R, W>, value: W) => Effect.Effect<never, never, void>
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
export interface RxResultFn<E, A, Arg> extends Writable<Result.Result<E, A>, Arg> {}
```

Added in v1.0.0

## RxRuntime (interface)

**Signature**

```ts
export interface RxRuntime<E, A> extends Rx<Result.Result<E, Runtime.Runtime<A>>> {}
```

Added in v1.0.0

## StreamPullResult (type alias)

**Signature**

```ts
export type StreamPullResult<E, A> = Result.Result<
  E | NoSuchElementException,
  {
    readonly done: boolean
    readonly items: Array<A>
  }
>
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
