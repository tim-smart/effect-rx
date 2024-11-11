---
title: Reactivity.ts
nav_order: 2
parent: "@effect-rx/rx"
---

## Reactivity overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
- [model](#model)
  - [Reactivity (namespace)](#reactivity-namespace)
    - [Service (interface)](#service-interface)
- [tags](#tags)
  - [Reactivity (class)](#reactivity-class)

---

# constructors

## make

**Signature**

```ts
export declare const make: Effect.Effect<Reactivity.Service, never, never>
```

Added in v1.0.0

# model

## Reactivity (namespace)

Added in v1.0.0

### Service (interface)

**Signature**

```ts
export interface Service {
  readonly unsafeInvalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, Array<unknown>>) => void
  readonly invalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, Array<unknown>>) => Effect.Effect<void>
  readonly mutation: <A, E, R>(
    keys: ReadonlyArray<unknown> | ReadonlyRecord<string, Array<unknown>>,
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E, R>
  readonly query: <A, E, R>(
    keys: ReadonlyArray<unknown> | ReadonlyRecord<string, Array<unknown>>,
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<Mailbox.ReadonlyMailbox<A, E>, never, R | Scope.Scope>
  readonly stream: <A, E, R>(
    keys: ReadonlyArray<unknown> | ReadonlyRecord<string, Array<unknown>>,
    effect: Effect.Effect<A, E, R>
  ) => Stream.Stream<A, E, Exclude<R, Scope.Scope>>
}
```

Added in v1.0.0

# tags

## Reactivity (class)

**Signature**

```ts
export declare class Reactivity
```

Added in v1.0.0
