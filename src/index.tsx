import { HTMLSerializingTransformStream } from '@matt.kantor/silk'
import mime from 'mime/lite'
import nodeFS from 'node:fs/promises'
import { createServer, type IncomingMessage } from 'node:http'
import nodePath from 'node:path'
import { Readable, Writable } from 'node:stream'

const port = 80

const server = createServer((incomingMessage, response) => {
  const { request, url } = incomingMessageToWebRequest(
    incomingMessage,
    `http://${process.env['HOST'] ?? 'localhost'}`,
  )

  const pageModulePath = `./content${url.pathname}.page.js`
  import(pageModulePath)
    .then((module: unknown) => {
      if (
        !(
          // This validation is unfortunately somewhat limited. We assume the
          // function accepts a single `Request`-typed parameter.
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
        const page: unknown = module.default(request)
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
    .catch(async (_pageError) => {
      if (url.pathname.endsWith('.page.js')) {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/plain')
        response.write('Not found')
        console.error(`Request path '${url.pathname}' ends in '.page.js'`)
        response.end()
      } else {
        // Try to serve as a static file.
        let path = `${import.meta.dirname}/content${url.pathname}`
        try {
          // Resolve symlinks. Mime types are based on the resolved path.
          path = await nodeFS.readlink(path)
          if (!nodePath.isAbsolute(path)) {
            path = `${import.meta.dirname}/content/${path}`
          }
        } catch {}
        let mimeType = mime.getType(path)
        if (mimeType) {
          response.setHeader('Content-Type', mimeType)
        }
        try {
          const staticFile = await nodeFS.open(path)
          return staticFile
            .readableWebStream()
            .pipeTo(Writable.toWeb(response))
            .catch(console.error)
            .then((_) => staticFile.close())
        } catch (error) {
          response.statusCode = 404
          response.setHeader('Content-Type', 'text/plain')
          response.write('Not found')
          console.error(error)
          response.end()
        }
      }
    })
})

/**
 * Expects an `incomingMessage` obtained from a `Server` (it must have its
 * `.url` set).
 */
const incomingMessageToWebRequest = (
  incomingMessage: IncomingMessage,
  baseUrl: string,
): { readonly request: Request; readonly url: URL } => {
  const url = new URL(incomingMessage.url ?? '/', baseUrl)

  const headers = new Headers()
  for (const key in incomingMessage.headers) {
    const value = incomingMessage.headers[key]
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((element) => headers.append(key, element))
      } else {
        headers.append(key, value)
      }
    }
  }

  const body =
    incomingMessage.method !== 'GET' && incomingMessage.method !== 'HEAD'
      ? Readable.toWeb(incomingMessage)
      : null

  const request = new Request(url.toString(), {
    method: incomingMessage.method ?? '', // This fallback is expected to fail.
    headers,
    body,
    duplex: 'half',
  })

  return { request, url }
}

server.listen(port)
console.log(`Server is listening on port ${port}…`)
