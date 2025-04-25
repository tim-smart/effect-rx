---
"@effect-rx/rx": minor
"@effect-rx/rx-react": minor
"@effect-rx/rx-vue": minor
---

Rx's are now lazy by default

They will not recalculate their value after invalidation until they are explicitly read again.

To disable this behaviour, you can use `Rx.setLazy(false)`.
