"use client"
/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import type * as Rx from "@effect-rx/rx/Rx"
import * as React from "react"
import * as Scheduler from "scheduler"

/**
 * @since 1.0.0
 * @category context
 */
export function scheduleTask(f: () => void): void {
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, f)
}

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make({
  scheduleTask,
  defaultIdleTTL: 400
}))

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryProvider = (options: {
  readonly children?: React.ReactNode | undefined
  readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}) => {
  const registry = React.useMemo(() =>
    Registry.make({
      scheduleTask,
      defaultIdleTTL: 400,
      ...options
    }), [])
  React.useEffect(() => () => {
    registry.dispose()
  }, [registry])
  return React.createElement(RegistryContext.Provider, {
    value: Registry.make({
      scheduleTask,
      defaultIdleTTL: 400,
      ...options
    })
  }, options?.children)
}
