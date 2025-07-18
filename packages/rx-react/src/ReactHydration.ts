"use client"
/**
 * @since 1.0.0
 */
import * as Hydration from "@effect-rx/rx/Hydration"
import * as React from "react"
import { RegistryContext } from "./RegistryContext.js"

/**
 * @since 1.0.0
 * @category components
 */
export const HydrationBoundary: React.FC<{
  state: Iterable<Hydration.DehydratedRx>
  children?: React.ReactNode
}> = ({ children, state }) => {
  const registry = React.useContext(RegistryContext)
  React.useEffect(() => {
    Hydration.hydrate(registry, state)
  }, [registry, state])
  return React.createElement(React.Fragment, {}, children)
}
