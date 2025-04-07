---
title: Reactive.ts
nav_order: 2
parent: "@effect-rx/rx"
---

## Reactive overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Handle](#handle)
  - [Handle (interface)](#handle-interface)
- [Layer](#layer)
  - [layerTimeToLive](#layertimetolive)
- [Reactive](#reactive)
  - [Reactive (class)](#reactive-class)
    - [with (static method)](#with-static-method)
  - [cache](#cache)
  - [emit](#emit)
- [Readable](#readable)
  - [Readable (interface)](#readable-interface)
  - [readable](#readable-1)
- [Subscribable](#subscribable)
  - [Subscribable (interface)](#subscribable-interface)
  - [toSubscribable](#tosubscribable)
  - [toSubscribableWith](#tosubscribablewith)

---

# Handle

## Handle (interface)

**Signature**

```ts
export interface Handle {
  unsubscribe(reactive: Reactive["Type"]): void
}
```

Added in v1.0.0

# Layer

## layerTimeToLive

**Signature**

```ts
export declare const layerTimeToLive: {
  (duration: Duration.DurationInput): <A, E, R>(self: Layer.Layer<A, E, R>) => Layer.Layer<A, E, R>
  <A, E, R>(self: Layer.Layer<A, E, R>, duration: Duration.DurationInput): Layer.Layer<A, E, R>
}
```

Added in v1.0.0

# Reactive

## Reactive (class)

**Signature**

```ts
export declare class Reactive
```

Added in v1.0.0

### with (static method)

**Signature**

```ts
static with<A, E, R>(f: (reactive: Reactive["Type"]) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R | Reactive>
```

Added in v1.0.0

## cache

Cache an Effect for the lifetime of the current reactive context.

**Signature**

```ts
export declare const cache: (
  ...key: ReadonlyArray<unknown>
) => <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, Scope.Scope> | Reactive>
```

Added in v1.0.0

## emit

Immediately emits a value for the current reactive context.

**Signature**

```ts
export declare const emit: <A = unknown>(value: A) => Effect.Effect<void, never, Reactive>
```

Added in v1.0.0

# Readable

## Readable (interface)

**Signature**

```ts
export interface Readable<out A, out E, out R> {
  readonly effect: Effect.Effect<A, E, R | Reactive>
  readonly result: Effect.Effect<Result.Result<A, E>, never, R | Reactive>
  readonly success: Effect.Effect<Result.Success<A, never>, E, R | Reactive>
}
```

Added in v1.0.0

## readable

**Signature**

```ts
export declare const readable: <A, E, R>(
  effect: Effect.Effect<A, E, R>
) => Readable<A, E, Exclude<R, Reactive | Scope.Scope>>
```

Added in v1.0.0

# Subscribable

## Subscribable (interface)

**Signature**

```ts
export interface Subscribable<out A, out E> {
  subscribe(onResult: (result: Result.Result<A, E>) => void): () => void
}
```

Added in v1.0.0

## toSubscribable

**Signature**

```ts
export declare const toSubscribable: <R, ER>(
  layer: Layer.Layer<R, ER>,
  memoMap?: Layer.MemoMap | undefined
) => <A, E>(effect: Effect.Effect<A, E, Reactive | Scope.Scope | R>) => Subscribable<A, ER | E>
```

Added in v1.0.0

## toSubscribableWith

**Signature**

```ts
export declare const toSubscribableWith: <R, ER>(
  build: (scope: Scope.Scope, memoMap: Layer.MemoMap) => Effect.Effect<Context.Context<R>, ER>,
  memoMap?: Layer.MemoMap | undefined
) => <A, E>(effect: Effect.Effect<A, E, R | Reactive | Scope.Scope>) => Subscribable<A, E | ER>
```

Added in v1.0.0
