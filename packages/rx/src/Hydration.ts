/**
 * @since 1.0.0
 */
import * as Arr from "effect/Array"
import { constTrue } from "effect/Function"
import type * as Registry from "./Registry.js"
import * as Result from "./Result.js"
import * as Rx from "./Rx.js"

/**
 * @since 1.0.0
 * @category models
 */
export interface DehydratedRx {
  readonly key: string
  readonly value: unknown
  readonly dehydratedAt: number
  readonly reactPromise?: Promise<unknown>
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
      const encodedValue = rx[Rx.SerializableTypeId].encode(value)

      // Create a promise that resolves when the rx moves out of Initial state
      let reactPromise: Promise<unknown> | undefined
      if (Result.isResult(value) && Result.isInitial(value)) {
        reactPromise = new Promise((resolve) => {
          const unsubscribe = registry.subscribe(rx, (newValue) => {
            if (Result.isResult(newValue) && !Result.isInitial(newValue)) {
              resolve(rx[Rx.SerializableTypeId].encode(newValue))
              unsubscribe()
            }
          })
        })
      }

      arr.push({
        key: key as string,
        value: encodedValue,
        dehydratedAt: now,
        reactPromise
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

    // If there's a reactPromise, it means this was in Initial state when dehydrated
    // and we should wait for it to resolve to a non-Initial state, then update the registry
    if (drx.reactPromise) {
      drx.reactPromise.then((resolvedValue) => {
        // Try to update the existing node directly instead of using setSerializable
        const nodes = (registry as any).getNodes()
        const node = nodes.get(drx.key)
        if (node) {
          // Decode the resolved value using the node's rx serializable decoder
          const rx = node.rx as any
          if (rx[Rx.SerializableTypeId]) {
            const decoded = rx[Rx.SerializableTypeId].decode(resolvedValue)
            node.setValue(decoded)
          }
        } else {
          // Fallback to setSerializable if node doesn't exist yet
          registry.setSerializable(drx.key, resolvedValue)
        }
      }).catch(() => {
        // If the promise rejects, ignore it since the original registry might be disposed
      })
    }
  }
}
