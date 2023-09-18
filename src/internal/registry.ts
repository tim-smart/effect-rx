import * as Equal from "@effect/data/Equal"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Queue from "@effect/io/Queue"
import * as Scope from "@effect/io/Scope"
import type * as Registry from "@effect/rx/Registry"
import type * as Rx from "@effect/rx/Rx"

const constImmediate = { immediate: true }
function constListener(_: any) {}

/** @internal */
export const TypeId: Registry.TypeId = Symbol.for("@effect/rx/Registry") as Registry.TypeId

/** @internal */
export const make = (): Registry.Registry => new RegistryImpl()

class RegistryImpl implements Registry.Registry {
  readonly [TypeId]: Registry.TypeId
  constructor() {
    this[TypeId] = TypeId
  }

  private readonly nodes = new WeakMap<Rx.Rx<any>, Node<any>>()

  get = <A>(rx: Rx.Rx<A>): A => {
    return this.ensureNode(rx).value()
  }

  set = <R, W>(rx: Rx.Writeable<R, W>, value: W): void => {
    rx.write(
      this.get,
      this.set,
      this.ensureNode(rx).setValue,
      value
    )
  }

  refresh = <A>(rx: Rx.Rx<A> & Rx.Refreshable): void => {
    rx.refresh((_) => this.ensureNode(rx).invalidate())
  }

  subscribe: Rx.Rx.Subscribe = (rx, f, options) => {
    const node = this.ensureNode(rx)
    const remove = node.subscribe(function() {
      f(node._value)
    })

    if (options?.immediate) {
      if ((node.state & NodeFlags.initialized) === 0) {
        node.value()
      } else {
        f(node.value())
      }
    }

    return () => {
      remove()
      if (node.canBeRemoved) {
        this.scheduleNodeRemoval(node)
      }
    }
  }

  subscribeWithPrevious: Rx.Rx.SubscribeWithPrevious = <A>(
    rx: Rx.Rx<A>,
    f: (prev: Option.Option<A>, value: A) => void,
    options?: { readonly immediate?: boolean }
  ): () => void => {
    let prev = Option.none<A>()
    function listener(a: A) {
      const old = prev
      prev = Option.some(a)
      f(old, a)
    }
    return this.subscribe(rx, listener, options)
  }

  mount<A>(rx: Rx.Rx<A>) {
    return this.subscribe(rx, constListener, constImmediate)
  }

  queue<A>(rx: Rx.Rx<A>) {
    return Effect.tap(Queue.unbounded<A>(), (queue) => {
      const offer = Effect.async<never, never, never>(() => {
        const cancel = this.subscribe(rx, (a) => {
          Queue.unsafeOffer(queue, a)
        }, constImmediate)
        return Effect.sync(cancel)
      })
      const shutdown = Queue.shutdown(queue)
      return Effect.zipRight(
        Effect.addFinalizer(() => shutdown),
        Effect.forkScoped(offer)
      )
    })
  }

  ensureNode<A>(rx: Rx.Rx<A>): Node<A> {
    let node = this.nodes.get(rx)
    if (node === undefined) {
      node = this.createNode(rx)
      this.nodes.set(rx, node)
    }
    return node
  }

  createNode<A>(rx: Rx.Rx<A>): Node<A> {
    if (!rx.keepAlive) {
      this.scheduleRxRemoval(rx)
    }
    return new Node(this, rx)
  }

  scheduleRxRemoval(rx: Rx.Rx<any>): void {
    queueMicrotask(() => {
      const node = this.nodes.get(rx)
      if (node !== undefined && node.canBeRemoved) {
        this.removeNode(node)
      }
    })
  }

  scheduleNodeRemoval(node: Node<any>): void {
    queueMicrotask(() => {
      if (node.canBeRemoved) {
        this.removeNode(node)
      }
    })
  }

  removeNode(node: Node<any>): void {
    const parents = node.parents
    this.nodes.delete(node.rx)
    node.remove()
    for (let i = 0; i < parents.length; i++) {
      if (parents[i].canBeRemoved) {
        this.removeNode(parents[i])
      }
    }
  }
}

const enum NodeFlags {
  alive = 1 << 0,
  initialized = 1 << 1,
  waitingForValue = 1 << 2,

  uninitialized = alive | waitingForValue,
  stale = alive | initialized | waitingForValue,
  valid = alive | initialized,
  removed = 0
}

class Node<A> {
  constructor(
    readonly registry: RegistryImpl,
    readonly rx: Rx.Rx<A>
  ) {}

  state: NodeFlags = NodeFlags.uninitialized
  lifetime: Lifetime<A> | undefined

  parents: Array<Node<any>> = []
  previousParents: Array<Node<any>> | undefined
  children: Array<Node<any>> = []
  listeners: Array<() => void> = []

  get canBeRemoved(): boolean {
    return !this.rx.keepAlive && this.listeners.length === 0 && this.children.length === 0 &&
      this.state !== 0
  }

