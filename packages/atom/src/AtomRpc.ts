/**
 * @since 1.0.0
 */
import * as Reactivity from "@effect/experimental/Reactivity"
import * as Headers from "@effect/platform/Headers"
import type * as Rpc from "@effect/rpc/Rpc"
import * as RpcClient from "@effect/rpc/RpcClient"
import type { RpcClientError } from "@effect/rpc/RpcClientError"
import type * as RpcGroup from "@effect/rpc/RpcGroup"
import type { RequestId } from "@effect/rpc/RpcMessage"
import * as RpcSchema from "@effect/rpc/RpcSchema"
import * as Data from "effect/Data"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { pipe } from "effect/Function"
import * as Hash from "effect/Hash"
import type { ReadonlyRecord } from "effect/Record"
import * as Stream from "effect/Stream"
import * as Atom from "./Atom.js"
import type * as Result from "./Result.js"

/**
 * @since 1.0.0
 * @category Models
 */
export interface AtomRpcClient<Rpcs extends Rpc.Any, E> {
  readonly client: Atom.Atom<
    Result.Result<RpcClient.RpcClient.Flat<Rpcs, RpcClientError>, E>
  >

  readonly mutation: <Tag extends Rpc.Tag<Rpcs>>(
    arg: Tag
  ) => Rpc.ExtractTag<Rpcs, Tag> extends Rpc.Rpc<
    infer _Tag,
    infer _Payload,
    infer _Success,
    infer _Error,
    infer _Middleware
  > ? [_Success] extends [RpcSchema.Stream<infer _A, infer _E>] ? never
    : Atom.AtomResultFn<
      {
        readonly payload: Rpc.PayloadConstructor<Rpc.ExtractTag<Rpcs, Tag>>
        readonly reactivityKeys?:
          | ReadonlyRecord<string, ReadonlyArray<unknown>>
          | undefined
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
      readonly reactivityKeys?:
        | ReadonlyArray<unknown>
        | ReadonlyRecord<string, ReadonlyArray<unknown>>
        | undefined
      readonly timeToLive?: Duration.DurationInput | undefined
    }
  ) => Rpc.ExtractTag<Rpcs, Tag> extends Rpc.Rpc<
    infer _Tag,
    infer _Payload,
    infer _Success,
    infer _Error,
    infer _Middleware
  > ? [_Success] extends [RpcSchema.Stream<infer _A, infer _E>] ? Atom.Writable<
        Atom.PullResult<
          _A,
          _E | _Error["Type"] | E | _Middleware["failure"]["Type"]
        >,
        void
      >
    : Atom.Atom<
      Result.Result<
        _Success["Type"],
        _Error["Type"] | E | _Middleware["failure"]["Type"]
      >
    >
    : never
}

/**
 * @since 1.0.0
 * @category Constructors
 */
export const make = <Rpcs extends Rpc.Any, ER>(
  group: RpcGroup.RpcGroup<Rpcs>,
  options: {
    readonly runtime: Atom.AtomRuntime<
      RpcClient.Protocol | Rpc.MiddlewareClient<Rpcs> | Rpc.Context<Rpcs>,
      ER
    >
    readonly spanPrefix?: string | undefined
    readonly spanAttributes?: Record<string, unknown> | undefined
    readonly generateRequestId?: (() => RequestId) | undefined
    readonly disableTracing?: boolean | undefined
  }
): AtomRpcClient<Rpcs, ER> => {
  const client = options.runtime.atom(
    RpcClient.make(group, {
      ...options,
      flatten: true
    })
  )

  const mutation = Atom.family(<Tag extends Rpc.Tag<Rpcs>>(tag: Tag) =>
    options.runtime.fn<{
      readonly payload: Rpc.PayloadConstructor<Rpc.ExtractTag<Rpcs, Tag>>
      readonly reactivityKeys?:
        | ReadonlyArray<unknown>
        | ReadonlyRecord<string, ReadonlyArray<unknown>>
        | undefined
      readonly headers?: Headers.Input | undefined
    }>()(
      Effect.fnUntraced(function*({ headers, payload, reactivityKeys }, get) {
        const c = yield* get.result(client)
        const effect = c(tag, payload, { headers } as any)
        return yield* reactivityKeys
          ? Reactivity.mutation(effect, reactivityKeys)
          : effect
      })
    )
  )

  const queryFamily = Atom.family(({ headers, payload, reactivityKeys, tag, timeToLive }: QueryKey) => {
    const rpc = group.requests.get(tag)! as any as Rpc.AnyWithProps
    let atom = RpcSchema.isStreamSchema(rpc.successSchema)
      ? Atom.pull((get) =>
        get.result(client).pipe(
          Effect.map((client) => client(tag, payload, { headers } as any)),
          Stream.unwrap
        )
      )
      : Atom.make((get) =>
        get
          .result(client)
          .pipe(
            Effect.flatMap((client) => client(tag, payload, { headers } as any))
          )
      )
    if (timeToLive) {
      atom = Duration.isFinite(timeToLive) ? Atom.setIdleTTL(atom, timeToLive) : Atom.keepAlive(atom)
    }
    return reactivityKeys ? options.runtime.factory.withReactivity(reactivityKeys)(atom) : atom
  })

  const query = <Tag extends Rpc.Tag<Rpcs>>(
    tag: Tag,
    payload: Rpc.PayloadConstructor<Rpc.ExtractTag<Rpcs, Tag>>,
    options?: {
      readonly headers?: Headers.Input | undefined
      readonly reactivityKeys?: ReadonlyArray<unknown> | undefined
      readonly timeToLive?: Duration.DurationInput | undefined
    }
  ) =>
    queryFamily(
      new QueryKey({
        tag,
        payload: Data.struct(payload),
        headers: options?.headers
          ? Data.unsafeStruct(Headers.fromInput(options.headers))
          : undefined,
        reactivityKeys: options?.reactivityKeys
          ? Data.array(options.reactivityKeys)
          : undefined,
        timeToLive: options?.timeToLive ? Duration.decode(options.timeToLive) : undefined
      })
    )

  return {
    client,
    mutation,
    query
  } as any
}

class QueryKey extends Data.Class<{
  tag: string
  payload: any
  headers?: Headers.Headers | undefined
  reactivityKeys?: ReadonlyArray<unknown> | undefined
  timeToLive?: Duration.Duration | undefined
}> {
  [Equal.symbol](that: QueryKey) {
    return (
      this.tag === that.tag &&
      Equal.equals(this.payload, that.payload) &&
      Equal.equals(this.headers, that.headers) &&
      Equal.equals(this.reactivityKeys, that.reactivityKeys) &&
      Equal.equals(this.timeToLive, that.timeToLive)
    )
  }
  [Hash.symbol]() {
    return pipe(
      Hash.string(this.tag),
      Hash.combine(Hash.hash(this.payload)),
      Hash.combine(Hash.hash(this.headers)),
      Hash.combine(Hash.hash(this.reactivityKeys)),
      Hash.combine(Hash.hash(this.timeToLive)),
      Hash.cached(this)
    )
  }
}
