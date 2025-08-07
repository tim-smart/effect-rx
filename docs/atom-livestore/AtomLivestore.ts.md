---
title: AtomLivestore.ts
nav_order: 1
parent: "@effect-atom/atom-livestore"
---

## AtomLivestore overview

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
  readonly StoreService: Context.Tag<StoreService, Store<S, Context>>
  readonly layer: Layer.Layer<StoreService>
  readonly runtimeAtom: Atom.AtomRuntime<StoreService, never>
  readonly storeAtom: Atom.Atom<Result.Result<Store<S, Context>>>
  readonly storeAtomUnsafe: Atom.Atom<Store<S, Context> | undefined>
  readonly makeQueryAtom: <A>(query: LiveQueryDef<A>) => Atom.Atom<Result.Result<A>>
  readonly makeQueryAtomUnsafe: <A>(query: LiveQueryDef<A>) => Atom.Atom<A | undefined>
  readonly commitAtom: Atom.Writable<void, {}>
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
