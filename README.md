# @effect-atom/atom

A reactive state management library for Effect.

## Installation

If you are using React:

```bash
pnpm add @effect-atom/atom-react
```

## Creating a Counter with Atom

Let's create a simple Counter component, which will increment a number when you click a button.

We will use `Atom.make` to create our Atom, which is a reactive state container.

We can then use the `useAtomValue` & `useAtomSet` hooks to read and update the value
of the Atom.

```tsx
import { Atom, useAtomValue, useAtomSet } from "@effect-atom/atom-react"

const countAtom = Atom.make(0).pipe(
  // By default, the Atom will be reset when no longer used.
  // This is useful for cleaning up resources when the component unmounts.
  //
  // If you want to keep the value, you can use `Atom.keepAlive`.
  //
  Atom.keepAlive,
)

function App() {
  return (
    <div>
      <Counter />
      <br />
      <CounterButton />
    </div>
  )
}

function Counter() {
  const count = useAtomValue(countAtom)
  return <h1>{count}</h1>
}

function CounterButton() {
  const setCount = useAtomSet(countAtom)
  return (
    <button onClick={() => setCount((count) => count + 1)}>Increment</button>
  )
}
```

## Derived State

You can create derived state from an Atom in a couple of ways.

```ts
import { Atom } from "@effect-atom/atom-react"

const countAtom = Atom.make(0)

// You can use the `get` function to get the value of another Atom.
//
// The type of `get` is `Atom.Context`, which also has a bunch of other methods
// on it to manage Atom's.
//
const doubleCountAtom = Atom.make((get) => get(countAtom) * 2)

// You can also use the `Atom.map` function to create a derived Atom.
const tripleCountAtom = Atom.map(countAtom, (count) => count * 3)
```

## Working with Effects

You can also pass effects to the `Atom.make` function.

When working with effectful Atom's, you will get back a `Result` type.

You can see all the ways to work with `Result` here: https://tim-smart.github.io/effect-atom/atom/Result.ts.html

```ts
import { Atom, Result } from "@effect-atom/atom-react"

const countAtom: Atom<Result<number>> = Atom.make(Effect.succeed(0))

// You can also pass a function to get access to the `Atom.Context`
//
// `get.result` can be used in Effect's to get the value of an Atom<Result>.
const resultWithContextAtom: Atom<Result<number>> = Atom.make(
  Effect.fnUntraced(function* (get: Atom.Context) {
    const count = yield* get.result(countAtom)
    return count + 1
  }),
)
```

## Working with scoped Effects

All Atom's that use effects are provided with a `Scope`, so you can add finalizers
that will be run when the Atom is no longer used.

```ts
import { Atom } from "@effect-atom/atom-react"
import { Effect } from "effect"

export const resultAtom = Atom.make(
  Effect.gen(function* () {
    // Add a finalizer to the `Scope` for this Atom
    // It will run when the Atom is rebuilt or no longer needed
    yield* Effect.addFinalizer(() => Effect.log("finalizer"))
    return "hello"
  }),
)
```

## Working with Effect Services / Layer's

```ts
import { Atom } from "@effect-atom/atom-react"
import { Effect } from "effect"

class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    const getAll = Effect.succeed([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ])
    return { getAll } as const
  }),
}) {}

// Create a AtomRuntime from a Layer
const runtimeAtom: Atom.AtomRuntime<Users, never> = Atom.runtime(Users.Default)

// You can then use the AtomRuntime to make Atom's that use the services from the Layer
export const usersAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const users = yield* Users
    return yield* users.getAll
  }),
)
```

## Adding global Layers to AtomRuntime's

This is useful for setting up Tracer's, Logger's, ConfigProvider's, etc.

```ts
import { Atom } from "@effect-atom/atom-react"
import { ConfigProvider, Layer } from "effect"

Atom.runtime.addGlobalLayer(
  Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env)),
)
```

## Working with Stream's

```tsx
import { Result, Atom, useAtom } from "@effect-atom/atom-react"
import { Cause, Schedule, Stream } from "effect"

// This will be a simple Atom that emits a incrementing number every second.
//
// Atom.make will give back the latest value of a Stream as a Result
export const countAtom: Atom.Atom<Result.Result<number>> = Atom.make(
  Stream.fromSchedule(Schedule.spaced(1000)),
)

// You can use Atom.pull to create a specialized Atom that will pull from a Stream
// one chunk at a time.
//
// This is useful for infinite scrolling or paginated data.
//
// With a `AtomRuntime`, you can use `runtimeAtom.pull` to create a pull Atom.
export const countPullAtom: Atom.Writable<
  Atom.PullResult<number>,
  void
> = Atom.pull(Stream.make(1, 2, 3, 4, 5))

// Here is a component that uses countPullAtom to display the numbers in a list.
//
// You can use `useAtom` to both read the value of an Atom and gain access to the
// setter function.
//
// Each time the setter function is called, it will pull a new chunk of data
// from the Stream, and append it to the list.
export function CountPullAtomComponent() {
  const [result, pull] = useAtom(countPullAtom)

  return Result.match(result, {
    onInitial: () => <div>Loading...</div>,
    onFailure: (error) => <div>Error: {Cause.pretty(error.cause)}</div>,
    onSuccess: (success) => (
      <div>
        <ul>
          {success.value.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button onClick={() => pull()}>Load more</button>
        {success.waiting ? <p>Loading more...</p> : <p>Loaded chunk</p>}
      </div>
    ),
  })
}
```

