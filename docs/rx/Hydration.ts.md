---
title: Hydration.ts
nav_order: 1
parent: "@effect-rx/rx"
---

## Hydration overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [dehydration](#dehydration)
  - [dehydrate](#dehydrate)
- [hydration](#hydration)
  - [hydrate](#hydrate)
- [models](#models)
  - [DehydratedRx (interface)](#dehydratedrx-interface)

---

# dehydration

## dehydrate

**Signature**

```ts
export declare const dehydrate: (
  registry: Registry.Registry,
  options?: { readonly encodeInitialAs?: "ignore" | "promise" | "value-only" | undefined }
) => Array<DehydratedRx>
```

Added in v1.0.0

# hydration

## hydrate

**Signature**

```ts
export declare const hydrate: (registry: Registry.Registry, dehydratedState: Iterable<DehydratedRx>) => void
```

Added in v1.0.0

# models

## DehydratedRx (interface)

**Signature**

```ts
export interface DehydratedRx {
  readonly key: string
  readonly value: unknown
  readonly dehydratedAt: number
  readonly resultPromise?: Promise<unknown> | undefined
}
```

Added in v1.0.0
