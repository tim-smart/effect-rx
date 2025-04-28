# @effect-rx/rx

A reactive state management library for Effect.

## Installation

If you are using React:

```bash
pnpm add @effect-rx/rx-react
```

## Creating a Counter with Rx

Let's create a simple Counter component, which will increment a number when you click a button.

We will use `Rx.make` to create our Rx, which is a reactive state container.

We can then use the `useRxValue` & `useRxSet` hooks to read and update the value
of the Rx.

```tsx
import { Rx, useRxValue, useRxSet } from "@effect-rx/rx-react"

const countRx = Rx.make(0).pipe(
  // By default, the Rx will be reset when no longer used.
  // This is useful for cleaning up resources when the component unmounts.
  //
  // If you want to keep the value, you can use `Rx.keepAlive`.
  //
  Rx.keepAlive,
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
  const count = useRxValue(countRx)
  return <h1>{count}</h1>
}

function CounterButton() {
  const setCount = useRxSet(countRx)
  return (
    <button onClick={() => setCount((count) => count + 1)}>Increment</button>
  )
}
```

## Derived State

You can create derived state from an Rx in a couple of ways.

```ts
import { Rx } from "@effect-rx/rx-react"

const countRx = Rx.make(0)

// You can use the `get` function to get the value of another Rx.
//
// The type of `get` is `Rx.Context`, which also has a bunch of other methods
// on it to manage Rx's.
//
const doubleCountRx = Rx.make((get) => get(countRx) * 2)

// You can also use the `Rx.map` function to create a derived Rx.
const tripleCountRx = Rx.map(countRx, (count) => count * 3)
```

## Working with Effects

You can also pass effects to the `Rx.make` function.

When working with effectful Rx's, you will get back a `Result` type.

You can see all the ways to work with `Result` here: https://tim-smart.github.io/effect-rx/rx/Result.ts.html

```ts
import { Rx, Result } from "@effect-rx/rx-react"

const resultRx: Rx<Result<number>> = Rx.make(Effect.succeed(0))

// You can also pass a function to get access to the `Rx.Context`
//
// `get.result` can be used in Effect's to get the value of an Rx<Result>.
const resultWithContextRx: Rx<Result<number>> = Rx.make(
  Effect.fnUntraced(function* (get: Rx.Context) {
    const count = yield* get.result(countRx)
    return count + 1
  }),
)
```

## Working with scoped Effects

All Rx's that use effects are provided with a `Scope`, so you can add finalizers
that will be run when the Rx is no longer used.

```ts
import { Rx } from "@effect-rx/rx-react"
import { Effect } from "effect"

export const resultRx = Rx.make(
  Effect.gen(function* () {
    // Add a finalizer to the `Scope` for this Rx
    // It will run when the Rx is rebuilt or no longer needed
    yield* Effect.addFinalizer(() => Effect.log("finalizer"))
    return "hello"
  }),
)
```

## Working with Effect Services / Layer's

```ts
import { Rx } from "@effect-rx/rx-react"
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

// Create a RxRuntime from a Layer
const runtimeRx: Rx.RxRuntime<Users, never> = Rx.runtime(Users.Default)

// You can then use the RxRuntime to make Rx's that use the services from the Layer
export const usersRx = runtimeRx.rx(
  Effect.gen(function* () {
    const users = yield* Users
    return yield* users.getAll
  }),
)
```

## Working with Stream's

```tsx
import { Result, Rx, useRx } from "@effect-rx/rx-react"
import { Cause, Schedule, Stream } from "effect"

// This will be a simple Rx that emits a incrementing number every second.
//
// Rx.make will give back the latest value of a Stream as a Result
export const countRx: Rx.Rx<Result.Result<number>> = Rx.make(
  Stream.fromSchedule(Schedule.spaced(1000)),
)

// You can use Rx.pull to create a specialized Rx that will pull from a Stream
// one chunk at a time.
//
// This is useful for infinite scrolling or paginated data.
//
// With a `RxRuntime`, you can use `runtimeRx.pull` to create a pull Rx.
export const countPullRx: Rx.Writable<Rx.PullResult<number>, void> = Rx.pull(
  Stream.make(1, 2, 3, 4, 5),
)

// Here is a component that uses countPullRx to display the numbers in a list.
//
// You can use `useRx` to both read the value of an Rx and gain access to the
// setter function.
//
// Each time the setter function is called, it will pull a new chunk of data
// from the Stream, and append it to the list.
export function CountPullRxComponent() {
  const [result, pull] = useRx(countPullRx)

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

## Working with sets of Rx's

```ts
import { Rx } from "@effect-rx/rx-react"
import { Effect } from "effect"

