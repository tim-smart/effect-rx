---
title: AtomRpc.ts
nav_order: 3
parent: "@effect-atom/atom"
---

## AtomRpc overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Constructors](#constructors)
  - [make](#make)
- [Models](#models)
  - [AtomRpcClient (interface)](#atomrpcclient-interface)

---

# Constructors

## make

**Signature**

```ts
export declare const make: <Rpcs extends Rpc.Any, ER>(
  group: RpcGroup.RpcGroup<Rpcs>,
  options: {
    readonly runtime: Atom.AtomRuntime<RpcClient.Protocol | Rpc.MiddlewareClient<Rpcs> | Rpc.Context<Rpcs>, ER>
    readonly spanPrefix?: string | undefined
    readonly spanAttributes?: Record<string, unknown> | undefined
    readonly generateRequestId?: (() => RequestId) | undefined
    readonly disableTracing?: boolean | undefined
  }
) => AtomRpcClient<Rpcs, ER>
```

Added in v1.0.0

# Models

## AtomRpcClient (interface)

**Signature**

```ts
export interface AtomRpcClient<Rpcs extends Rpc.Any, E> {
  readonly client: Atom.Atom<Result.Result<RpcClient.RpcClient.Flat<Rpcs, RpcClientError>, E>>

  readonly mutation: <Tag extends Rpc.Tag<Rpcs>>(
    arg: Tag
  ) => Rpc.ExtractTag<Rpcs, Tag> extends Rpc.Rpc<
    infer _Tag,
    infer _Payload,
    infer _Success,
    infer _Error,
    infer _Middleware
  >
    ? [_Success] extends [RpcSchema.Stream<infer _A, infer _E>]
      ? never
      : Atom.AtomResultFn<
          {
            readonly payload: Rpc.PayloadConstructor<Rpc.ExtractTag<Rpcs, Tag>>
            readonly reactivityKeys?: ReadonlyRecord<string, ReadonlyArray<unknown>> | undefined
            readonly headers?: Headers.Input | undefined
          },
          _Success["Type"],
          _Error["Type"] | E | _Middleware["failure"]["Type"]
        >
    : never

  readonly query: <Tag extends Rpc.Tag<Rpcs>>(
    tag: Tag,
    payload: Rpc.PayloadConstructor<Rpc.ExtractTag<Rpcs, Tag>>,
    options?: {
      readonly headers?: Headers.Input | undefined
      readonly reactivityKeys?: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>> | undefined
      readonly timeToLive?: Duration.DurationInput | undefined
    }
  ) => Rpc.ExtractTag<Rpcs, Tag> extends Rpc.Rpc<
    infer _Tag,
    infer _Payload,
    infer _Success,
    infer _Error,
    infer _Middleware
  >
    ? [_Success] extends [RpcSchema.Stream<infer _A, infer _E>]
      ? Atom.Writable<Atom.PullResult<_A, _E | _Error["Type"] | E | _Middleware["failure"]["Type"]>, void>
      : Atom.Atom<Result.Result<_Success["Type"], _Error["Type"] | E | _Middleware["failure"]["Type"]>>
    : never
}
```

Added in v1.0.0
