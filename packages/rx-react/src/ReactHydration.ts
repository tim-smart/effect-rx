/**
 * @since 1.0.0
 */
"use client"
import * as Hydration from "@effect-rx/rx/Hydration"
import * as React from "react"
import { RegistryContext } from "./RegistryContext.js"

/**
 * @since 1.0.0
 * @category components
 */
export interface HydrationBoundaryProps {
  state?: Iterable<Hydration.DehydratedRx>
  options?: {
    readonly shouldHydrateRx?: ((dehydratedRx: Hydration.DehydratedRx) => boolean) | undefined
  }
  children?: React.ReactNode
}

/**
 * @since 1.0.0
 * @category components
 */
export const HydrationBoundary: React.FC<HydrationBoundaryProps> = ({
  children,
  options = {},
  state
}) => {
  const registry = React.useContext(RegistryContext)

  const optionsRef = React.useRef(options)
  optionsRef.current = options

  // This useMemo is for performance reasons only, everything inside it must
  // be safe to run in every render and code here should be read as "in render".
  //
  // This code needs to happen during the render phase, because after initial
  // SSR, hydration needs to happen _before_ children render. Also, if hydrating
  // during a transition, we want to hydrate as much as is safe in render so
  // we can prerender as much as possible.
  //
  // For any Rx values that already exist in the registry, we want to hold back on
  // hydrating until _after_ the render phase. The reason for this is that during
  // transitions, we don't want the existing Rx values and subscribers to update to
  // the new data on the current page, only _after_ the transition is committed.
  // If the transition is aborted, we will have hydrated any _new_ Rx values, but
  // we throw away the fresh data for any existing ones to avoid unexpectedly
  // updating the UI.
  const hydrationQueue: Array<Hydration.DehydratedRx> | undefined = React.useMemo(() => {
    if (state) {
      const dehydratedRxs = Array.from(state)
      const nodes = registry.getNodes()

      const newDehydratedRxs: Array<Hydration.DehydratedRx> = []
      const existingDehydratedRxs: Array<Hydration.DehydratedRx> = []

      for (const dehydratedRx of dehydratedRxs) {
        const existingNode = nodes.get(dehydratedRx.key)

        if (!existingNode) {
          // This is a new Rx value, safe to hydrate immediately
          newDehydratedRxs.push(dehydratedRx)
        } else {
          // This Rx value already exists, queue it for later hydration
          // TODO: Add logic to check if hydration data is newer
          existingDehydratedRxs.push(dehydratedRx)
        }
      }

      if (newDehydratedRxs.length > 0) {
        // It's actually fine to call this with state that already exists
        // in the registry, or is older. hydrate() is idempotent.
        Hydration.hydrate(registry, newDehydratedRxs, optionsRef.current)
      }

      if (existingDehydratedRxs.length > 0) {
        return existingDehydratedRxs
      }
    }
    return undefined
  }, [registry, state])

  React.useEffect(() => {
    if (hydrationQueue) {
      Hydration.hydrate(registry, hydrationQueue, optionsRef.current)
    }
  }, [registry, hydrationQueue])

  return React.createElement(React.Fragment, {}, children)
}
