/**
 * @since 1.0.0
 */
import type * as Registry from "./Registry.js"
import type * as Result from "./Result.js"
import * as Rx from "./Rx.js"

/**
 * @since 1.0.0
 * @category models
 */
export interface DehydratedRx<A = unknown, E = unknown> {
  readonly rxKey: string
  readonly state: Result.Result<A, E>
  readonly dehydratedAt: number
}

/**
 * @since 1.0.0
 * @category models
 */
export interface DehydratedState {
  readonly rxs: ReadonlyArray<DehydratedRx>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface DehydrateOptions {
  readonly shouldDehydrateRx?: (rx: Rx.Rx<any>) => boolean
}

/**
 * @since 1.0.0
 * @category models
 */
export interface HydrateOptions {
  readonly shouldHydrateRx?: (rx: Rx.Rx<any>, dehydratedRx: DehydratedRx) => boolean
}

/**
 * @since 1.0.0
 * @category dehydration
 */
export const dehydrate = (
  registry: Registry.Registry,
  options?: DehydrateOptions
): DehydratedState => {
  return (registry as any).dehydrate(options)
}

/**
 * @since 1.0.0
 * @category hydration
 */
export const hydrate = (
  registry: Registry.Registry,
  dehydratedState: DehydratedState,
  options?: HydrateOptions
): void => {
  return (registry as any).hydrate(dehydratedState, options)
}

/**
 * @since 1.0.0
 * @category utilities
 */
export const getRxKey = (rx: Rx.Rx<any>): string => {
  // Use the rx's label if available, otherwise use a hash of the rx object
  if (rx.label) {
    return rx.label[0]
  }

  throw new Error("to dehydrate an rx, it must have a label")
}

/**
 * @since 1.0.0
 * @category utilities
 */
export const isDehydratedStateEmpty = (state: DehydratedState): boolean => {
  return state.rxs.length === 0
}

/**
 * @since 1.0.0
 * @category utilities
 */
export const createDehydratedState = (
  rxs: ReadonlyArray<DehydratedRx> = []
): DehydratedState => ({
  rxs
})

export const defaultShouldDehydrateRx = (rx: Rx.Rx<any>): boolean => {
  return Rx.isSerializable(rx)
}