## Working with sets of Atom's

```ts
import { Atom } from "@effect-atom/atom-react"
import { Effect } from "effect"

class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    const findById = (id: string) => Effect.succeed({ id, name: "John Doe" })
    return { findById } as const
  }),
}) {}

// Create a AtomRuntime from a Layer
const runtimeAtom: Atom.AtomRuntime<Users, never> = Atom.runtime(Users.Default)

// Atom's work by reference, so we need to use Atom.family to dynamically create a
// set of Atom's from a key.
//
// Atom.family will ensure that we get a stable reference to the Atom for each key.
//
export const userAtom = Atom.family((id: string) =>
  runtimeAtom.atom(
    Effect.gen(function* () {
      const users = yield* Users
      return yield* users.findById(id)
    }),
  ),
)
```

## Working with functions

```ts
import { Atom, useAtomSet, useAtomSetPromise } from "@effect-atom/atom-react"
import { Effect, Exit } from "effect"

// Create a simple Atom.fn that logs a number
const logAtom = Atom.fn(
  Effect.fnUntraced(function* (arg: number) {
    yield* Effect.log("got arg", arg)
  }),
)

export function LogComponent() {
  // To call the Atom.fn, we need to use the useAtomSet hook
  const logNumber = useAtomSet(logAtom)
  return <button onClick={() => logNumber(42)}>Log 42</button>
}

// You can also use it with Atom.runtime
class Users extends Effect.Service<Users>()("app/Users", {
  succeed: {
    create: (name: string) => Effect.succeed({ id: 1, name }),
  } as const,
}) {}

const runtimeAtom = Atom.runtime(Users.Default)

// Here we are using runtimeAtom.fn to create a function from the Users.create
// method.
export const createUserAtom = runtimeAtom.fn(
  Effect.fnUntraced(function* (name: string) {
    const users = yield* Users
    return yield* users.create(name)
  }),
)

export function CreateUserComponent() {
  // If your function returns a Result, you can use the useAtomSetPromise hook
  const createUser = useAtomSetPromise(createUserAtom)
  return (
    <button
      onClick={async () => {
        const exit = await createUser("John")
        if (Exit.isSuccess(exit)) {
          console.log(exit.value)
        }
      }}
    >
      Log 42
    </button>
  )
}
```

## Wrapping an event listener

```ts
import { Atom } from "@effect-atom/atom-react"

// This is a simple Atom that will emit the current scroll position of the
// window.
export const scrollYAtom: Atom.Atom<number> = Atom.make((get) => {
  // The handler will use `get.setSelf` to update the value of itself
  const onScroll = () => {
    get.setSelf(window.scrollY)
  }
  // We need to use `get.addFinalizer` to remove the event listener when the
  // Atom is no longer used.
  window.addEventListener("scroll", onScroll)
  get.addFinalizer(() => window.removeEventListener("scroll", onScroll))

  // Return the current scroll position
  return window.scrollY
})
```

## Integration with search params

```ts
import { Atom } from "@effect-atom/atom-react"
import { Option, Schema } from "effect"

// Create an Atom that reads and writes to the URL search parameters
export const simpleParamAtom: Atom.Writable<string> = Atom.searchParam("simple")

// You can also use a schema to further parse the value
export const numberParamAtom: Atom.Writable<Option.Option<number>> =
  Atom.searchParam("number", { schema: Schema.NumberFromString })
```

## Integration with local storage

```ts
import { Atom } from "@effect-atom/atom-react"
import { BrowserKeyValueStore } from "@effect/platform-browser"
import { Schema } from "effect"

// Create an Atom that reads and writes to localStorage.
//
// It uses Schema to define the type of the value stored.
export const flagAtom = Atom.kvs({
  runtime: Atom.runtime(BrowserKeyValueStore.layerLocalStorage),
  key: "flag",
  schema: Schema.Boolean,
  defaultValue: () => false,
})
```

## Integration with `Reactivity` from `@effect/experimental`

`Reactivity` is an Effect services allows you make queries reactive when
mutations happen.

You can use an `Rx.runtime` to hook into the `Reactivity` service and trigger
`Atom` refreshes when mutations happen.

```ts
import { Atom } from "@effect-atom/atom-react"
import * as Reactivity from "@effect/experimental/Reactivity"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

const runtimeAtom = Atom.runtime(Layer.empty)

let i = 0
const count = Atom.make(() => i++).pipe(
  // Refresh when the "counter" key changes
  runtimeAtom.withReactivity(["counter"]),
  // Or refresh when "counter" or "counter:1" or "counter:2" changes
  runtimeAtom.withReactivity({
    counter: [1, 2],
  }),
)

const someMutation = runtimeAtom.fn(
  Effect.fn(function* () {
    yield* Effect.log("Mutating the counter")
  }),
  // Invalidate the "counter" key when the Effect is finished
  { reactivityKeys: ["counter"] },
)

const someMutationManual = runtimeAtom.fn(
  Effect.fn(function* () {
    yield* Effect.log("Mutating the counter again")
    // You can also manually invalidate the "counter" key
    yield* Reactivity.invalidate(["counter"])
  }),
)
```
