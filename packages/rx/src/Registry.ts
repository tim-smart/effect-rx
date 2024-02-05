/**
 * @since 1.0.0
 */
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
  readonly get: Rx.Rx.Get
  readonly mount: Rx.Rx.Mount
  readonly refresh: Rx.Rx.RefreshRxSync
  readonly set: Rx.Rx.Set
  readonly subscribe: Rx.Rx.Subscribe
  readonly reset: () => void
  readonly dispose: () => void
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const make: (
  options?: { readonly initialValues: Iterable<readonly [Rx.Rx<any>, any]> } | undefined
) => Registry = internal.make
