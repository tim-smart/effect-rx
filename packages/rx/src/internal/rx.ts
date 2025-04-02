import type * as Rx from "../Rx.js"

/**
 * @since 1.0.0
 * @category type ids
 */
export const WritableTypeId: Rx.WritableTypeId = Symbol.for("@effect-rx/rx/Rx/Writable") as Rx.WritableTypeId

/**
 * @since 1.0.0
 * @category refinements
 */
export const isWritable = <R, W>(rx: Rx.Rx<R>): rx is Rx.Writable<R, W> => WritableTypeId in rx