  _value: A = undefined as any
  value(): A {
    if ((this.state & NodeFlags.waitingForValue) !== 0) {
      this.lifetime = new Lifetime(this)
      const value = this.rx.read(this.lifetime)
      if ((this.state & NodeFlags.waitingForValue) !== 0) {
        this.setValue(value)
      }

      if (this.previousParents) {
        const parents = this.previousParents
        this.previousParents = undefined
        for (let i = 0; i < parents.length; i++) {
          parents[i].removeChild(this)
          if (parents[i].canBeRemoved) {
            this.registry.scheduleNodeRemoval(parents[i])
          }
        }
      }
    }

    return this._value
  }

  valueOption(): Option.Option<A> {
    if ((this.state & NodeFlags.initialized) === 0) {
      return Option.none()
    }
    return Option.some(this._value)
  }

  setValue = (value: A): void => {
    if ((this.state & NodeFlags.initialized) === 0) {
      this.state = NodeFlags.valid
      this._value = value
      this.notify()
      return
    }

    this.state = NodeFlags.valid
    if (Equal.equals(this._value, value)) {
      return
    }

    this._value = value
    this.invalidateChildren()
    this.notify()
  }

  addParent(parent: Node<any>): void {
    this.parents.push(parent)
    if (this.previousParents !== undefined) {
      const index = this.previousParents.indexOf(parent)
      if (index !== -1) {
        this.previousParents[index] = this.previousParents[this.previousParents.length - 1]
        if (this.previousParents.pop() === undefined) {
          this.previousParents = undefined
        }
      }
    }

    if (parent.children.indexOf(this) === -1) {
      parent.children.push(this)
    }
  }

  removeChild(child: Node<any>): void {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children[index] = this.children[this.children.length - 1]
      this.children.pop()
    }
  }

  invalidate(): void {
    if (this.state === NodeFlags.valid) {
      this.state = NodeFlags.stale
      this.disposeLifetime()
    }

    // rebuild
    this.value()
  }

  invalidateChildren(): void {
    if (this.children.length === 0) {
      return
    }

    const children = this.children
    this.children = []
    for (let i = 0; i < children.length; i++) {
      children[i].invalidate()
    }
  }

  notify(): void {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]()
    }
  }

  disposeLifetime(): void {
    if (this.lifetime !== undefined) {
      this.lifetime.dispose()
      this.lifetime = undefined
    }

    if (this.parents.length !== 0) {
      this.previousParents = this.parents
      this.parents = []
    }
  }

  remove() {
    this.state = NodeFlags.removed

    if (this.lifetime === undefined) {
      return
    }

    this.disposeLifetime()

    if (this.previousParents === undefined) {
      return
    }

    const parents = this.previousParents
    this.previousParents = undefined
    for (let i = 0; i < parents.length; i++) {
      parents[i].removeChild(this)
      if (parents[i].canBeRemoved) {
        this.registry.removeNode(parents[i])
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners[index] = this.listeners[this.listeners.length - 1]
        this.listeners.pop()
      }
    }
  }
}

class Lifetime<A> implements Rx.Context<A> {
  constructor(
    readonly node: Node<A>
  ) {}

  finalizers: Array<() => void> | undefined
  disposed = false

  addFinalizer(f: () => void): void {
    this.finalizers ??= []
    this.finalizers.push(f)
  }

  get<A>(rx: Rx.Rx<A>): A {
    const parent = this.node.registry.ensureNode(rx)
    this.node.addParent(parent)
    return parent.value()
  }

  once<A>(rx: Rx.Rx<A>): A {
    return this.node.registry.get(rx)
  }

  self(): Option.Option<A> {
    return this.node.valueOption()
  }

  refresh<A>(rx: Rx.Rx<A> & Rx.Refreshable): void {
    this.node.registry.refresh(rx)
  }

  refreshSelf(): void {
    this.node.invalidate()
  }

  queue<A>(rx: Rx.Rx<A>): Effect.Effect<never, never, Queue.Dequeue<A>> {
    const scope = Effect.runSync(Scope.make())
    this.addFinalizer(() => Effect.runFork(Scope.close(scope, Exit.unit)))
    return Scope.use(this.node.registry.queue(rx), scope)
  }

  subscribe<A>(rx: Rx.Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }): void {
    this.addFinalizer(this.node.registry.subscribe(rx, f, options))
  }

  subscribeWithPrevious<A>(rx: Rx.Rx<A>, f: (prev: Option.Option<A>, value: A) => void, options?: {
    readonly immediate?: boolean
  }): void {
    this.addFinalizer(this.node.registry.subscribeWithPrevious(rx, f, options))
  }

  setSelf(a: A): void {
    this.node.setValue(a)
  }

  set<R, W>(rx: Rx.Writeable<R, W>, value: W): void {
    this.node.registry.set(rx, value)
  }

  dispose(): void {
    this.disposed = true
    if (this.finalizers === undefined) {
      return
    }

    const finalizers = this.finalizers
    this.finalizers = undefined
    for (let i = finalizers.length - 1; i >= 0; i--) {
      finalizers[i]()
    }
  }
}
