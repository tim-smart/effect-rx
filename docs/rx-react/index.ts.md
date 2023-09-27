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
  - [useRxMount](#userxmount)
  - [useRxRef](#userxref)
  - [useRxRefresh](#userxrefresh)
  - [useRxSet](#userxset)
  - [useRxSubcribe](#userxsubcribe)
  - [useRxSuspense](#userxsuspense)
  - [useRxSuspenseSuccess](#userxsuspensesuccess)
  - [useRxValue](#userxvalue)
- [modules](#modules)
  - [From "@effect-rx/rx/Registry"](#from-effect-rxrxregistry)
  - [From "@effect-rx/rx/Result"](#from-effect-rxrxresult)
  - [From "@effect-rx/rx/Rx"](#from-effect-rxrxrx)
  - [From "@effect-rx/rx/RxRef"](#from-effect-rxrxrxref)

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
export declare const useRx: <R, W>(
  rx: Rx.Writable<R, W>
) => readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void]
```

Added in v1.0.0

## useRxMount

**Signature**

```ts
export declare const useRxMount: <A>(rx: Rx.Rx<A>) => void
```

Added in v1.0.0

## useRxRef

**Signature**

```ts
export declare const useRxRef: <A>(ref: RxRef.ReadonlyRef<A>) => A
```

Added in v1.0.0

## useRxRefresh

**Signature**

```ts
export declare const useRxRefresh: <A>(rx: Rx.Rx<A> & Rx.Refreshable) => () => void
```

Added in v1.0.0

## useRxSet

**Signature**

```ts
export declare const useRxSet: <R, W>(rx: Rx.Writable<R, W>) => (_: W | ((_: R) => W)) => void
```

Added in v1.0.0

## useRxSubcribe

**Signature**

```ts
export declare const useRxSubcribe: <A>(
  rx: Rx.Rx<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
) => void
```

Added in v1.0.0

## useRxSuspense

**Signature**

```ts
export declare const useRxSuspense: <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
) => { readonly isWaiting: boolean; readonly value: Result.Success<E, A> | Result.Failure<E, A> }
```

Added in v1.0.0

## useRxSuspenseSuccess

**Signature**

```ts
export declare const useRxSuspenseSuccess: <E, A>(
  rx: Rx.Rx<Result.Result<E, A>>,
  options?: { readonly suspendOnWaiting?: boolean }
) => { readonly isWaiting: boolean; readonly value: A }
```

Added in v1.0.0

## useRxValue

**Signature**

```ts
export declare const useRxValue: <A>(rx: Rx.Rx<A>) => A
```

Added in v1.0.0

# modules

## From "@effect-rx/rx/Registry"

Re-exports all named exports from the "@effect-rx/rx/Registry" module.

**Signature**

```ts
export * from '@effect-rx/rx/Registry'
```

Added in v1.0.0

## From "@effect-rx/rx/Result"

Re-exports all named exports from the "@effect-rx/rx/Result" module.

**Signature**

```ts
export * from '@effect-rx/rx/Result'
```

Added in v1.0.0

## From "@effect-rx/rx/Rx"

Re-exports all named exports from the "@effect-rx/rx/Rx" module.

**Signature**

```ts
export * from '@effect-rx/rx/Rx'
```

Added in v1.0.0

## From "@effect-rx/rx/RxRef"

Re-exports all named exports from the "@effect-rx/rx/RxRef" module.

**Signature**

```ts
export * from '@effect-rx/rx/RxRef'
```

Added in v1.0.0
