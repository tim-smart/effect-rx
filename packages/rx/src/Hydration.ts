/**
 * @since 1.0.0
 */
import * as Arr from "effect/Array"
import { constTrue } from "effect/Function"
import type * as Registry from "./Registry.js"
import * as Rx from "./Rx.js"

/**
 * @since 1.0.0
 * @category models
 */
export interface DehydratedRx {
  readonly key: string
  readonly value: unknown
  readonly dehydratedAt: number
}

/**
 * @since 1.0.0
 * @category dehydration
 */
export const dehydrate = (
  registry: Registry.Registry,
  options?: {
    readonly shouldDehydrateRx?: ((rx: Rx.Rx<any> & Rx.Serializable) => boolean) | undefined
  }
): Array<DehydratedRx> => {
  const shouldDehydrateRx = options?.shouldDehydrateRx ?? constTrue
  const arr = Arr.empty<DehydratedRx>()
  const now = Date.now()
  registry.getNodes().forEach((node, key) => {
    if (!Rx.isSerializable(node.rx)) return
    const rx = node.rx
    if (shouldDehydrateRx(rx)) {
      const value = node.value()
      arr.push({
        key: key as string,
        value: rx[Rx.SerializableTypeId].encode(value),
        dehydratedAt: now
      })
    }
  })
  return arr
}

/**
 * @since 1.0.0
 * @category hydration
 */
export const hydrate = (
  registry: Registry.Registry,
  dehydratedState: Iterable<DehydratedRx>,
  options?: {
    readonly shouldHydrateRx?: ((dehydratedRx: DehydratedRx) => boolean) | undefined
  }
): void => {
  const shouldHydrateRx = options?.shouldHydrateRx ?? constTrue
  for (const drx of dehydratedState) {
    if (!shouldHydrateRx(drx)) continue
    registry.setSerializable(drx.key, drx.value)
  }
}
