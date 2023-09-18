import * as Effect from "@effect/io/Effect"
import * as Queue from "@effect/io/Queue"
import * as Registry from "@effect/rx/Registry"
import * as Rx from "@effect/rx/Rx"

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

  it("queue", async () => {
    const counter = Rx.state(0)
    const r = Registry.make()

    await Effect.gen(function*(_) {
      const q = yield* _(r.queue(counter))
      expect(yield* _(Queue.take(q))).toEqual(0)
      r.set(counter, 1)
      expect(yield* _(Queue.take(q))).toEqual(1)
      yield* _(Effect.yieldNow())
      expect(r.get(counter)).toEqual(1)
    }).pipe(
      Effect.scoped,
      Effect.runPromise
    )
    expect(r.get(counter)).toEqual(0)
  })
})
