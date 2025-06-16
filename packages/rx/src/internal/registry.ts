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
  readonly defaultIdleTTL?: number | undefined
}): Registry.Registry =>
  new RegistryImpl(
    options?.initialValues,
    options?.scheduleTask,
    options?.timeoutResolution,
    options?.defaultIdleTTL
  )

class RegistryImpl implements Registry.Registry {
  readonly [TypeId]: Registry.TypeId
  readonly timeoutResolution: number

  constructor(
    initialValues?: Iterable<readonly [Rx.Rx<any>, any]>,
    readonly scheduleTask = (cb: () => void): void => queueMicrotask(cb),
    timeoutResolution?: number,
    readonly defaultIdleTTL?: number
  ) {
    this[TypeId] = TypeId
    if (timeoutResolution === undefined && defaultIdleTTL !== undefined) {
      this.timeoutResolution = Math.round(defaultIdleTTL / 2)
    } else {
      this.timeoutResolution = timeoutResolution ?? 1000
    }
    if (initialValues !== undefined) {
      for (const [rx, value] of initialValues) {
        this.ensureNode(rx).setValue(value)
      }
    }
  }

  readonly nodes = new Map<Rx.Rx<any>, Node<any>>()
  readonly timeoutBuckets = new Map<number, readonly [nodes: Set<Node<any>>, handle: number]>()
  readonly nodeTimeoutBucket = new Map<Node<any>, number>()
  disposed = false

  get<A>(rx: Rx.Rx<A>): A {
    return this.ensureNode(rx).value()
  }

  set<R, W>(rx: Rx.Writable<R, W>, value: W): void {
    rx.write(this.ensureNode(rx).writeContext, value)
  }

