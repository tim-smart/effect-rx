import * as _ from "@effect-atom/atom/Result"
import { Cause } from "effect"
import { describe, expect, it } from "vitest"

describe("Result", () => {
  it("match", () => {
    const matcher = _.match({
      onInitial: () => "init",
      onFailure: () => "fail",
      onSuccess: (s) => s.value
    })

    expect(matcher(_.initial(false))).toEqual("init")
    expect(matcher(_.failure(Cause.empty))).toEqual("fail")
    expect(matcher(_.success(1))).toEqual(1)
  })
})
