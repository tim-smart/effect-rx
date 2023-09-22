/**
 * @since 1.0.0
 */
import * as Equal from "@effect/data/Equal"
import { globalValue } from "@effect/data/GlobalValue"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId = Symbol.for("@effect-rx/rx/RxRef")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category models
 */
export interface ReadonlyRef<A> {
  readonly [TypeId]: TypeId
  readonly key: string
  readonly value: A
  readonly subscribe: (f: (a: A) => void) => () => void
  readonly map: <B>(f: (a: A) => B) => ReadonlyRef<B>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface RxRef<A> extends ReadonlyRef<A> {
  readonly set: (value: A) => RxRef<A>
  readonly update: (f: (value: A) => A) => RxRef<A>
}

/**
 * @since 1.0.0
 * @category models
 */
export interface Collection<A> extends ReadonlyRef<ReadonlyArray<RxRef<A>>> {
  readonly push: (item: A) => Collection<A>
  readonly insertAt: (index: number, item: A) => Collection<A>
  readonly remove: (ref: RxRef<A>) => Collection<A>
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const make = <A>(value: A): RxRef<A> => new RxRefImpl(value)

/**
 * @since 1.0.0
 * @category constructors
 */
export const collection = <A>(items: Iterable<A>): Collection<A> => new CollectionImpl(items)

class Subscribable<A> {
  listeners: Array<(a: A) => void> = []
  listenerCount = 0

  notify(a: A) {
    for (let i = 0; i < this.listenerCount; i++) {
      this.listeners[i](a)
    }
  }

  subscribe(f: (a: A) => void): () => void {
    this.listeners.push(f)
    this.listenerCount++

    return () => {
      const index = this.listeners.indexOf(f)
      if (index !== -1) {
        this.listeners[index] = this.listeners[this.listenerCount - 1]
        this.listeners.pop()
        this.listenerCount--
      }
    }
  }
}

const keyState = globalValue("@effect-rx/rx/RxRef/keyState", () => ({
  count: 0,
  generate() {
    return `RxRef-${this.count++}`
  }
}))

class ReadonlyRefImpl<A> extends Subscribable<A> implements ReadonlyRef<A> {
  readonly [TypeId]: TypeId
  readonly key = keyState.generate()
  constructor(public value: A) {
    super()
    this[TypeId] = TypeId
  }
  map<B>(f: (a: A) => B): ReadonlyRef<B> {
    return new MapRefImpl(this, f)
  }
}

class RxRefImpl<A> extends ReadonlyRefImpl<A> implements RxRef<A> {
  set(value: A) {
    if (Equal.equals(value, this.value)) {
      return this
    }
    this.value = value
    this.notify(value)
    return this
  }

  update(f: (value: A) => A) {
    return this.set(f(this.value))
  }
}

class MapRefImpl<A, B> implements ReadonlyRef<B> {
  readonly [TypeId]: TypeId
  readonly key = keyState.generate()
  constructor(readonly parent: ReadonlyRef<A>, readonly transform: (a: A) => B) {
    this[TypeId] = TypeId
  }
  get value() {
    return this.transform(this.parent.value)
  }
  subscribe(f: (a: B) => void): () => void {
    let previous = this.transform(this.parent.value)
    return this.parent.subscribe((a) => {
      const next = this.transform(a)
      if (Equal.equals(next, previous)) {
        return
      }
      previous = next
      f(next)
    })
  }
  map<C>(f: (a: B) => C): ReadonlyRef<C> {
    return new MapRefImpl(this, f)
  }
}

class CollectionImpl<A> extends ReadonlyRefImpl<Array<RxRef<A>>> implements Collection<A> {
  constructor(items: Iterable<A>) {
    super([])
    for (const item of items) {
      this.value.push(this.makeRef(item))
    }
  }

  makeRef(value: A) {
    const ref = new RxRefImpl(value)
    const notify = (value: A) => {
      ref.notify(value)
      this.notify(this.value)
    }
    return new Proxy(ref, {
      get(target, p, _receiver) {
        if (p === "notify") {
          return notify
        }
        return target[p as keyof RxRef<A>]
      }
    })
  }

  push(item: A) {
    const ref = this.makeRef(item)
    this.value.push(ref)
    this.notify(this.value)
    return this
  }

  insertAt(index: number, item: A) {
    const ref = this.makeRef(item)
    this.value.splice(index, 0, ref)
    this.notify(this.value)
    return this
  }

  remove(ref: RxRef<A>) {
    const index = this.value.indexOf(ref)
    if (index !== -1) {
      this.value.splice(index, 1)
      this.notify(this.value)
    }
    return this
  }
}
