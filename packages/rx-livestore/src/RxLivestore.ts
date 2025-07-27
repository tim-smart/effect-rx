/**
 * @since 1.0.0
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import type { CreateStoreOptions, LiveQueryDef, LiveStoreSchema, OtelOptions, Store } from "@livestore/livestore"
import { createStore, provideOtel } from "@livestore/livestore"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { constUndefined } from "effect/Function"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"

/**
 * @since 1.0.0
 * @category Store
 */
export interface StoreService {
  readonly _: unique symbol
}

/**
 * @since 1.0.0
 * @category Constructors
 */
export const make = <S extends LiveStoreSchema, Context = {}>(
  options: CreateStoreOptions<S, Context> & {
    readonly otelOptions?: Partial<OtelOptions> | undefined
  }
): {
  readonly runtimeRx: Rx.RxRuntime<StoreService, never>
  readonly storeRx: Rx.Rx<Result.Result<Store<S, Context>>>
  readonly storeRxUnsafe: Rx.Rx<Store<S, Context>>
  readonly makeQueryRx: <A>(query: LiveQueryDef<A>) => Rx.Rx<Result.Result<A>>
  readonly makeQueryRxUnsafe: <A>(query: LiveQueryDef<A>) => Rx.Rx<A>
  readonly commitRx: Rx.Writable<Option<void>, {}>
} => {
  const StoreService = Context.GenericTag<StoreService, Store<S, Context>>("@effect-rx/rx-livestore/StoreService")
  const runtimeRx = Rx.runtime(Layer.scoped(
    StoreService,
    createStore(options).pipe(
      provideOtel({
        parentSpanContext: options?.otelOptions?.rootSpanContext,
        otelTracer: options?.otelOptions?.tracer
      }),
      Effect.orDie
    )
  ))
  const storeRx = runtimeRx.rx(StoreService)
  const storeRxUnsafe = Rx.readable((get) => {
    const result = get(storeRx)
    return Result.getOrElse(result, constUndefined) as Store<S, Context>
  })
  const makeQueryRx = <A>(query: LiveQueryDef<A>) =>
    Rx.readable((get) => {
      const store = get(storeRx)
      return Result.map(store, (store) => {
        const result = store.query(query)
        get.addFinalizer(
          store.subscribe(query, {
            onUpdate(value) {
              get.setSelf(Result.success(value))
            }
          })
        )
        return result
      })
    })
  const makeQueryRxUnsafe = <A>(query: LiveQueryDef<A>) =>
    Rx.readable((get) => {
      const store = get(storeRxUnsafe)
      get.addFinalizer(
        store.subscribe(query, {
          onUpdate(value) {
            get.setSelf(Result.success(value))
          }
        })
      )
      return store.query(query)
    })
  const commitRx = Rx.fnSync((event: {}, get) => {
    get(storeRxUnsafe)?.commit(event)
  })
  return {
    runtimeRx,
    storeRx,
    storeRxUnsafe,
    makeQueryRx,
    makeQueryRxUnsafe,
    commitRx
  } as const
}
