/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import type * as Rx from "@effect-rx/rx/Rx"
import * as React from "react"

export * as Registry from "@effect-rx/rx/Registry"
export * as Result from "@effect-rx/rx/Result"
export * as Rx from "@effect-rx/rx/Rx"

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make())

class RxStore<A> {
  constructor(
    readonly registry: Registry.Registry,
    readonly rx: Rx.Rx<A>
  ) {}
  value = this.registry.get(this.rx)
  init = false
  subscribe = (f: () => void): () => void => {
    if (this.init === true) {
      this.value = this.registry.get(this.rx)
    } else {
      this.init = true
    }
    return this.registry.subscribe(this.rx, (a) => {
      this.value = a
      f()
    })
  }
  snapshot = (): A => this.value
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxValue = <A>(rx: Rx.Rx<A>): A => {
  const registry = React.useContext(RegistryContext)
  const store = React.useRef<RxStore<A>>(undefined as any)
  if (store.current?.rx !== rx || store.current?.registry !== registry) {
    store.current = new RxStore(registry, rx)
  }
  return React.useSyncExternalStore(store.current.subscribe, store.current.snapshot)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useSetRx = <R, W>(rx: Rx.Writeable<R, W>): (_: W) => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback((value) => registry.set(rx, value), [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useUpdateRx = <R, W>(rx: Rx.Writeable<R, W>): (f: (_: R) => W) => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback((f) => registry.set(rx, f(registry.get(rx))), [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRx = <R, W>(rx: Rx.Writeable<R, W>): readonly [R, (_: W) => void] =>
  [
    useRxValue(rx),
    useSetRx(rx)
  ] as const

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxUpdate = <R, W>(rx: Rx.Writeable<R, W>): readonly [R, (f: (_: R) => W) => void] =>
  [
    useRxValue(rx),
    useUpdateRx(rx)
  ] as const
