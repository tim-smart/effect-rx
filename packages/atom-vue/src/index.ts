/**
 * @since 1.0.0
 */
import type * as Atom from "@effect-atom/atom/Atom"
import type * as AtomRef from "@effect-atom/atom/AtomRef"
import * as Registry from "@effect-atom/atom/Registry"
import { globalValue } from "effect/GlobalValue"
import type { InjectionKey, Ref } from "vue"
import { getCurrentScope, inject, onScopeDispose, ref } from "vue"

/**
 * @since 1.0.0
 * @category modules
 */
export * as Registry from "@effect-atom/atom/Registry"

/**
 * @since 1.0.0
 * @category modules
 */
export * as Result from "@effect-atom/atom/Result"

/**
 * @since 1.0.0
 * @category modules
 */
export * as Atom from "@effect-atom/atom/Atom"

/**
 * @since 1.0.0
 * @category modules
 */
export * as AtomRef from "@effect-atom/atom/AtomRef"

/**
 * @since 1.0.0
 * @category modules
 */
export * as AtomRpc from "@effect-atom/atom/AtomRpc"

/**
 * @since 1.0.0
 * @category registry
 */
export const registryKey = Symbol.for(Registry.TypeId) as InjectionKey<Registry.Registry>

/**
 * @since 1.0.0
 * @category registry
 */
export const defaultRegistry: Registry.Registry = globalValue(
  "@effect-atom/atom-vue/defaultRegistry",
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
export const useAtom = <R, W>(atom: Atom.Writable<R, W>): readonly [Readonly<Ref<R>>, (_: W) => void] => {
  const registry = injectRegistry()
  const value = ref<R>(registry.get(atom))
  const cancel = registry.subscribe(atom, (nextValue) => {
    value.value = nextValue as any
  })
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return [value as Readonly<Ref<R>>, (_) => registry.set(atom, _)]
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtomValue = <A>(atom: Atom.Atom<A>): Readonly<Ref<A>> => {
  const registry = injectRegistry()
  const value = ref<A>(registry.get(atom))
  const cancel = registry.subscribe(atom, (nextValue) => {
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
export const useAtomSet = <R, W>(atom: Atom.Writable<R, W>): (_: W) => void => {
  const registry = injectRegistry()
  const cancel = registry.mount(atom)
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return (_) => registry.set(atom, _)
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtomRef = <A>(atomRef: AtomRef.ReadonlyRef<A>): Readonly<Ref<A>> => {
  const value = ref<A>(atomRef.value)
  const cancel = atomRef.subscribe((nextValue) => {
    value.value = nextValue as any
  })
  if (getCurrentScope()) {
    onScopeDispose(cancel)
  }
  return value as Readonly<Ref<A>>
}
