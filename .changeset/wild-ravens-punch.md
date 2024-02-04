---
"@effect-rx/rx": minor
"@effect-rx/rx-react": minor
"@effect-rx/rx-vue": minor
---

add Rx.runtime api

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
