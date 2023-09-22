import * as RxRef from "@effect-rx/rx/RxRef"

describe("RxRef", () => {
  describe("make", () => {
    test("notifies", () => {
      const ref = RxRef.make(0)

      const updates: Array<number> = []
      const cancel = ref.subscribe((_) => updates.push(_))

      ref.set(-1)
      ref.set(-2)
      ref.set(-3)
      ref.set(-3)

      assert.deepEqual(updates, [-1, -2, -3])

      cancel()
      ref.set(0)
      assert.deepEqual(updates, [-1, -2, -3])
    })
  })

  describe("collection", () => {
    test("listens to children", () => {
      const coll = RxRef.collection([1, 2, 3])

      let count = 0
      const cancel = coll.subscribe(() => count++)

      coll.value[0].set(-1)
      coll.value[1].set(-2)
      coll.value[2].set(-3)
      coll.value[2].set(-3)

      expect(count).toBe(3)

      cancel()
      coll.value[0].set(0)
      expect(count).toBe(3)
    })
  })
})
