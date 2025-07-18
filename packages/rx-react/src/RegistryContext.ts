"use client"
/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
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
