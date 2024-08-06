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
  - [useRxInitialValues](#userxinitialvalues)
  - [useRxMount](#userxmount)
  - [useRxRef](#userxref)
  - [useRxRefProp](#userxrefprop)
  - [useRxRefPropValue](#userxrefpropvalue)
  - [useRxRefresh](#userxrefresh)
  - [useRxSet](#userxset)
  - [useRxSetPromise](#userxsetpromise)
  - [useRxSubscribe](#userxsubscribe)
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

## useRxInitialValues

**Signature**

```ts
export declare const useRxInitialValues: (initialValues: Iterable<readonly [Rx.Rx<any>, any]>) => void
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

## useRxRefProp

**Signature**

```ts
export declare const useRxRefProp: <A, K extends keyof A>(ref: RxRef.RxRef<A>, prop: K) => RxRef.RxRef<A[K]>
```

Added in v1.0.0

## useRxRefPropValue

**Signature**

```ts
export declare const useRxRefPropValue: <A, K extends keyof A>(ref: RxRef.RxRef<A>, prop: K) => A[K]
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

## useRxSetPromise

**Signature**

```ts
export declare const useRxSetPromise: <E, A, W>(
  rx: Rx.Writable<Result.Result<A, E>, W>
) => (_: W) => Promise<Exit.Exit<A, E>>
```

Added in v1.0.0

## useRxSubscribe

**Signature**

```ts
export declare const useRxSubscribe: <A>(
  rx: Rx.Rx<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
) => void
```

Added in v1.0.0

## useRxSuspense

**Signature**

```ts
export declare const useRxSuspense: <A, E>(
  rx: Rx.Rx<Result.Result<A, E>>,
  options?: { readonly suspendOnWaiting?: boolean }
) => Result.Success<A, E> | Result.Failure<A, E>
```

Added in v1.0.0

## useRxSuspenseSuccess

**Signature**

```ts
export declare const useRxSuspenseSuccess: <A, E>(
  rx: Rx.Rx<Result.Result<A, E>>,
  options?: { readonly suspendOnWaiting?: boolean }
) => Result.Success<A, E>
```

Added in v1.0.0

## useRxValue

**Signature**

```ts
export declare const useRxValue: { <A>(rx: Rx.Rx<A>): A; <A, B>(rx: Rx.Rx<A>, f: (_: A) => B): B }
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
