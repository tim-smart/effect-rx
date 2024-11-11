---
title: Registry.ts
nav_order: 3
parent: "@effect-rx/rx"
---

## Registry overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
- [models](#models)
  - [Registry (interface)](#registry-interface)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

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
  readonly get: Rx.Rx.Get
  readonly mount: Rx.Rx.Mount
  readonly refresh: Rx.Rx.RefreshRxSync
  readonly set: Rx.Rx.Set
  readonly subscribe: Rx.Rx.Subscribe
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
