/**
 * @since 1.0.0
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as Atom from "@effect-atom/atom/Atom"
import * as Result from "@effect-atom/atom/Result"
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
   * The Layer that builds the Store
   */
  readonly layer: Layer.Layer<StoreService>
  /**
   * A Atom.runtime that contains the Store.
   */
  readonly runtimeAtom: Atom.AtomRuntime<StoreService, never>
  /**
   * A Atom that allows you to access the Store. It will emit a `Result` that
   * contains the Store or an error if it could not be created.
   */
  readonly storeAtom: Atom.Atom<Result.Result<Store<S, Context>>>
  /**
   * A Atom that allows you to access the Store. It will emit the Store or
   * `undefined` if has not been created yet.
   */
  readonly storeAtomUnsafe: Atom.Atom<Store<S, Context> | undefined>
  /**
   * Creates a Atom that allows you to resolve a LiveQueryDef. It embeds the loading
   * of the Store and will emit a `Result` that contains the result of the query
   */
  readonly makeQueryAtom: <A>(query: LiveQueryDef<A>) => Atom.Atom<Result.Result<A>>
  /**
   * Creates a Atom that allows you to resolve a LiveQueryDef. If the Store has
   * not been created yet, it will return `undefined`.
   */
  readonly makeQueryAtomUnsafe: <A>(query: LiveQueryDef<A>) => Atom.Atom<A | undefined>
  /**
   * A Atom.Writable that allows you to commit an event to the Store.
   */
  readonly commitAtom: Atom.Writable<void, {}>
} => {
  const StoreService = Context.GenericTag<StoreService, Store<S, Context>>("@effect-atom/atom-livestore/StoreService")
  const layer = Layer.scoped(
    StoreService,
    createStore(options).pipe(
      provideOtel({
        parentSpanContext: options?.otelOptions?.rootSpanContext,
        otelTracer: options?.otelOptions?.tracer
      }),
      Effect.orDie
    )
  )
  const runtimeAtom = Atom.runtime(layer)
  const storeAtom = runtimeAtom.atom(StoreService)
  const storeAtomUnsafe = Atom.readable((get) => {
    const result = get(storeAtom)
    return Result.getOrElse(result, constUndefined)
  })
  const makeQueryAtom = <A>(query: LiveQueryDef<A>) =>
    Atom.readable((get) => {
      const store = get(storeAtom)
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
  const makeQueryAtomUnsafe = <A>(query: LiveQueryDef<A>) =>
    Atom.readable((get) => {
      const store = get(storeAtomUnsafe)
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
  const commitAtom = Atom.writable((get) => {
    get(storeAtomUnsafe)
  }, (ctx, value: {}) => {
    ctx.get(storeAtomUnsafe)?.commit(value)
  })
  return {
    StoreService,
    layer,
    runtimeAtom,
    storeAtom,
    storeAtomUnsafe,
    makeQueryAtom,
    makeQueryAtomUnsafe,
    commitAtom
  } as const
}
