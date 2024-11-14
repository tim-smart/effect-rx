---
title: RxRef.ts
nav_order: 5
parent: "@effect-rx/rx"
---

## RxRef overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [collection](#collection)
  - [make](#make)
- [models](#models)
  - [Collection (interface)](#collection-interface)
  - [ReadonlyRef (interface)](#readonlyref-interface)
  - [RxRef (interface)](#rxref-interface)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)

---

# constructors

## collection

**Signature**

```ts
export declare const collection: <A>(items: Iterable<A>) => Collection<A>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: <A>(value: A) => RxRef<A>
```

Added in v1.0.0

# models

## Collection (interface)

**Signature**

```ts
export interface Collection<A> extends ReadonlyRef<ReadonlyArray<RxRef<A>>> {
  readonly push: (item: A) => Collection<A>
  readonly insertAt: (index: number, item: A) => Collection<A>
  readonly remove: (ref: RxRef<A>) => Collection<A>
  readonly toArray: () => Array<A>
}
```

Added in v1.0.0

## ReadonlyRef (interface)

**Signature**

```ts
export interface ReadonlyRef<A> extends Equal.Equal {
  readonly [TypeId]: TypeId
  readonly key: string
  readonly value: A
  readonly subscribe: (f: (a: A) => void) => () => void
  readonly map: <B>(f: (a: A) => B) => ReadonlyRef<B>
}
```

Added in v1.0.0

## RxRef (interface)

**Signature**

```ts
export interface RxRef<A> extends ReadonlyRef<A> {
  readonly prop: <K extends keyof A>(prop: K) => RxRef<A[K]>
  readonly set: (value: A) => RxRef<A>
  readonly update: (f: (value: A) => A) => RxRef<A>
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
