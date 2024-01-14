/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import type * as Rx from "@effect-rx/rx/Rx"
import type * as RxRef from "@effect-rx/rx/RxRef"
import { globalValue } from "effect/GlobalValue"
import type { InjectionKey, Ref } from "vue"
import { getCurrentScope, inject, onScopeDispose, ref } from "vue"

/**
 * @since 1.0.0
 * @category modules
 */
export * as Registry from "@effect-rx/rx/Registry"
/**
 * @since 1.0.0
 * @category modules
 */
export * as Result from "@effect-rx/rx/Result"
/**
 * @since 1.0.0
 * @category modules
 */
export * as Rx from "@effect-rx/rx/Rx"
/**
 * @since 1.0.0
 * @category modules
 */
export * as RxRef from "@effect-rx/rx/RxRef"

/**
 * @since 1.0.0
 * @category registry
 */
export const registryKey = Registry.TypeId as InjectionKey<Registry.Registry>

/**
 * @since 1.0.0
 * @category registry
 */
export const defaultRegistry: Registry.Registry = globalValue(
  "@effect-rx/rx-vue/defaultRegistry",
  () => Registry.make()
)

/**
 * @since 1.0.0
 * @category registry
 */
export const injectRegistry = (): Registry.Registry => {
  return inject(registryKey) ?? defaultRegistry
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useRx = <R, W>(rx: Rx.Writable<R, W>): readonly [Readonly<Ref<R>>, (_: W) => void] => {
  const registry = injectRegistry()
  const value = ref<R>(registry.get(rx))
  const cancel = registry.subscribe(rx, (nextValue) => {
    value.value = nextValue as any
  })
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return [value as Readonly<Ref<R>>, (_) => registry.set(rx, _)]
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useRxValue = <A>(rx: Rx.Rx<A>): Readonly<Ref<A>> => {
  const registry = injectRegistry()
  const value = ref<A>(registry.get(rx))
  const cancel = registry.subscribe(rx, (nextValue) => {
    value.value = nextValue as any
  })
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return value as Readonly<Ref<A>>
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useRxSet = <R, W>(rx: Rx.Writable<R, W>): (_: W) => void => {
  const registry = injectRegistry()
  const cancel = registry.mount(rx)
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return (_) => registry.set(rx, _)
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useRxRef = <A>(rxRef: RxRef.ReadonlyRef<A>): Readonly<Ref<A>> => {
  const value = ref<A>(rxRef.value)
  const cancel = rxRef.subscribe((nextValue) => {
    value.value = nextValue as any
  })
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return value as Readonly<Ref<A>>
}
