---
title: Registry.ts
nav_order: 2
parent: "@effect-rx/rx"
---

## Registry overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Conversions](#conversions)
  - [getResult](#getresult)
  - [toStream](#tostream)
  - [toStreamResult](#tostreamresult)
- [Layers](#layers)
  - [layer](#layer)
  - [layerOptions](#layeroptions)
- [Tags](#tags)
  - [RxRegistry (class)](#rxregistry-class)
- [constructors](#constructors)
  - [make](#make)
- [models](#models)
  - [Registry (interface)](#registry-interface)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# Conversions

## getResult

**Signature**

```ts
export declare const getResult: {
  <A, E>(rx: Rx.Rx<Result.Result<A, E>>): (self: Registry) => Effect.Effect<A, E>
  <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Effect.Effect<A, E>
}
```

Added in v1.0.0

## toStream

**Signature**

```ts
export declare const toStream: {
  <A>(rx: Rx.Rx<A>): (self: Registry) => Stream.Stream<A>
  <A>(self: Registry, rx: Rx.Rx<A>): Stream.Stream<A>
}
```

Added in v1.0.0

## toStreamResult

**Signature**

```ts
export declare const toStreamResult: {
  <A, E>(rx: Rx.Rx<Result.Result<A, E>>): (self: Registry) => Stream.Stream<A, E>
  <A, E>(self: Registry, rx: Rx.Rx<Result.Result<A, E>>): Stream.Stream<A, E>
}
```

Added in v1.0.0

# Layers

## layer

**Signature**

```ts
export declare const layer: Layer.Layer<Registry.RxRegistry, never, never>
```

Added in v1.0.0

## layerOptions

**Signature**

```ts
export declare const layerOptions: (options?: {
  readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}) => Layer.Layer<RxRegistry>
```

Added in v1.0.0

# Tags

## RxRegistry (class)

**Signature**

```ts
export declare class RxRegistry
```

Added in v1.0.0

# constructors

## make

**Signature**

```ts
export declare const make: (
  options?:
    | {
        readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
        readonly scheduleTask?: ((f: () => void) => void) | undefined
        readonly timeoutResolution?: number | undefined
        readonly defaultIdleTTL?: number | undefined
      }
    | undefined
) => Registry
```

Added in v1.0.0

# models

## Registry (interface)

**Signature**

```ts
export interface Registry {
  readonly [TypeId]: TypeId
  readonly get: <A>(rx: Rx.Rx<A>) => A
  readonly mount: <A>(rx: Rx.Rx<A>) => () => void
  readonly refresh: <A>(rx: Rx.Rx<A> & Rx.Refreshable) => void
  readonly set: <R, W>(rx: Rx.Writable<R, W>, value: W) => void
  readonly modify: <R, W, A>(rx: Rx.Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]) => A
  readonly update: <R, W>(rx: Rx.Writable<R, W>, f: (_: R) => W) => void
  readonly subscribe: <A>(
    rx: Rx.Rx<A>,
    f: (_: A) => void,
    options?: {
      readonly immediate?: boolean
    }
  ) => () => void
  readonly reset: () => void
  readonly dispose: () => void
}
```

Added in v1.0.0

# type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof Registry.TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0
