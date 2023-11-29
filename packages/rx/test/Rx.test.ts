import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import { Cause, FiberRef } from "effect"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Hash from "effect/Hash"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Stream from "effect/Stream"
import { afterEach, assert, beforeEach, describe, expect, it, vi, vitest } from "vitest"

describe("Rx", () => {
  beforeEach(() => {
    vitest.useFakeTimers()
  })
  afterEach(() => {
    vitest.useRealTimers()
  })

  it("get/set", () => {
    const counter = Rx.make(0)
    const r = Registry.make()
    expect(r.get(counter)).toEqual(0)
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
  })

  it("keepAlive false", async () => {
    const counter = Rx.make(0)
    const r = Registry.make()
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
    await new Promise((resolve) => resolve(null))
    expect(r.get(counter)).toEqual(0)
  })

  it("keepAlive true", async () => {
    const counter = Rx.make(0).pipe(
      Rx.keepAlive
    )
    const r = Registry.make()
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
    await new Promise((resolve) => resolve(null))
    expect(r.get(counter)).toEqual(1)
  })

  it("subscribe", async () => {
    const counter = Rx.make(0)
    const r = Registry.make()
    let count = 0
    const cancel = r.subscribe(counter, (_) => {
      count = _
    })
    r.set(counter, 1)
    expect(count).toEqual(1)
    await new Promise((resolve) => resolve(null))

    expect(r.get(counter)).toEqual(1)
    cancel()
    await new Promise((resolve) => resolve(null))
    expect(r.get(counter)).toEqual(0)
  })

  it("runtime", async () => {
    const count = counterRuntime.rx(Effect.flatMap(Counter, (_) => _.get))
    const r = Registry.make()
    const result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(1)
  })

  it("runtime multiple", async () => {
    const count = counterRuntime.rx(Effect.flatMap(Counter, (_) => _.get))
    const timesTwo = multiplierRuntime.rx((get) =>
      Effect.gen(function*(_) {
        const counter = yield* _(Counter)
        const multiplier = yield* _(Multiplier)
        yield* _(counter.inc)
        expect(yield* _(get.result(count))).toEqual(2)
        return yield* _(multiplier.times(2))
      })
    )
    const r = Registry.make()
    let result = r.get(timesTwo)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(4)

    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)

    await new Promise((resolve) => resolve(null))

    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(1)
  })

  it("runtime fiber ref", async () => {
    const caching = fiberRefRuntime.rx(FiberRef.get(FiberRef.currentRequestCacheEnabled))
    const r = Registry.make()
    const result = r.get(caching)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(true)
  })

  it("effect initial", async () => {
    const count = Rx.make(
      Effect.succeed(1).pipe(Effect.delay(100)),
      { initialValue: 0 }
    ).pipe(Rx.keepAlive)
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isSuccess(result))
    assert.strictEqual(result.value, 0)

    await vitest.advanceTimersByTimeAsync(100)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(1)
  })

  it("effectFn", async () => {
    const count = Rx.fn((n: number) => Effect.succeed(n + 1))
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isInitial(result))
    r.set(count, 1)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)
  })

  it("effectFn initial", async () => {
    const count = Rx.fn((n: number) => Effect.succeed(n + 1), {
      initialValue: 0
    })
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isSuccess(result))
    assert.strictEqual(result.value, 0)
    r.set(count, 1)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)
  })

  it("effect mapResult", async () => {
    const count = Rx.fn((n: number) => Effect.succeed(n + 1)).pipe(
      Rx.mapResult((_) => _ + 1)
    )
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isInitial(result))
    r.set(count, 1)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(3)
  })

  it("effect double mapResult", async () => {
    const seed = Rx.make(0)
    const count = Rx.make((get) => Effect.succeed(get(seed) + 1)).pipe(
      Rx.mapResult((_) => _ + 10),
      Rx.mapResult((_) => _ + 100)
    )
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(111)
    r.set(seed, 1)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(112)
  })

  it("effect double mapResult refresh", async () => {
    let rebuilds = 0
    const count = Rx.make(() => {
      rebuilds++
      return Effect.succeed(1)
    }).pipe(
      Rx.mapResult((_) => _ + 10),
      Rx.mapResult((_) => _ + 100),
      Rx.refreshable
    )
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(111)
    expect(rebuilds).toEqual(1)
    r.refresh(count)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(111)
    expect(rebuilds).toEqual(2)
  })

  it("scopedFn", async () => {
    let finalized = 0
    const count = Rx.fn((n: number) =>
      Effect.succeed(n + 1).pipe(
        Effect.zipLeft(
          Effect.addFinalizer(() =>
            Effect.sync(() => {
              finalized++
            })
          )
        )
      )
    ).pipe(Rx.keepAlive)
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isInitial(result))

    await new Promise((resolve) => resolve(null))
    expect(finalized).toEqual(0)

    r.set(count, 1)
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)

    r.set(count, 2)
    await new Promise((resolve) => resolve(null))
    expect(finalized).toEqual(1)
  })

  it("stream", async () => {
    const count = Rx.make(
      Stream.range(0, 2).pipe(
        Stream.tap(() => Effect.sleep(50))
      )
    )
    const r = Registry.make()
    const unmount = r.mount(count)
    let result = r.get(count)
    assert(result.waiting)
    assert(Result.isInitial(result))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 0)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 1)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 2)

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isInitial(result))
  })

  it("stream initial", async () => {
    const count = Rx.make(
      Stream.range(1, 2).pipe(
        Stream.tap(() => Effect.sleep(50))
      ),
      { initialValue: 0 }
    )
    const r = Registry.make()
    const unmount = r.mount(count)
    let result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.strictEqual(result.value, 0)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 1)

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
  })

  it("streamFn", async () => {
    const count = Rx.fn((start: number) =>
      Stream.range(start, start + 1).pipe(
        Stream.tap(() => Effect.sleep(50))
      )
    )
    const r = Registry.make()
    const unmount = r.mount(count)
    let result = r.get(count)
    assert.strictEqual(result._tag, "Initial")

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert.strictEqual(result._tag, "Initial")

    r.set(count, 1)
    result = r.get(count)
    assert(result.waiting)
    assert.strictEqual(result._tag, "Initial")

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 1)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 2)

    r.set(count, 5)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 2)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 5)

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, 6)

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(Result.isInitial(result))
  })

  it("pull", async () => {
    const count = Rx.pull(
      Stream.range(0, 1, 1).pipe(
        Stream.tap(() => Effect.sleep(50))
      )
    ).pipe(Rx.refreshable)
    const r = Registry.make()
    const unmount = r.mount(count)

    let result = r.get(count)
    assert(result.waiting)
    assert(Option.isNone(Result.value(result)))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [0] })

    r.set(count, void 0)
    result = r.get(count)
    assert(result.waiting)
    assert.deepEqual(Result.value(result), Option.some({ done: false, items: [0] }))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [0, 1] })

    r.set(count, void 0)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: true, items: [0, 1] })

    r.refresh(count)
    result = r.get(count)
    assert(result.waiting)
    assert.deepEqual(Result.value(result), Option.some({ done: true, items: [0, 1] }))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [0] })

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(result.waiting)
    assert(Option.isNone(Result.value(result)))
  })

  it("pull runtime", async () => {
    const count = counterRuntime.pull(
      Counter.pipe(
        Effect.flatMap((_) => _.get),
        Effect.map((_) => Stream.range(_, 2, 1)),
        Stream.unwrap,
        Stream.tap(() => Effect.sleep(50))
      )
    ).pipe(Rx.refreshable)
    const r = Registry.make()
    const unmount = r.mount(count)

    let result = r.get(count)
    assert(result.waiting)
    assert(Option.isNone(Result.value(result)))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [1] })

    r.set(count, void 0)
    result = r.get(count)
    assert(result.waiting)
    assert.deepEqual(Result.value(result), Option.some({ done: false, items: [1] }))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [1, 2] })

    r.set(count, void 0)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: true, items: [1, 2] })

    r.refresh(count)
    result = r.get(count)
    assert(result.waiting)
    assert.deepEqual(Result.value(result), Option.some({ done: true, items: [1, 2] }))

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [1] })

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(result.waiting)
    assert(Option.isNone(Result.value(result)))
  })

  it("pull initial", async () => {
    const count = Rx.pull(() =>
      Stream.range(1, 2, 1).pipe(
        Stream.tap(() => Effect.sleep(50))
      ), { initialValue: [0] }).pipe(Rx.refreshable)
    const r = Registry.make()
    const unmount = r.mount(count)

    let result = r.get(count)
    assert(result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [0] })

    await vitest.advanceTimersByTimeAsync(50)
    result = r.get(count)
    assert(!result.waiting)
    assert(Result.isSuccess(result))
    assert.deepEqual(result.value, { done: false, items: [1] })

    unmount()
    await new Promise((resolve) => resolve(null))
    result = r.get(count)
    assert(result.waiting)
  })

  it("family", async () => {
    const r = Registry.make()

    const count = Rx.family((n: number) => Rx.make(n))
    const hash = Hash.hash(count(1))
    assert.strictEqual(count(1), count(1))
    r.set(count(1), 2)
    assert.strictEqual(r.get(count(1)), 2)

    const countKeep = Rx.family((n: number) => Rx.make(n).pipe(Rx.keepAlive))
    assert.strictEqual(countKeep(1), countKeep(1))
    r.get(countKeep(1))
    const hashKeep = Hash.hash(countKeep(1))

    if (global.gc) {
      vi.useRealTimers()
      await new Promise((resolve) => setTimeout(resolve, 0))
      global.gc()
      assert.notEqual(hash, Hash.hash(count(1)))
      assert.strictEqual(hashKeep, Hash.hash(countKeep(1)))
    }
  })

  it("label", async () => {
    expect(
      Rx.make(0).pipe(Rx.withLabel("counter")).label![1]
    ).toMatch(/Rx.test.ts:\d+:\d+/)
  })

  it("batching", async () => {
    const r = Registry.make()
    const state = Rx.make(1).pipe(Rx.keepAlive)
    const state2 = Rx.make("a").pipe(Rx.keepAlive)
    let count = 0
    const derived = Rx.readable((get) => {
      count++
      return get(state) + get(state2)
    })
    expect(r.get(derived)).toEqual("1a")
    expect(count).toEqual(1)
    Rx.batch(() => {
      r.set(state, 2)
      r.set(state2, "b")
    })
    expect(count).toEqual(2)
    expect(r.get(derived)).toEqual("2b")
  })

  it("nested batch", async () => {
    const r = Registry.make()
    const state = Rx.make(1).pipe(Rx.keepAlive)
    const state2 = Rx.make("a").pipe(Rx.keepAlive)
    let count = 0
    const derived = Rx.readable((get) => {
      count++
      return get(state) + get(state2)
    })
    expect(r.get(derived)).toEqual("1a")
    expect(count).toEqual(1)
    Rx.batch(() => {
      r.set(state, 2)
      Rx.batch(() => {
        r.set(state2, "b")
      })
    })
    expect(count).toEqual(2)
    expect(r.get(derived)).toEqual("2b")
  })

  it("read correct updated state in batch", async () => {
    const r = Registry.make()
    const state = Rx.make(1).pipe(Rx.keepAlive)
    const state2 = Rx.make("a").pipe(Rx.keepAlive)
    let count = 0
    const derived = Rx.readable((get) => {
      count++
      return get(state) + get(state2)
    })
    expect(r.get(derived)).toEqual("1a")
    expect(count).toEqual(1)
    Rx.batch(() => {
      r.set(state, 2)
      expect(r.get(derived)).toEqual("2a")
      r.set(state2, "b")
    })
    expect(count).toEqual(3)
    expect(r.get(derived)).toEqual("2b")
    expect(count).toEqual(3)
  })

  it("notifies listeners after batch commit", async () => {
    const r = Registry.make()
    const state = Rx.make(1).pipe(Rx.keepAlive)
    const state2 = Rx.make("a").pipe(Rx.keepAlive)
    let count = 0
    const derived = Rx.readable((get) => {
      return get(state) + get(state2)
    })
    r.subscribe(derived, () => {
      count++
    })
    Rx.batch(() => {
      r.get(derived)
      r.set(state, 2)
      r.get(derived)
      r.set(state2, "b")
    })
    expect(count).toEqual(1)
    expect(r.get(derived)).toEqual("2b")
  })

  it("initialValues", async () => {
    const state = Rx.make(0)
    const r = Registry.make({
      initialValues: [
        Rx.initialValue(state, 10)
      ]
    })
    expect(r.get(state)).toEqual(10)
    await new Promise((resolve) => resolve(null))
    expect(r.get(state)).toEqual(0)
  })

  it("idleTTL", async () => {
    const state = Rx.make(0).pipe(
      Rx.setIdleTTL(2000)
    )
    const state2 = Rx.make(0).pipe(
      Rx.setIdleTTL(10000)
    )
    const state3 = Rx.make(0).pipe(
      Rx.setIdleTTL(3000)
    )
    const r = Registry.make()
    r.set(state, 10)
    r.set(state2, 10)
    r.set(state3, 10)
    expect(r.get(state)).toEqual(10)
    expect(r.get(state2)).toEqual(10)
    expect(r.get(state3)).toEqual(10)
    await new Promise((resolve) => resolve(null))
    expect(r.get(state)).toEqual(10)
    expect(r.get(state2)).toEqual(10)
    expect(r.get(state3)).toEqual(10)

    await new Promise((resolve) => resolve(null))
    await vitest.advanceTimersByTimeAsync(10000)
    expect(r.get(state)).toEqual(0)
    expect(r.get(state2)).toEqual(10)
    expect(r.get(state3)).toEqual(0)

    await new Promise((resolve) => resolve(null))
    await vitest.advanceTimersByTimeAsync(20000)
    expect(r.get(state)).toEqual(0)
    expect(r.get(state2)).toEqual(0)
    expect(r.get(state3)).toEqual(0)
  })

  it("fn", async () => {
    const count = Rx.fnSync((n: number) => n).pipe(Rx.keepAlive)
    const r = Registry.make()
    assert.deepEqual(r.get(count), Option.none())

    r.set(count, 1)
    assert.deepEqual(r.get(count), Option.some(1))
  })

  it("fn initial", async () => {
    const count = Rx.fnSync((n: number) => n, { initialValue: 0 })
    const r = Registry.make()
    assert.deepEqual(r.get(count), 0)

    r.set(count, 1)
    assert.deepEqual(r.get(count), 1)
  })

  it("withFallback", async () => {
    const count = Rx.make(() =>
      Effect.succeed(1).pipe(
        Effect.delay(100)
      )
    ).pipe(
      Rx.withFallback(Rx.make(() => Effect.succeed(0))),
      Rx.keepAlive
    )
    const r = Registry.make()
    assert.deepEqual(r.get(count), Result.waiting(Result.success(0)))

    await vitest.advanceTimersByTimeAsync(100)
    assert.deepEqual(r.get(count), Result.success(1))
  })

  it("failure with previousValue", async () => {
    const count = Rx.fn((i: number) => i === 1 ? Effect.fail("fail") : Effect.succeed(i))
    const r = Registry.make()

    let result = r.get(count)
    assert(Result.isInitial(result))

    r.set(count, 0)
    result = r.get(count)
    assert(Result.isSuccess(result))
    assert.strictEqual(result.value, 0)

    r.set(count, 1)
    result = r.get(count)
    assert(Result.isFailure(result))
    assert(Cause.isFailType(result.cause))
    assert.strictEqual(result.cause.error, "fail")

    const value = Result.value(result)
    assert(Option.isSome(value))
    assert.strictEqual(value.value, 0)
  })
})

interface Counter {
  readonly get: Effect.Effect<never, never, number>
  readonly inc: Effect.Effect<never, never, void>
}
const Counter = Context.Tag<Counter>("Counter")
const CounterLive = Layer.sync(Counter, () => {
  let count = 1
  return Counter.of({
    get: Effect.sync(() => count),
    inc: Effect.sync(() => {
      count++
    })
  })
})

interface Multiplier {
  readonly times: (n: number) => Effect.Effect<never, never, number>
}
const Multiplier = Context.Tag<Multiplier>("Multiplier")
const MultiplierLive = Layer.effect(
  Multiplier,
  Effect.gen(function*(_) {
    const counter = yield* _(Counter)
    return Multiplier.of({
      times: (n) => Effect.map(counter.get, (_) => _ * n)
    })
  })
)

const counterRuntime = Rx.make(CounterLive)
const multiplierRuntime = counterRuntime.rx(MultiplierLive)
const fiberRefRuntime = counterRuntime.rx(Layer.setRequestCaching(true))
