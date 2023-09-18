/**
 * @since 1.0.0
 */
import type * as Option from "@effect/data/Option"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import type * as Effect from "@effect/io/Effect"
import type * as Queue_ from "@effect/io/Queue"
import type * as Scope from "@effect/io/Scope"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId = Symbol.for("@effect/rx/Rx")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Rx<A> extends Pipeable {
  readonly [TypeId]: TypeId
  readonly keepAlive: boolean
  readonly read: (ctx: Context<A>) => A
}

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace Rx {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Get = <A>(rx: Rx<A>) => A

  /**
   * @since 1.0.0
   * @category models
   */
  export type Set = <R, W>(rx: Writeable<R, W>, value: W) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Refresh = (rx: Refreshable) => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Mount = <A>(rx: Rx<A>) => () => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Subscribe = <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type SubscribeWithPrevious = <A>(rx: Rx<A>, f: (prev: Option.Option<A>, value: A) => void, options?: {
    readonly immediate?: boolean
  }) => () => void

  /**
   * @since 1.0.0
   * @category models
   */
  export type Queue = <A>(rx: Rx<A>) => Effect.Effect<Scope.Scope, never, Queue_.Dequeue<A>>
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const WriteableTypeId = Symbol.for("@effect/rx/Rx/Writeable")

/**
 * @since 1.0.0
 * @category type ids
 */
export type WriteableTypeId = typeof WriteableTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Writeable<R, W> extends Rx<R> {
  readonly [WriteableTypeId]: WriteableTypeId
  readonly write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void
}

/**
 * @since 1.0.0
 * @category type ids
 */
export const RefreshableTypeId = Symbol.for("@effect/rx/Rx/Refreshable")

/**
 * @since 1.0.0
 * @category type ids
 */
export type RefreshableTypeId = typeof RefreshableTypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface Refreshable extends Rx<any> {
  readonly [RefreshableTypeId]: RefreshableTypeId
  readonly refresh: (f: <A>(rx: Rx<A>) => void) => void
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Context<A> {
  readonly get: Rx.Get
  readonly once: Rx.Get
  readonly addFinalizer: (f: () => void) => void
  readonly refresh: Rx.Refresh
  readonly refreshSelf: () => void
  readonly self: () => Option.Option<A>
  readonly setSelf: (a: A) => void
  readonly set: Rx.Set
  readonly subscribe: <A>(rx: Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }) => void
}

const RxProto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments)
  }
} as const

const WriteableProto = {
  ...RxProto,
  [WriteableTypeId]: WriteableTypeId
} as const

/**
 * @since 1.0.0
 * @category constructors
 */
export const readable = <A>(read: (ctx: Context<A>) => A): Rx<A> => {
  const rx = Object.create(RxProto)
  rx.keepAlive = false
  rx.read = read
  return rx
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const writable = <R, W>(
  read: (ctx: Context<R>) => R,
  write: (get: Rx.Get, set: Rx.Set, setSelf: (_: R) => void, value: W) => void
): Writeable<R, W> => {
  const rx = Object.create(WriteableProto)
  rx.keepAlive = false
  rx.read = read
  rx.write = write
  return rx
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const state = <A>(
  initialValue: A
): Writeable<A, A> =>
  writable(
    function(_ctx) {
      return initialValue
    },
    function(_get, _set, setSelf, value) {
      setSelf(value)
    }
  )

/**
 * @since 1.0.0
 * @category combinators
 */
export const keepAlive = <A extends Rx<any>>(self: A): A => {
  const proto = Object.getPrototypeOf(self)
  const rx = Object.assign(Object.create(proto), self)
  rx.keepAlive = true
  return rx
}
