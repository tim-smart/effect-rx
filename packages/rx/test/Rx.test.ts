import * as Registry from "@effect-rx/rx/Registry"
import * as Result from "@effect-rx/rx/Result"
import * as Rx from "@effect-rx/rx/Rx"
import * as Context from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"

describe("Rx", () => {
  it("get/set", () => {
    const counter = Rx.state(0)
    const r = Registry.make()
    expect(r.get(counter)).toEqual(0)
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
  })

  it("keepAlive false", async () => {
    const counter = Rx.state(0)
    const r = Registry.make()
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.get(counter)).toEqual(0)
  })

  it("keepAlive true", async () => {
    const counter = Rx.state(0).pipe(
      Rx.keepAlive
    )
    const r = Registry.make()
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.get(counter)).toEqual(1)
  })

  it("subscribe", async () => {
    const counter = Rx.state(0)
    const r = Registry.make()
    let count = 0
    const cancel = r.subscribe(counter, (_) => {
      count = _
    })
    r.set(counter, 1)
    expect(count).toEqual(1)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.get(counter)).toEqual(1)
    cancel()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.get(counter)).toEqual(0)
  })

  it("runtime", async () => {
    const count = Rx.effect(
      Effect.flatMap(Counter, (_) => _.get),
      counterRuntime
    )
    const r = Registry.make()
    const result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(1)
  })

  it("runtime multiple", async () => {
    const count = Rx.effect(
      Effect.flatMap(Counter, (_) => _.get),
      counterRuntime
    )
    const timesTwo = Rx.effect(
      Effect.gen(function*(_) {
        const counter = yield* _(Counter)
        const multiplier = yield* _(Multiplier)
        yield* _(counter.inc)
        expect(yield* _(Rx.accessResult(count))).toEqual(2)
        return yield* _(multiplier.times(2))
      }),
      multiplierRuntime
    )
    const r = Registry.make()
    let result = r.get(timesTwo)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(4)

    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)

    await new Promise((resolve) => setTimeout(resolve, 0))

    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(1)
  })

  it("effectFn", async () => {
    const count = Rx.effectFn((n: number) => Effect.succeed(n + 1))
    const r = Registry.make()
    let result = r.get(count)
    assert(Result.isInitial(result))
    r.set(count, [1])
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)
  })

  it("scopedFn", async () => {
    let finalized = 0
    const count = Rx.scopedFn((n: number) =>
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

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(finalized).toEqual(0)

    r.set(count, [1])
    result = r.get(count)
    assert(Result.isSuccess(result))
    expect(result.value).toEqual(2)

    r.set(count, [2])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(finalized).toEqual(1)
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

const counterRuntime: Rx.RxRuntime<never, Counter> = Rx.runtime(CounterLive)
const multiplierRuntime: Rx.RxRuntime<never, Multiplier | Counter> = Rx.runtime(MultiplierLive, counterRuntime)
