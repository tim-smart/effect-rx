---
title: RxLivestore.ts
nav_order: 2
parent: "@effect-rx/rx-livestore"
---

## RxLivestore overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Constructors](#constructors)
  - [make](#make)
- [Store](#store)
  - [StoreService (interface)](#storeservice-interface)

---

# Constructors

## make

**Signature**

```ts
export declare const make: <S extends LiveStoreSchema, Context = {}>(
  options: CreateStoreOptions<S, Context> & { readonly otelOptions?: Partial<OtelOptions> | undefined }
) => {
  readonly runtimeRx: Rx.RxRuntime<StoreService, never>
  readonly storeRx: Rx.Rx<Result.Result<Store<S, Context>>>
  readonly storeRxUnsafe: Rx.Rx<Store<S, Context>>
  readonly makeQueryRx: <A>(query: LiveQueryDef<A>) => Rx.Rx<Result.Result<A>>
  readonly makeQueryRxUnsafe: <A>(query: LiveQueryDef<A>) => Rx.Rx<A>
  readonly commitRx: Rx.Writable<Option<void>, {}>
}
```

Added in v1.0.0

# Store

## StoreService (interface)

**Signature**

```ts
export interface StoreService {
  readonly _: unique symbol
}
```

Added in v1.0.0
