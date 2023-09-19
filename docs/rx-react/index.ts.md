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
  - [useRefreshRx](#userefreshrx)
  - [useRx](#userx)
  - [useRxValue](#userxvalue)
  - [useSetRx](#usesetrx)

---

# context

## RegistryContext

**Signature**

```ts
export declare const RegistryContext: React.Context<Registry.Registry>
```

Added in v1.0.0

# hooks

## useRefreshRx

**Signature**

```ts
export declare const useRefreshRx: <A>(rx: Rx.Rx<A> & Rx.Refreshable) => () => void
```

Added in v1.0.0

## useRx

**Signature**

```ts
export declare const useRx: <R, W>(
  rx: Rx.Writeable<R, W>
) => readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void]
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
export declare const useSetRx: <R, W>(rx: Rx.Writeable<R, W>) => (_: W | ((_: R) => W)) => void
```

Added in v1.0.0
