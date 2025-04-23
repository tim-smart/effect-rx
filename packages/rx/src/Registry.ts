/**
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as internal from "./internal/registry.js"
import type * as Rx from "./Rx.js"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Registry {
  readonly [TypeId]: TypeId
  readonly get: <A>(rx: Rx.Rx<A>) => A
  readonly mount: <A>(rx: Rx.Rx<A>) => () => void
  readonly refresh: <A>(rx: Rx.Rx<A> & Rx.Refreshable) => void
  readonly set: <R, W>(rx: Rx.Writable<R, W>, value: W) => void
  readonly subscribe: <A>(rx: Rx.Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void
  readonly reset: () => void
  readonly dispose: () => void
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const make: (
  options?: {
    readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
    readonly scheduleTask?: ((f: () => void) => void) | undefined
    readonly timeoutResolution?: number | undefined
    readonly defaultIdleTTL?: number | undefined
  } | undefined
) => Registry = internal.make

/**
 * @since 1.0.0
 * @category Tags
 */
export class RxRegistry extends Context.Tag("@effect/rx/Registry/CurrentRegistry")<
  RxRegistry,
  Registry
>() {
}