class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    const findById = (id: string) => Effect.succeed({ id, name: "John Doe" })
    return { findById } as const
  }),
}) {}

// Create a RxRuntime from a Layer
const runtimeRx: Rx.RxRuntime<Users, never> = Rx.runtime(Users.Default)

// Rx's work by reference, so we need to use Rx.family to dynamically create a
// set of Rx's from a key.
//
// Rx.family will ensure that we get a stable reference to the Rx for each key.
//
export const userRx = Rx.family((id: string) =>
  runtimeRx.rx(
    Effect.gen(function* () {
      const users = yield* Users
      return yield* users.findById(id)
    }),
  ),
)
```

## Working with functions

```ts
import { Rx, useRxSet, useRxSetPromise } from "@effect-rx/rx-react"
import { Effect, Exit } from "effect"

// Create a simple Rx.fn that logs a number
const logRx = Rx.fn(
  Effect.fnUntraced(function* (arg: number) {
    yield* Effect.log("got arg", arg)
  }),
)

export function LogComponent() {
  // To call the Rx.fn, we need to use the useRxSet hook
  const logNumber = useRxSet(logRx)
  return <button onClick={() => logNumber(42)}>Log 42</button>
}

// You can also use it with Rx.runtime
class Users extends Effect.Service<Users>()("app/Users", {
  succeed: {
    create: (name: string) => Effect.succeed({ id: 1, name }),
  } as const,
}) {}

const runtimeRx = Rx.runtime(Users.Default)

// Here we are using runtimeRx.fn to create a function from the Users.create
// method.
export const createUserRx = runtimeRx.fn(
  Effect.fnUntraced(function* (name: string) {
    const users = yield* Users
    return yield* users.create(name)
  }),
)

export function CreateUserComponent() {
  // If your function returns a Result, you can use the useRxSetPromise hook
  const createUser = useRxSetPromise(createUserRx)
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
import { Rx } from "@effect-rx/rx-react"

// This is a simple Rx that will emit the current scroll position of the
// window.
export const scrollYRx: Rx.Rx<number> = Rx.make((get) => {
  // The handler will use `get.setSelf` to update the value of itself
  const onScroll = () => {
    get.setSelf(window.scrollY)
  }
  // We need to use `get.addFinalizer` to remove the event listener when the
  // Rx is no longer used.
  window.addEventListener("scroll", onScroll)
  get.addFinalizer(() => window.removeEventListener("scroll", onScroll))

  // Return the current scroll position
  return window.scrollY
})
```

## Integration with search params

```ts
import { Rx } from "@effect-rx/rx-react"
import { Option, Schema } from "effect"

// Create an Rx that reads and writes to the URL search parameters
export const simpleParamRx: Rx.Writable<string> = Rx.searchParam("simple")

// You can also use a schema to further parse the value
export const numberParamRx: Rx.Writable<Option.Option<number>> = Rx.searchParam(
  "number",
  { schema: Schema.NumberFromString },
)
```

## Integration with local storage

```ts
import { Rx } from "@effect-rx/rx-react"
import { BrowserKeyValueStore } from "@effect/platform-browser"
import { Schema } from "effect"

// Create an Rx that reads and writes to localStorage.
//
// It uses Schema to define the type of the value stored.
export const flagRx = Rx.kvs({
  runtime: Rx.runtime(BrowserKeyValueStore.layerLocalStorage),
  key: "flag",
  schema: Schema.Boolean,
  defaultValue: () => false,
})
```
