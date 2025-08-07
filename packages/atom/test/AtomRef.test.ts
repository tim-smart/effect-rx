import * as AtomRef from "@effect-atom/atom/AtomRef"
import { assert, describe, expect, test } from "vitest"

describe("AtomRef", () => {
  describe("make", () => {
    test("notifies", () => {
      const ref = AtomRef.make(0)

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

  test("prop", () => {
    const parent = AtomRef.make({
      a: 0,
      b: 1,
      c: 2
    })
    const ref = parent.prop("a")

    const updates: Array<number> = []
    const cancel = ref.subscribe((_) => updates.push(_))

    parent.update((_) => ({ ..._, a: -1 }))
    parent.update((_) => ({ ..._, b: -2 }))

    assert.deepEqual(updates, [-1])

    ref.set(0)

    assert.deepEqual(updates, [-1, 0])
    assert.deepEqual(parent.value, { a: 0, b: -2, c: 2 })

    cancel()
  })

  test("prop nested array", () => {
    const parent = AtomRef.make({
      a: 0,
      b: 1,
      c: {
        d: [{
          e: 2
        }]
      }
    })
    const ref = parent.prop("c").prop("d").prop(0).prop("e")

    const updates: Array<any> = []
    const cancel = parent.subscribe((_) => updates.push(_))

    ref.set(3)

    assert.deepStrictEqual(updates, [{
      a: 0,
      b: 1,
      c: {
        d: [{
          e: 3
        }]
      }
    }])

    cancel()
  })

  describe("collection", () => {
    test("listens to children", () => {
      const coll = AtomRef.collection([1, 2, 3])

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
