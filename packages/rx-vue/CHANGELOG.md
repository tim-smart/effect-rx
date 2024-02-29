# @effect-rx/rx-vue

## 0.6.2

### Patch Changes

- [#108](https://github.com/tim-smart/effect-rx/pull/108) [`953ff58`](https://github.com/tim-smart/effect-rx/commit/953ff5845ff38f584091e03bc0a8549b2209d3a0) Thanks [@jessekelly881](https://github.com/jessekelly881)! - added Result.match

- Updated dependencies [[`953ff58`](https://github.com/tim-smart/effect-rx/commit/953ff5845ff38f584091e03bc0a8549b2209d3a0)]:
  - @effect-rx/rx@0.27.2

## 0.6.1

### Patch Changes

- Updated dependencies [[`60259bd`](https://github.com/tim-smart/effect-rx/commit/60259bd692e5a1c6e134fe59e6249a03915170e7)]:
  - @effect-rx/rx@0.27.1

## 0.6.0

### Minor Changes

- [`26ecb98`](https://github.com/tim-smart/effect-rx/commit/26ecb98c2fbff04b9c7786103ca9915909b58d22) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

### Patch Changes

- Updated dependencies [[`26ecb98`](https://github.com/tim-smart/effect-rx/commit/26ecb98c2fbff04b9c7786103ca9915909b58d22)]:
  - @effect-rx/rx@0.27.0

## 0.5.0

### Minor Changes

- [`ec1b66e`](https://github.com/tim-smart/effect-rx/commit/ec1b66e48c826f82087a3c86f60e6b2beb33b6ae) Thanks [@tim-smart](https://github.com/tim-smart)! - swap type params for Result

- [`ec1b66e`](https://github.com/tim-smart/effect-rx/commit/ec1b66e48c826f82087a3c86f60e6b2beb33b6ae) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

### Patch Changes

- Updated dependencies [[`ec1b66e`](https://github.com/tim-smart/effect-rx/commit/ec1b66e48c826f82087a3c86f60e6b2beb33b6ae), [`ec1b66e`](https://github.com/tim-smart/effect-rx/commit/ec1b66e48c826f82087a3c86f60e6b2beb33b6ae)]:
  - @effect-rx/rx@0.26.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`ea179de`](https://github.com/tim-smart/effect-rx/commit/ea179deefabe3ed6063486b4fc470fa75011d729)]:
  - @effect-rx/rx@0.25.3

## 0.4.2

### Patch Changes

- Updated dependencies [[`bd7f6ba`](https://github.com/tim-smart/effect-rx/commit/bd7f6ba4eefec3b0bb96f50c184531959f4b1c13)]:
  - @effect-rx/rx@0.25.2

## 0.4.1

### Patch Changes

- Updated dependencies [[`63f1727`](https://github.com/tim-smart/effect-rx/commit/63f172702d13909f61892465939db63af4f7c763)]:
  - @effect-rx/rx@0.25.1

## 0.4.0

### Minor Changes

- [`3448c4a`](https://github.com/tim-smart/effect-rx/commit/3448c4abca718d5c87a50da9c189e90e7f4f76b4) Thanks [@tim-smart](https://github.com/tim-smart)! - add Rx.runtime api

  Instead of creating a RuntimeRx by using Rx.make, it is now done explicitly
  using the Rx.runtime api.

  ```ts
  const runtimeRx = Rx.runtime(MyLayer);
  ```

  It also exposes a .layer rx, which can be used to inject test layers:

  ```ts
  const registry = Registry.make({
    initialValues: [Rx.initialValue(runtimeRx.layer, MyTestLayer)],
  });

  // .. inject registry into react context etc
  ```

### Patch Changes

- Updated dependencies [[`3448c4a`](https://github.com/tim-smart/effect-rx/commit/3448c4abca718d5c87a50da9c189e90e7f4f76b4)]:
  - @effect-rx/rx@0.25.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`c7612e2`](https://github.com/tim-smart/effect-rx/commit/c7612e2ded6a1f62e1637bb62e41047b52d6949e)]:
  - @effect-rx/rx@0.24.1

## 0.3.0

### Minor Changes

- [`04e8432`](https://github.com/tim-smart/effect-rx/commit/04e8432f3e681f443d4365914241b3b68b31340e) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

### Patch Changes

- Updated dependencies [[`04e8432`](https://github.com/tim-smart/effect-rx/commit/04e8432f3e681f443d4365914241b3b68b31340e)]:
  - @effect-rx/rx@0.24.0

## 0.2.0

### Minor Changes

- [`edcdb24`](https://github.com/tim-smart/effect-rx/commit/edcdb2439c29f89f63c66a2898244441724b1860) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

### Patch Changes

- Updated dependencies [[`edcdb24`](https://github.com/tim-smart/effect-rx/commit/edcdb2439c29f89f63c66a2898244441724b1860)]:
  - @effect-rx/rx@0.23.0

## 0.1.0

### Minor Changes

- [#97](https://github.com/tim-smart/effect-rx/pull/97) [`77ceee0`](https://github.com/tim-smart/effect-rx/commit/77ceee032f3fc4ebcb9c4ac640766570ce62c4af) Thanks [@tim-smart](https://github.com/tim-smart)! - add vue package
