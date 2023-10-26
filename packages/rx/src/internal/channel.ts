import * as Channel from "effect/Channel"
import * as Chunk from "effect/Chunk"
import * as Stream from "effect/Stream"

/** @internal */
export const accumulateChunks = <R, E, A>(self: Stream.Stream<R, E, A>): Stream.Stream<R, E, A> => {
  const accumulator = (
    s: Chunk.Chunk<A>
  ): Channel.Channel<never, E, Chunk.Chunk<A>, unknown, E, Chunk.Chunk<A>, void> =>
    Channel.readWith({
      onInput: (input: Chunk.Chunk<A>) => {
        const next = Chunk.appendAll(s, input)
        return Channel.flatMap(
          Channel.write(next),
          () => accumulator(next)
        )
      },
      onFailure: Channel.fail,
      onDone: () => Channel.unit
    })
  return Stream.fromChannel(
    Channel.pipeTo(
      Stream.toChannel(self),
      accumulator(Chunk.empty())
    )
  )
}
