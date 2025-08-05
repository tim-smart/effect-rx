---
title: Hooks.ts
nav_order: 1
parent: "@effect-rx/rx-react"
---

## Hooks overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

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
  - [useRxValue](#userxvalue)

---

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
export declare const useRxRefresh: <A>(rx: Rx.Rx<A>) => () => void
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
) => (_: W, options?: { readonly signal?: AbortSignal | undefined } | undefined) => Promise<Exit.Exit<A, E>>
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
export declare const useRxSuspense: <A, E, const IncludeFailure extends boolean = false>(
  rx: Rx.Rx<Result.Result<A, E>>,
  options?: { readonly suspendOnWaiting?: boolean | undefined; readonly includeFailure?: IncludeFailure | undefined }
) => Result.Success<A, E> | (IncludeFailure extends true ? Result.Failure<A, E> : never)
```

Added in v1.0.0

## useRxValue

**Signature**

```ts
export declare const useRxValue: { <A>(rx: Rx.Rx<A>): A; <A, B>(rx: Rx.Rx<A>, f: (_: A) => B): B }
```

Added in v1.0.0
