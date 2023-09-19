---
title: index.ts
nav_order: 1
parent: "@effect-rx/rx-react"
---

## index overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [context](#context)
  - [RegistryContext](#registrycontext)
- [hooks](#hooks)
  - [useRx](#userx)
  - [useRxUpdate](#userxupdate)
  - [useRxValue](#userxvalue)
  - [useSetRx](#usesetrx)
  - [useUpdateRx](#useupdaterx)

---

# context

## RegistryContext

**Signature**

```ts
export declare const RegistryContext: React.Context<Registry.Registry>
```

Added in v1.0.0

# hooks

## useRx

**Signature**

```ts
export declare const useRx: <R, W>(rx: Rx.Writeable<R, W>) => readonly [R, (_: W) => void]
```

Added in v1.0.0

## useRxUpdate

**Signature**

```ts
export declare const useRxUpdate: <R, W>(rx: Rx.Writeable<R, W>) => readonly [R, (f: (_: R) => W) => void]
```

Added in v1.0.0

## useRxValue

**Signature**

```ts
export declare const useRxValue: <A>(rx: Rx.Rx<A>) => A
```

Added in v1.0.0

## useSetRx

**Signature**

```ts
export declare const useSetRx: <R, W>(rx: Rx.Writeable<R, W>) => (_: W) => void
```

Added in v1.0.0

## useUpdateRx

**Signature**

```ts
export declare const useUpdateRx: <R, W>(rx: Rx.Writeable<R, W>) => (f: (_: R) => W) => void
```

Added in v1.0.0
