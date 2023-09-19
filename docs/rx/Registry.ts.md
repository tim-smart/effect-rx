---
title: Registry.ts
nav_order: 1
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
export declare const make: () => Registry
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
  readonly refresh: Rx.Rx.Refresh
  readonly set: Rx.Rx.Set
  readonly subscribe: Rx.Rx.Subscribe
  readonly subscribeWithPrevious: Rx.Rx.SubscribeWithPrevious
  readonly queue: Rx.Rx.Queue
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
