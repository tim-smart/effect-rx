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
  - [useRxSubscribe](#userxsubscribe)
  - [useRxSuspense](#userxsuspense)
  - [useRxValue](#userxvalue)

---

# hooks

## useRx

**Signature**

```ts
export declare const useRx: <R, W, const Mode extends "value" | "promise" | "promiseExit" = never>(
  rx: Rx.Writable<R, W>,
  options?: { readonly mode?: ([R] extends [Result.Result<any, any>] ? Mode : "value") | undefined }
) => readonly [
  value: R,
  write: "promise" extends Mode
    ? (
        value: W,
        options?: { readonly signal?: AbortSignal | undefined } | undefined
      ) => Promise<Result.Result.InferA<R>>
    : "promiseExit" extends Mode
      ? (
          value: W,
          options?: { readonly signal?: AbortSignal | undefined } | undefined
        ) => Promise<Exit.Exit<Result.Result.InferA<R>, Result.Result.InferE<R>>>
      : (value: W | ((value: R) => W)) => void
]
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
export declare const useRxSet: <R, W, Mode extends "value" | "promise" | "promiseExit" = never>(
  rx: Rx.Writable<R, W>,
  options?: { readonly mode?: ([R] extends [Result.Result<any, any>] ? Mode : "value") | undefined }
) => "promise" extends Mode
  ? (value: W, options?: { readonly signal?: AbortSignal | undefined } | undefined) => Promise<Result.Result.InferA<R>>
  : "promiseExit" extends Mode
    ? (
        value: W,
        options?: { readonly signal?: AbortSignal | undefined } | undefined
      ) => Promise<Exit.Exit<Result.Result.InferA<R>, Result.Result.InferE<R>>>
    : (value: W | ((value: R) => W)) => void
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
