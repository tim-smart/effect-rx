/**
 * @since 1.0.0
 */
import type * as Atom from "@effect-atom/atom/Atom"
import type * as AtomRef from "@effect-atom/atom/AtomRef"
import * as Registry from "@effect-atom/atom/Registry"
import { globalValue } from "effect/GlobalValue"
import type { InjectionKey, Ref } from "vue"
import { computed, inject, ref, watchEffect } from "vue"

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
 * @category re-exports
 */
export * as AtomHttpApi from "@effect-atom/atom/AtomHttpApi"

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
  return inject(registryKey, defaultRegistry)
}

const useAtomValueRef = <A extends Atom.Atom<any>>(atom: () => A) => {
  const registry = injectRegistry()
  const atomRef = computed(atom)
  const value = ref(undefined as any as A)
  watchEffect((onCleanup) => {
    onCleanup(registry.subscribe(atomRef.value, (nextValue) => {
      value.value = nextValue
    }, { immediate: true }))
  })
  return [value as Readonly<Ref<Atom.Type<A>>>, atomRef, registry] as const
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtom = <R, W>(atom: () => Atom.Writable<R, W>): readonly [Readonly<Ref<R>>, (_: W) => void] => {
  const [value, atomRef, registry] = useAtomValueRef(atom)
  return [value as Readonly<Ref<R>>, (_) => registry.set(atomRef.value, _)]
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtomValue = <A>(atom: () => Atom.Atom<A>): Readonly<Ref<A>> => useAtomValueRef(atom)[0]

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtomSet = <R, W>(atom: () => Atom.Writable<R, W>): (_: W) => void => {
  const registry = injectRegistry()
  const atomRef = computed(atom)
  watchEffect((onCleanup) => {
    onCleanup(registry.mount(atomRef.value))
  })
  return (_) => registry.set(atomRef.value, _)
}

/**
 * @since 1.0.0
 * @category composables
 */
export const useAtomRef = <A>(atomRef: () => AtomRef.ReadonlyRef<A>): Readonly<Ref<A>> => {
  const atomRefRef = computed(atomRef)
  const value = ref<A>(atomRefRef.value.value)
  watchEffect((onCleanup) => {
    const atomRef = atomRefRef.value
    onCleanup(atomRef.subscribe((next) => {
      value.value = next
    }))
  })
  return value as Readonly<Ref<A>>
}
