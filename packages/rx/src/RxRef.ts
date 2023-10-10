/**
 * @since 1.0.0
 */
import * as Equal from "effect/Equal"
import { globalValue } from "effect/GlobalValue"
import * as Hash from "effect/Hash"

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
export interface ReadonlyRef<A> extends Equal.Equal {
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
  readonly prop: <K extends keyof A>(prop: K) => RxRef<A[K]>
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
  readonly toArray: () => Array<A>
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

const keyState = globalValue("@effect-rx/rx/RxRef/keyState", () => ({
  count: 0,
  generate() {
    return `RxRef-${this.count++}`
  }
}))

class ReadonlyRefImpl<A> implements ReadonlyRef<A> {
  readonly [TypeId]: TypeId
  readonly key = keyState.generate()
  constructor(public value: A) {
    this[TypeId] = TypeId
  }

  [Equal.symbol](that: ReadonlyRef<A>) {
    return Equal.equals(this.value, that.value)
  }

  [Hash.symbol]() {
    return Hash.hash(this.value)
  }

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

  map<B>(f: (a: A) => B): ReadonlyRef<B> {
    return new MapRefImpl(this, f)
  }
}

class RxRefImpl<A> extends ReadonlyRefImpl<A> implements RxRef<A> {
  prop<K extends keyof A>(prop: K): RxRef<A[K]> {
    return new PropRefImpl(this, prop)
  }
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
  [Equal.symbol](that: ReadonlyRef<A>) {
    return Equal.equals(this.value, that.value)
  }
  [Hash.symbol]() {
    return Hash.hash(this.value)
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

class PropRefImpl<A, K extends keyof A> implements RxRef<A[K]> {
  readonly [TypeId]: TypeId
  readonly key = keyState.generate()
  constructor(readonly parent: RxRef<A>, readonly _prop: K) {
    this[TypeId] = TypeId
  }
  [Equal.symbol](that: ReadonlyRef<A>) {
    return Equal.equals(this.value, that.value)
  }
  [Hash.symbol]() {
    return Hash.hash(this.value)
  }
  get value() {
    return this.parent.value[this._prop]
  }
  subscribe(f: (a: A[K]) => void): () => void {
    let previous = this.value
    return this.parent.subscribe((a) => {
      const next = a[this._prop]
      if (Equal.equals(next, previous)) {
        return
      }
      previous = next
      f(next)
    })
  }
  map<C>(f: (a: A[K]) => C): ReadonlyRef<C> {
    return new MapRefImpl(this, f)
  }
  prop<CK extends keyof A[K]>(prop: CK): RxRef<A[K][CK]> {
    return new PropRefImpl(this, prop)
  }
  set(value: A[K]): RxRef<A[K]> {
    this.parent.set({
      ...this.parent.value,
      [this._prop]: value
    })
    return this
  }
  update(f: (value: A[K]) => A[K]): RxRef<A[K]> {
    this.parent.set({
      ...this.parent.value,
      [this._prop]: f(this.parent.value[this._prop])
    })
    return this
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

  toArray() {
    return this.value.map((ref) => ref.value)
  }
}
