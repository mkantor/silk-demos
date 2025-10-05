import { HTMLSerializingTransformStream } from '@matt.kantor/silk'
import fs from 'node:fs/promises'
import { createServer } from 'node:http'
import { Writable } from 'node:stream'

const port = 80

const server = createServer((request, response) => {
  // The URL constructor normalizes paths such that `url.pathname` will always
  // be absolute and not contain any `..`s.
  const url = new URL(
    `http://${process.env['HOST'] ?? 'localhost'}${request.url}`,
  )

  const pageModulePath = `./content${url.pathname}.page.js`
  import(pageModulePath)
    .then((module: unknown) => {
      if (
        !(
          // This validation is unfortunately somewhat limited.
          (
            typeof module === 'object' &&
            module !== null &&
            'default' in module &&
            typeof module.default === 'function'
          )
        )
      ) {
        throw new Error(
          `${pageModulePath} does not have a default export which is a function`,
        )
      } else {
        const page: unknown = module.default()
        if (!(page instanceof ReadableStream)) {
          throw new Error(
            `Page was ${
              page === null
                ? 'null'
                : page === undefined
                ? 'undefined'
                : page.constructor.name !== ''
                ? page.constructor.name
                : typeof page
            }, but expected a ReadableStream`,
          )
        } else {
          // Assume it's a `ReadableStream<HTMLToken>`.
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          return page
            .pipeThrough(
              new HTMLSerializingTransformStream({
                includeDoctype: true,
              }),
            )
            .pipeTo(Writable.toWeb(response))
            .catch(console.error)
        }
      }
    })
    .catch((_pageError) => {
      if (url.pathname.endsWith('.page.js')) {
        response.setHeader('Content-Type', 'text/plain')
        response.write('Not found')
        console.error(`Request path '${url.pathname}' ends in '.page.js'`)
        response.end()
      } else {
        // Try to serve as a static file.
        return fs
          .open(`${import.meta.dirname}/content${url.pathname}`)
          .then((staticFile) =>
            staticFile
              .readableWebStream()
              .pipeTo(Writable.toWeb(response))
              .catch(console.error)
              .then((_) => staticFile.close()),
          )
          .catch((error) => {
            response.setHeader('Content-Type', 'text/plain')
            response.write('Not found')
            console.error(error)
            response.end()
          })
      }
    })
})

server.listen(port)
console.log(`Server is listening on port ${port}…`)
