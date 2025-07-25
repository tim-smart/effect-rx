/**
 * @since 1.0.0
 */
import * as Arr from "effect/Array"
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
  readonly resultPromise?: Promise<unknown>
}

/**
 * @since 1.0.0
 * @category models
 */
export type ShouldDehydrateRxFn = (rx: Rx.Rx<any> & Rx.Serializable, value: unknown) => boolean

/**
 * @since 1.0.0
 * @category dehydration
 */
export const defaultShouldDehydrateRx: ShouldDehydrateRxFn = (rx, value) => {
  return Result.isResult(value) && Result.isSuccess(value)
}

/**
 * @since 1.0.0
 * @category dehydration
 */
export const dehydrate = (
  registry: Registry.Registry,
  options?: {
    readonly shouldDehydrateRx?: ShouldDehydrateRxFn | undefined
  }
): Array<DehydratedRx> => {
  const shouldDehydrateRx = options?.shouldDehydrateRx ?? defaultShouldDehydrateRx
  const arr = Arr.empty<DehydratedRx>()
  const now = Date.now()
  registry.getNodes().forEach((node, key) => {
    if (!Rx.isSerializable(node.rx)) return
    const rx = node.rx
    const value = node.value()
    if (shouldDehydrateRx(rx, value)) {
      const encodedValue = rx[Rx.SerializableTypeId].encode(value)

      // Create a promise that resolves when the rx moves out of Initial state
      let resultPromise: Promise<unknown> | undefined
      if (Result.isResult(value) && Result.isInitial(value)) {
        resultPromise = new Promise((resolve) => {
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
        resultPromise
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
  dehydratedState: Iterable<DehydratedRx>
): void => {
  for (const drx of dehydratedState) {
    registry.setSerializable(drx.key, drx.value)

    // If there's a resultPromise, it means this was in Initial state when dehydrated
    // and we should wait for it to resolve to a non-Initial state, then update the registry
    if (drx.resultPromise) {
      drx.resultPromise.then((resolvedValue) => {
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
      })
    }
  }
}
