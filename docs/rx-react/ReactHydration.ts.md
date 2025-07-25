---
title: ReactHydration.ts
nav_order: 3
parent: "@effect-rx/rx-react"
---

## ReactHydration overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [components](#components)
  - [HydrationBoundary](#hydrationboundary)
  - [HydrationBoundaryProps (interface)](#hydrationboundaryprops-interface)

---

# components

## HydrationBoundary

**Signature**

```ts
export declare const HydrationBoundary: React.FC<HydrationBoundaryProps>
```

Added in v1.0.0

## HydrationBoundaryProps (interface)

**Signature**

```ts
export interface HydrationBoundaryProps {
  state?: Iterable<Hydration.DehydratedRx>
  children?: React.ReactNode
}
```

Added in v1.0.0
