---
title: index.ts
nav_order: 1
parent: "@effect-rx/rx-vue"
---

## index overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [composables](#composables)
  - [useRx](#userx)
  - [useRxRef](#userxref)
  - [useRxSet](#userxset)
  - [useRxValue](#userxvalue)
- [modules](#modules)
  - [From "@effect-rx/rx/Registry"](#from-effect-rxrxregistry)
  - [From "@effect-rx/rx/Result"](#from-effect-rxrxresult)
  - [From "@effect-rx/rx/Rx"](#from-effect-rxrxrx)
  - [From "@effect-rx/rx/RxRef"](#from-effect-rxrxrxref)
- [registry](#registry)
  - [defaultRegistry](#defaultregistry)
  - [injectRegistry](#injectregistry)
  - [registryKey](#registrykey)

---

# composables

## useRx

**Signature**

```ts
export declare const useRx: <R, W>(rx: Rx.Writable<R, W>) => readonly [Readonly<Ref<R>>, (_: W) => void]
```

Added in v1.0.0

## useRxRef

**Signature**

```ts
export declare const useRxRef: <A>(rxRef: RxRef.ReadonlyRef<A>) => Readonly<Ref<A>>
```

Added in v1.0.0

## useRxSet

**Signature**

```ts
export declare const useRxSet: <R, W>(rx: Rx.Writable<R, W>) => (_: W) => void
```

Added in v1.0.0

## useRxValue

**Signature**

```ts
export declare const useRxValue: <A>(rx: Rx.Rx<A>) => Readonly<Ref<A>>
```

Added in v1.0.0

# modules

## From "@effect-rx/rx/Registry"

Re-exports all named exports from the "@effect-rx/rx/Registry" module as `Registry`.

**Signature**

```ts
export * as Registry from "@effect-rx/rx/Registry"
```

Added in v1.0.0

## From "@effect-rx/rx/Result"

Re-exports all named exports from the "@effect-rx/rx/Result" module as `Result`.

**Signature**

```ts
export * as Result from "@effect-rx/rx/Result"
```

Added in v1.0.0

## From "@effect-rx/rx/Rx"

Re-exports all named exports from the "@effect-rx/rx/Rx" module as `Rx`.

**Signature**

```ts
export * as Rx from "@effect-rx/rx/Rx"
```

Added in v1.0.0

## From "@effect-rx/rx/RxRef"

Re-exports all named exports from the "@effect-rx/rx/RxRef" module as `RxRef`.

**Signature**

```ts
export * as RxRef from "@effect-rx/rx/RxRef"
```

Added in v1.0.0

# registry

## defaultRegistry

**Signature**

```ts
export declare const defaultRegistry: Registry.Registry
```

Added in v1.0.0

## injectRegistry

**Signature**

```ts
export declare const injectRegistry: () => Registry.Registry
```

Added in v1.0.0

## registryKey

**Signature**

```ts
export declare const registryKey: InjectionKey<Registry.Registry>
```

Added in v1.0.0