  modify<R, W, A>(rx: Rx.Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]): A {
    const node = this.ensureNode(rx)
    const result = f(node.value())
    rx.write(node.writeContext, result[1])
    return result[0]
  }

  update<R, W>(rx: Rx.Writable<R, W>, f: (_: R) => W): void {
    const node = this.ensureNode(rx)
    rx.write(node.writeContext, f(node.value()))
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

  rxHasTTL(rx: Rx.Rx<any>): boolean {
    return !rx.keepAlive && rx.idleTTL !== 0 && (rx.idleTTL !== undefined || this.defaultIdleTTL !== undefined)
  }

  ensureNode<A>(rx: Rx.Rx<A>): Node<A> {
    let node = this.nodes.get(rx)
    if (node === undefined) {
      node = this.createNode(rx)
      this.nodes.set(rx, node)
    } else if (this.rxHasTTL(rx)) {
      this.removeNodeTimeout(node)
    }
    return node
  }

  createNode<A>(rx: Rx.Rx<A>): Node<A> {
    if (this.disposed) {
      throw new Error(`Cannot access Rx ${rx}: registry is disposed`)
    }

    if (!rx.keepAlive) {
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
    if (this.rxHasTTL(node.rx)) {
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

    let idleTTL = node.rx.idleTTL ?? this.defaultIdleTTL!
    if (this.#currentSweepTTL !== null) {
      idleTTL -= this.#currentSweepTTL
      if (idleTTL <= 0) {
        this.nodes.delete(node.rx)
        node.remove()
        return
      }
    }
    const ttl = Math.ceil(idleTTL! / this.timeoutResolution) * this.timeoutResolution
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

  #currentSweepTTL: number | null = null
  sweepBucket(bucket: number): void {
    const nodes = this.timeoutBuckets.get(bucket)![0]
    this.timeoutBuckets.delete(bucket)

    nodes.forEach((node) => {
      if (!node.canBeRemoved) {
        return
      }
      this.nodeTimeoutBucket.delete(node)
      this.nodes.delete(node.rx)
      this.#currentSweepTTL = node.rx.idleTTL ?? this.defaultIdleTTL!
      node.remove()
      this.#currentSweepTTL = null
    })
  }

  reset(): void {
    this.timeoutBuckets.forEach(([, handle]) => clearTimeout(handle))
    this.timeoutBuckets.clear()
    this.nodeTimeoutBucket.clear()

    this.nodes.forEach((node) => node.remove())
    this.nodes.clear()
  }

  dispose(): void {
    this.disposed = true
    this.reset()
  }
}

const enum NodeFlags {
  alive = 1 << 0,
  initialized = 1 << 1,
  waitingForValue = 1 << 2
}

const enum NodeState {
  uninitialized = NodeFlags.alive | NodeFlags.waitingForValue,
  stale = NodeFlags.alive | NodeFlags.initialized | NodeFlags.waitingForValue,
  valid = NodeFlags.alive | NodeFlags.initialized,
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
  skipInvalidation = false

  get canBeRemoved(): boolean {
    return !this.rx.keepAlive && this.listeners.length === 0 && this.children.length === 0 &&
      this.state !== 0
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
      this.state = NodeState.valid
      this._value = value

      if (batchState.phase !== BatchPhase.collect) {
        this.notify()
      }

      return
    }

    this.state = NodeState.valid
    if (Equal.equals(this._value, value)) {
      return
    }

    this._value = value
    if (this.skipInvalidation) {
      this.skipInvalidation = false
    } else {
      this.invalidateChildren()
    }

    if (this.listeners.length > 0) {
      if (batchState.phase === BatchPhase.collect) {
        batchState.notify.add(this)
      } else {
        this.notify()
      }
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
    if (this.state === NodeState.valid) {
      this.state = NodeState.stale
      this.disposeLifetime()
    }

    if (batchState.phase === BatchPhase.collect) {
      batchState.stale.push(this)
    } else if (this.rx.lazy && this.listeners.length === 0 && !childrenAreActive(this.children)) {
      this.invalidateChildren()
      this.skipInvalidation = true
    } else {
      this.value()
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
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]()
    }

    if (batchState.phase === BatchPhase.commit) {
      batchState.notify.delete(this)
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

function childrenAreActive(children: Array<Node<any>>): boolean {
  if (children.length === 0) {
    return false
  }
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i]
    if (!child.rx.lazy || child.listeners.length > 0) {
      return true
    }
  }
  for (let i = 0, len = children.length; i < len; i++) {
    if (childrenAreActive(children[i].children)) {
      return true
    }
  }
  return false
}

interface Lifetime<A> extends Rx.Context {
  isFn: boolean
  readonly node: Node<A>
  finalizers: Array<() => void> | undefined
  disposed: boolean
  readonly dispose: () => void
}

const disposedError = (rx: Rx.Rx<any>): Error => new Error(`Cannot use context of disposed Rx: ${rx}`)

const LifetimeProto: Omit<Lifetime<any>, "node" | "finalizers" | "disposed" | "isFn"> = {
  get registry(): RegistryImpl {
    return (this as Lifetime<any>).node.registry
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

  result<A, E>(this: Lifetime<any>, rx: Rx.Rx<Result.Result<A, E>>, options?: {
    readonly suspendOnWaiting?: boolean | undefined
  }): Effect.Effect<A, E> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    } else if (this.isFn) {
      return this.resultOnce(rx)
    }
    const result = this.get(rx)
    if (options?.suspendOnWaiting && result.waiting) {
      return Effect.never
    }
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

  resultOnce<A, E>(this: Lifetime<any>, rx: Rx.Rx<Result.Result<A, E>>, options?: {
    readonly suspendOnWaiting?: boolean | undefined
  }): Effect.Effect<A, E> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    return Effect.async<A, E>((resume) => {
      const result = this.once(rx)
      if (result._tag !== "Initial" && !(options?.suspendOnWaiting && result.waiting)) {
        return resume(Result.toExit(result) as any)
      }
      const cancel = this.node.registry.subscribe(rx, (result) => {
        if (result._tag === "Initial" || (options?.suspendOnWaiting && result.waiting)) return
        cancel()
        resume(Result.toExit(result) as any)
      }, { immediate: false })
      return Effect.sync(cancel)
    })
  },

  some<A>(this: Lifetime<any>, rx: Rx.Rx<Option.Option<A>>): Effect.Effect<A> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    } else if (this.isFn) {
      return this.someOnce(rx)
    }
    const result = this.get(rx)
    return result._tag === "None" ? Effect.never : Effect.succeed(result.value)
  },

  someOnce<A>(this: Lifetime<any>, rx: Rx.Rx<Option.Option<A>>): Effect.Effect<A> {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    return Effect.async<A>((resume) => {
      const result = this.once(rx)
      if (Option.isSome(result)) {
        return resume(Effect.succeed(result.value))
      }
      const cancel = this.node.registry.subscribe(rx, (result) => {
        if (Option.isNone(result)) return
        cancel()
        resume(Effect.succeed(result.value))
      }, { immediate: false })
      return Effect.sync(cancel)
    })
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

  refresh<A>(this: Lifetime<any>, rx: Rx.Rx<A> & Rx.Refreshable): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.registry.refresh(rx)
  },

  refreshSelf(this: Lifetime<any>): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.invalidate()
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

  setSelf<A>(this: Lifetime<any>, a: A): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.setValue(a as any)
  },

  set<R, W>(this: Lifetime<any>, rx: Rx.Writable<R, W>, value: W): void {
    if (this.disposed) {
      throw disposedError(this.node.rx)
    }
    this.node.registry.set(rx, value)
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
  }): Stream.Stream<A, E> {
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
    } else if (get.isFn) {
      return node.registry.get(rx)
    }
    const parent = node.registry.ensureNode(rx)
    node.addParent(parent)
    return parent.value()
  }
  Object.setPrototypeOf(get, LifetimeProto)
  get.isFn = false
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
  stale: [] as Array<Node<any>>,
  notify: new Set<Node<any>>()
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
        batchRebuildNode(batchState.stale[i])
      }
      for (const node of batchState.notify) {
        node.notify()
      }
      batchState.notify.clear()
    }
  } finally {
    batchState.depth--
    if (batchState.depth === 0) {
      batchState.phase = BatchPhase.disabled
      batchState.stale = []
    }
  }
}

function batchRebuildNode(node: Node<any>) {
  if (node.state === NodeState.valid) {
    return
  }

  for (let i = 0; i < node.parents.length; i++) {
    const parent = node.parents[i]
    if (parent.state !== NodeState.valid) {
      batchRebuildNode(parent)
    }
  }

  // @ts-ignore
  if (node.state !== NodeState.valid) {
    node.value()
  }
}
