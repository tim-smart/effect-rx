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
  /**
   * A context tag for the Store.
   */
  readonly StoreService: Context.Tag<StoreService, Store<S, Context>>
  /**
   * A Rx.runtime that contains the Store.
   */
  readonly runtimeRx: Rx.RxRuntime<StoreService, never>
  /**
   * A Rx that allows you to access the Store. It will emit a `Result` that
   * contains the Store or an error if it could not be created.
   */
  readonly storeRx: Rx.Rx<Result.Result<Store<S, Context>>>
  /**
   * A Rx that allows you to access the Store. It will emit the Store or
   * `undefined` if has not been created yet.
   */
  readonly storeRxUnsafe: Rx.Rx<Store<S, Context> | undefined>
  /**
   * Creates a Rx that allows you to resolve a LiveQueryDef. It embeds the loading
   * of the Store and will emit a `Result` that contains the result of the query
   */
  readonly makeQueryRx: <A>(query: LiveQueryDef<A>) => Rx.Rx<Result.Result<A>>
  /**
   * Creates a Rx that allows you to resolve a LiveQueryDef. If the Store has
   * not been created yet, it will return `undefined`.
   */
  readonly makeQueryRxUnsafe: <A>(query: LiveQueryDef<A>) => Rx.Rx<A | undefined>
  /**
   * A Rx.Writable that allows you to commit an event to the Store.
   */
  readonly commitRx: Rx.Writable<void, {}>
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
    return Result.getOrElse(result, constUndefined)
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
      if (store === undefined) {
        return undefined
      }
      get.addFinalizer(
        store.subscribe(query, {
          onUpdate(value) {
            get.setSelf(Result.success(value))
          }
        })
      )
      return store.query(query)
    })
  const commitRx = Rx.writable((get) => {
    get(storeRxUnsafe)
  }, (ctx, value: {}) => {
    ctx.get(storeRxUnsafe)?.commit(value)
  })
  return {
    StoreService,
    runtimeRx,
    storeRx,
    storeRxUnsafe,
    makeQueryRx,
    makeQueryRxUnsafe,
    commitRx
  } as const
}
