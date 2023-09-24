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
  - [useMountRx](#usemountrx)
  - [useRefreshRx](#userefreshrx)
  - [useRx](#userx)
  - [useRxRef](#userxref)
  - [useRxSuspense](#userxsuspense)
  - [useRxSuspenseSuccess](#userxsuspensesuccess)
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

## useMountRx

**Signature**

```ts
export declare const useMountRx: <A>(rx: Rx.Rx<A>) => void
```

Added in v1.0.0

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
  rx: Rx.Writable<R, W>
) => readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void]
```

Added in v1.0.0

## useRxRef

**Signature**

```ts
export declare const useRxRef: <A>(ref: RxRef.ReadonlyRef<A>) => A
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

## useSetRx

**Signature**

```ts
export declare const useSetRx: <R, W>(rx: Rx.Writable<R, W>) => (_: W | ((_: R) => W)) => void
```

Added in v1.0.0
