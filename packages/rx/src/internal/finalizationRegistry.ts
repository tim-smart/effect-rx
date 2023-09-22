export declare class FinalizationRegistryType<T> {
  constructor(finalize: (value: T) => void)
  register(target: object, value: T, token?: object): void
  unregister(token: object): void
}

declare const FinalizationRegistry: typeof FinalizationRegistryType | undefined

const REGISTRY_SWEEP_INTERVAL = 20_000

export class TimerBasedFinalizationRegistry<T> implements FinalizationRegistryType<T> {
  private registrations: Map<unknown, {
    readonly value: T
    readonly ref: WeakRef<object>
  }> = new Map()
  private sweepTimeout: ReturnType<typeof setTimeout> | undefined

  constructor(private readonly finalize: (value: T) => void) {}

  // Token is actually required with this impl
  register(target: object, value: T, token?: object) {
    this.registrations.set(token ?? value, {
      value,
      ref: new WeakRef(target)
    })
    this.scheduleSweep()
  }

  unregister(token: object) {
    this.registrations.delete(token)
  }

  sweep = () => {
    clearTimeout(this.sweepTimeout)
    this.sweepTimeout = undefined

    this.registrations.forEach((registration, token) => {
      if (registration.ref.deref() === undefined) {
        this.registrations.delete(token)
        this.finalize(registration.value)
      }
    })

    if (this.registrations.size > 0) {
      this.scheduleSweep()
    }
  }

  private scheduleSweep() {
    if (this.sweepTimeout === undefined) {
      this.sweepTimeout = setTimeout(this.sweep, REGISTRY_SWEEP_INTERVAL)
    }
  }
}

export const UniversalFinalizationRegistry = typeof FinalizationRegistry !== "undefined"
  ? FinalizationRegistry
  : TimerBasedFinalizationRegistry
