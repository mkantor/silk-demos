/**
 * Combine multiple `ReadableStream`s into one, enqueueing values as they arrive
 * (whenever any of the given input `streams` emits a value it is immediately
 * enqueued in the output stream).
 *
 * Adapted from <https://stackoverflow.com/a/73314492/3625>.
 */
export const mergeStreams = <T>(streams: ReadonlySet<ReadableStream<T>>): ReadableStream<T> => {
  const streamsAsArray = [...streams]
  const readers = streamsAsArray.map(stream => stream.getReader())
  const readOperations: (undefined | Promise<void>)[] = streamsAsArray.map(_ => undefined)
  const dones: (() => unknown)[] = []
  const allDone = Promise.all(
    streamsAsArray.map(_ => new Promise(resolve => dones.push(() => resolve(undefined)))),
  )

  return new ReadableStream({
    start: controller => {
      allDone.then(() => controller.close())
    },
    pull: controller =>
      Promise.race(
        readers.map((reader, index) => {
          const readOperation = reader.read().then(({ value, done }) => {
            if (done) {
              dones[index]?.()
            } else {
              controller.enqueue(value)
              readOperations[index] = undefined
            }
          })
          readOperations[index] ??= readOperation
          return readOperation
        }),
      ),
    cancel: reason => {
      for (const reader of readers) {
        reader.cancel(reason)
      }
    },
  })
}

export const readableStreamFromPromise = <R>(
  promise: Promise<(R & Primitive) | HasDefaultReader<R>>,
): ReadableStream<R> =>
  new ReadableStream({
    start: async controller => {
      try {
        const possiblyReadable = await promise
        if (
          typeof possiblyReadable === 'object' &&
          possiblyReadable !== null &&
          'getReader' in possiblyReadable
        ) {
          const reader = possiblyReadable.getReader()

          // Forward data from the resolved stream.
          const pump = () =>
            reader
              .read()
              .then(({ value, done }) => {
                if (done) {
                  controller.close()
                } else {
                  controller.enqueue(value)
                  pump()
                }
              })
              .catch(controller.error)

          pump()
        } else {
          controller.enqueue(possiblyReadable)
          controller.close()
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })

type Primitive = string | number | bigint | boolean | symbol | null | undefined

type HasDefaultReader<R> = {
  readonly getReader: () => ReadableStreamDefaultReader<R>
}
