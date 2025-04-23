---
title: Registry.ts
nav_order: 2
parent: "@effect-rx/rx"
---

## Registry overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

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
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0
