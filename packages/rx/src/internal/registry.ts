import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Option from "effect/Option"
import * as Queue from "effect/Queue"
import * as Stream from "effect/Stream"
import type * as Registry from "../Registry.js"
import * as Result from "../Result.js"
import type * as Rx from "../Rx.js"

const constImmediate = { immediate: true }
function constListener(_: any) {}

/** @internal */
export const TypeId: Registry.TypeId = Symbol.for("@effect-rx/rx/Registry") as Registry.TypeId

/** @internal */
export const make = (options?: {
  readonly initialValues?: Iterable<readonly [Rx.Rx<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
}): Registry.Registry =>
  new RegistryImpl(
    options?.initialValues,
    options?.scheduleTask,
    options?.timeoutResolution
  )

class RegistryImpl implements Registry.Registry {
  readonly [TypeId]: Registry.TypeId
  constructor(
    initialValues?: Iterable<readonly [Rx.Rx<any>, any]>,
    readonly scheduleTask = queueMicrotask,
    readonly timeoutResolution = 1000
  ) {
    this[TypeId] = TypeId
    if (initialValues !== undefined) {
      for (const [rx, value] of initialValues) {
        this.ensureNode(rx).setValue(value)
      }
    }
  }

  private readonly nodes = new WeakMap<Rx.Rx<any>, Node<any>>()
  private readonly timeoutBuckets = new Map<number, readonly [nodes: Set<Node<any>>, handle: number]>()
  private readonly nodeTimeoutBucket = new Map<Node<any>, number>()
  private disposed = false

  get<A>(rx: Rx.Rx<A>): A {
    return this.ensureNode(rx).value()
  }

  set<R, W>(rx: Rx.Writable<R, W>, value: W): void {
    rx.write(this.ensureNode(rx).writeContext, value)
  }

  refresh = <A>(rx: Rx.Rx<A>): void => {
    if (rx.refresh !== undefined) {
      rx.refresh(this.refresh)
    } else {
      this.invalidateRx(rx)
    }
  }

  subscribe<A>(rx: Rx.Rx<A>, f: (_: A) => void, options?: { readonly immediate?: boolean }): () => void {
    const node = this.ensureNode(rx)
    if (options?.immediate) {
      f(node.value())
    }
    const remove = node.subscribe(function() {
      f(node._value)
    })
    return () => {
      remove()
      if (node.canBeRemoved) {
        this.scheduleNodeRemoval(node)
      }
    }
  }

  mount<A>(rx: Rx.Rx<A>) {
    return this.subscribe(rx, constListener, constImmediate)
  }

  ensureNode<A>(rx: Rx.Rx<A>): Node<A> {
    let node = this.nodes.get(rx)
    if (node === undefined) {
      node = this.createNode(rx)
      this.nodes.set(rx, node)
    } else if (rx.autoDispose && rx.idleTTL) {
      this.removeNodeTimeout(node)
    }
    return node
  }

  createNode<A>(rx: Rx.Rx<A>): Node<A> {
    if (this.disposed) {
      throw new Error(`Cannot access Rx ${rx}: registry is disposed`)
    }

    if (rx.autoDispose) {
      this.scheduleRxRemoval(rx)
    }
    return new Node(this, rx)
  }

  invalidateRx = <A>(rx: Rx.Rx<A>): void => {
    this.ensureNode(rx).invalidate()
  }

  scheduleRxRemoval(rx: Rx.Rx<any>): void {
    this.scheduleTask(() => {
      const node = this.nodes.get(rx)
      if (node !== undefined && node.canBeRemoved) {
        this.removeNode(node)
      }
    })
  }

  scheduleNodeRemoval(node: Node<any>): void {
    this.scheduleTask(() => {
      if (node.canBeRemoved) {
        this.removeNode(node)
      }
    })
  }

  removeNode(node: Node<any>): void {
    if (node.rx.idleTTL) {
      this.setNodeTimeout(node)
    } else {
      this.nodes.delete(node.rx)
      node.remove()
    }
  }

  setNodeTimeout(node: Node<any>): void {
    if (this.nodeTimeoutBucket.has(node)) {
      return
    }

    const ttl = Math.ceil(node.rx.idleTTL! / this.timeoutResolution) * this.timeoutResolution
    const timestamp = Date.now() + ttl
    const bucket = timestamp - (timestamp % this.timeoutResolution) + this.timeoutResolution

    let entry = this.timeoutBuckets.get(bucket)
    if (entry === undefined) {
      entry = [
        new Set<Node<any>>(),
        setTimeout(() => this.sweepBucket(bucket), bucket - Date.now())
      ]
      this.timeoutBuckets.set(bucket, entry)
    }
    entry[0].add(node)
    this.nodeTimeoutBucket.set(node, bucket)
  }

  removeNodeTimeout(node: Node<any>): void {
    const bucket = this.nodeTimeoutBucket.get(node)
    if (bucket === undefined) {
      return
    }
    this.nodeTimeoutBucket.delete(node)
    this.scheduleNodeRemoval(node)

    const [nodes, handle] = this.timeoutBuckets.get(bucket)!
    nodes.delete(node)
    if (nodes.size === 0) {
      clearTimeout(handle)
      this.timeoutBuckets.delete(bucket)
    }
  }

  sweepBucket(bucket: number): void {
    const nodes = this.timeoutBuckets.get(bucket)![0]
    this.timeoutBuckets.delete(bucket)

    nodes.forEach((node) => {
      if (!node.canBeRemoved) {
        return
      }
      this.nodeTimeoutBucket.delete(node)
      this.nodes.delete(node.rx)
      node.remove()
    })
  }
}

const enum NodeFlags {
  alive = 1 << 0,
  initialized = 1 << 1,
  waitingForValue = 1 << 2,
  notified = 1 << 3
}

const enum NodeState {
  uninitialized = NodeFlags.alive | NodeFlags.waitingForValue,
  removed = 0
}

class Node<A> {
  constructor(
    readonly registry: RegistryImpl,
    readonly rx: Rx.Rx<A>
  ) {
    this.writeContext = new WriteContextImpl(registry, this)
  }

  state: NodeState = NodeState.uninitialized
  lifetime: Lifetime<A> | undefined
  writeContext: WriteContextImpl<A>

  parents: Array<Node<any>> = []
  previousParents: Array<Node<any>> | undefined
  children: Array<Node<any>> = []
  listeners: Array<() => void> = []

  get canBeRemoved(): boolean {
    return this.rx.autoDispose && this.listeners.length === 0 && this.children.length === 0 &&
      this.state !== 0
  }

  get debugFlags() {
    return {
      alive: (this.state & NodeFlags.alive) !== 0,
      initialized: (this.state & NodeFlags.initialized) !== 0,
      waitingForValue: (this.state & NodeFlags.waitingForValue) !== 0,
      notified: (this.state & NodeFlags.notified) !== 0
    }
  }

  _value: A = undefined as any
  value(): A {
    if ((this.state & NodeFlags.waitingForValue) !== 0) {
      this.lifetime = makeLifetime(this)
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

  setValue(value: A): void {
    if ((this.state & NodeFlags.initialized) === 0) {
      this.state |= NodeFlags.initialized
      this.state &= ~NodeFlags.waitingForValue
      this._value = value

      if (batchState.phase !== BatchPhase.collect) {
        this.notify()
      }

      return
    }

    this.state &= ~NodeFlags.waitingForValue
    if (Equal.equals(this._value, value)) {
      return
    }
    this.state &= ~NodeFlags.notified

    this._value = value
    this.invalidateChildren()

    if (batchState.phase !== BatchPhase.collect) {
      this.notify()
    }
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
    const hadFinalizers = this.lifetime !== undefined && this.lifetime.hasFinalizers
    if ((this.state & NodeFlags.waitingForValue) === 0) {
      this.state |= NodeFlags.waitingForValue
      this.disposeLifetime()
    }

    if (batchState.phase === BatchPhase.collect) {
      batchState.stale.push([this, hadFinalizers])
      this.invalidateChildren()
      if (!hadFinalizers) {
        this.state &= ~NodeFlags.notified
      }
    } else if (hadFinalizers) {
      this.value()
    } else {
      this.invalidateChildren()
      this.state &= ~NodeFlags.notified
      this.notify()
    }
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
    if ((this.state & NodeFlags.notified) !== 0) {
      return
    }
    this.state |= NodeFlags.notified
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
    this.state = NodeState.removed
    this.listeners = []

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

interface Lifetime<A> extends Rx.Context {
  readonly node: Node<A>
  readonly hasFinalizers: boolean
  finalizers: Array<() => void> | undefined
  disposed: boolean
  readonly dispose: () => void
}

const disposedError = (rx: Rx.Rx<any>): Error => new Error(`Cannot use context of disposed Rx: ${rx}`)

const LifetimeProto: Omit<Lifetime<any>, "node" | "finalizers" | "disposed"> = {
  get hasFinalizers() {
    return (this as Lifetime<any>).finalizers !== undefined && (this as Lifetime<any>).finalizers!.length !== 0
  },

  addFinalizer(this: Lifetime<any>, f: () => void): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.finalizers ??= []
    this.finalizers.push(f)
  },

  get<A>(this: Lifetime<any>, rx: Rx.Rx<A>): A {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    const parent = this.node.registry.ensureNode(rx)
    this.node.addParent(parent)
    return parent.value()
  },

  result<A, E>(this: Lifetime<any>, rx: Rx.Rx<Result.Result<A, E>>): Effect.Effect<A, E> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    const result = this.get(rx)
    switch (result._tag) {
      case "Initial": {
        return Effect.never
      }
      case "Failure": {
        return Exit.failCause(result.cause)
      }
      case "Success": {
        return Effect.succeed(result.value)
      }
    }
  },

  some<A>(this: Lifetime<any>, rx: Rx.Rx<Option.Option<A>>): Effect.Effect<A> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    const result = this.get(rx)
    return result._tag === "None" ? Effect.never : Effect.succeed(result.value)
  },

  once<A>(this: Lifetime<any>, rx: Rx.Rx<A>): A {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    return this.node.registry.get(rx)
  },

  self<A>(this: Lifetime<any>): Option.Option<A> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    return this.node.valueOption() as any
  },

  refreshSync<A>(this: Lifetime<any>, rx: Rx.Rx<A> & Rx.Refreshable): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.registry.refresh(rx)
  },

  refresh<A>(this: Lifetime<any>, rx: Rx.Rx<A> & Rx.Refreshable) {
    return Effect.suspend(() => {
      if (this.disposed) {
        return Effect.die(disposedError(this.node.rx))
      }
      this.node.registry.refresh(rx)
      return Effect.void
    })
  },

  refreshSelfSync(this: Lifetime<any>): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.invalidate()
  },

  get refreshSelf() {
    return Effect.suspend(() => {
      if ((this as Lifetime<any>).disposed) {
        return Effect.die(disposedError((this as Lifetime<any>).node.rx))
      }
      ;(this as Lifetime<any>).node.invalidate()
      return Effect.void
    })
  },

  mount<A>(this: Lifetime<any>, rx: Rx.Rx<A>): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.addFinalizer(this.node.registry.mount(rx))
  },

  subscribe<A>(this: Lifetime<any>, rx: Rx.Rx<A>, f: (_: A) => void, options?: {
    readonly immediate?: boolean
  }): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.addFinalizer(this.node.registry.subscribe(rx, f, options))
  },

  setSelfSync<A>(this: Lifetime<any>, a: A): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.setValue(a as any)
  },

  setSelf<A>(this: Lifetime<any>, value: A) {
    return Effect.suspend(() => {
      if (this.disposed) {
        return Effect.die(disposedError(this.node.rx))
      }
      this.node.setValue(value)
      return Effect.void
    })
  },

  setSync<R, W>(this: Lifetime<any>, rx: Rx.Writable<R, W>, value: W): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.registry.set(rx, value)
  },

  set<R, W>(this: Lifetime<any>, rx: Rx.Writable<R, W>, value: W) {
    return Effect.suspend(() => {
      if (this.disposed) {
        return Effect.die(disposedError(this.node.rx))
      }
      this.node.registry.set(rx, value)
      return Effect.void
    })
  },

  stream<A>(this: Lifetime<any>, rx: Rx.Rx<A>, options?: {
    readonly withoutInitialValue?: boolean
    readonly bufferSize?: number
  }) {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }

    return pipe(
      Effect.acquireRelease(
        Queue.bounded<A>(options?.bufferSize ?? 16),
        Queue.shutdown
      ),
      Effect.tap((queue) =>
        Effect.acquireRelease(
          Effect.sync(() => {
            return this.node.registry.subscribe(rx, (_) => {
              Queue.unsafeOffer(queue, _)
            }, { immediate: options?.withoutInitialValue !== true })
          }),
          (cancel) => Effect.sync(cancel)
        )
      ),
      Effect.map((queue) => Stream.fromQueue(queue)),
      Stream.unwrapScoped
    )
  },

  streamResult<A, E>(this: Lifetime<any>, rx: Rx.Rx<Result.Result<A, E>>, options?: {
    readonly withoutInitialValue?: boolean
    readonly bufferSize?: number
  }) {
    return pipe(
      this.stream(rx, options),
      Stream.filter(Result.isNotInitial),
      Stream.flatMap((result) =>
        result._tag === "Success" ? Stream.succeed(result.value) : Stream.failCause(result.cause)
      )
    )
  },

  dispose(this: Lifetime<any>): void {
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

const makeLifetime = <A>(node: Node<A>): Lifetime<A> => {
  function get<A>(rx: Rx.Rx<A>): A {
    if (get.disposed) {
      throw disposedError(rx)
    }
    const parent = node.registry.ensureNode(rx)
    node.addParent(parent)
    return parent.value()
  }
  Object.setPrototypeOf(get, LifetimeProto)
  get.disposed = false
  get.finalizers = undefined
  get.node = node
  return get as any
}

class WriteContextImpl<A> implements Rx.WriteContext<A> {
  constructor(
    readonly registry: RegistryImpl,
    readonly node: Node<A>
  ) {}
  get<A>(rx: Rx.Rx<A>): A {
    return this.registry.get(rx)
  }
  set<R, W>(rx: Rx.Writable<R, W>, value: W) {
    return this.registry.set(rx, value)
  }
  setSelf(value: any) {
    return this.node.setValue(value)
  }
  refreshSelf() {
    return this.node.invalidate()
  }
}

// -----------------------------------------------------------------------------
// batching
// -----------------------------------------------------------------------------

/** @internal */
export const enum BatchPhase {
  disabled,
  collect,
  commit
}

/** @internal */
export const batchState = globalValue("@effect-rx/rx/Registry/batchState", () => ({
  phase: BatchPhase.disabled,
  depth: 0,
  stale: [] as Array<[Node<any>, hadFinalizers: boolean]>
}))

/** @internal */
export function batch(f: () => void): void {
  batchState.phase = BatchPhase.collect
  batchState.depth++
  try {
    f()
    if (batchState.depth === 1) {
      batchState.phase = BatchPhase.commit
      for (let i = 0; i < batchState.stale.length; i++) {
        const [node, hadFinalizers] = batchState.stale[i]
        batchRebuildNode(node, hadFinalizers)
      }
    }
  } finally {
    batchState.depth--
    if (batchState.depth === 0) {
      batchState.phase = BatchPhase.disabled
      batchState.stale = []
    }
  }
}

function batchRebuildNode(node: Node<any>, hadFinalizers: boolean) {
  if ((node.state & NodeFlags.waitingForValue) === 0) {
    return
  }

  for (let i = 0; i < node.parents.length; i++) {
    const parent = node.parents[i]
    if ((parent.state & NodeFlags.waitingForValue) === 0) {
      batchRebuildNode(parent, false)
    }
  }

  // @ts-ignore
  if ((node.state & NodeFlags.waitingForValue) !== 0) {
    if (hadFinalizers) {
      node.value()
    } else {
      node.invalidateChildren()
      node.notify()
    }
  }
}
