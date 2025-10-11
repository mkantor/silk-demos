import { HTMLSerializingTransformStream } from '@matt.kantor/silk'
import mime from 'mime/lite'
import nodeFS from 'node:fs/promises'
import { createServer, ServerResponse, type IncomingMessage } from 'node:http'
import nodePath from 'node:path'
import { Readable, Writable } from 'node:stream'
import { isPageModule } from './page.js'

export const server = createServer((incomingMessage, serverResponse) => {
  const request = incomingMessageToWebRequest(
    incomingMessage,
    `http://${process.env['HOST'] ?? 'localhost'}`,
  )
  handleRequest(request).then((response) =>
    writeWebResponseToServerResponse(response, serverResponse),
  )
})

const handleRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  const pageModulePath = `./content${url.pathname}.page.js`
  return import(pageModulePath)
    .then((module: unknown) => {
      if (!isPageModule(module)) {
        throw new Error(`${pageModulePath} is not a valid page module`)
      } else {
        const page = module.default(request)
        const response = new Response(
          page
            .pipeThrough(
              new HTMLSerializingTransformStream({
                includeDoctype: true,
              }),
            )
            .pipeThrough(new TextEncoderStream()),
          {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          },
        )
        return response
      }
    })
    .catch(async (pageError: unknown) => {
      if (
        typeof pageError !== 'object' ||
        pageError === null ||
        !('code' in pageError) ||
        pageError.code !== 'ERR_MODULE_NOT_FOUND'
      ) {
        console.error(pageError)
        console.warn('Falling back to a static file (if one exists)')
      }

      if (url.pathname.endsWith('.page.js')) {
        console.error(`Request path '${url.pathname}' ends in '.page.js'`)
        return new Response('Not found', {
          status: 404,
          headers: { 'content-type': 'text/plain' },
        })
      } else {
        // Try to serve as a static file.
        let path = `${import.meta.dirname}/content${url.pathname}`
        try {
          // Resolve symlinks. Mime types are based on the resolved path.
          path = await nodeFS.readlink(path)
          if (!nodePath.isAbsolute(path)) {
            path = `${import.meta.dirname}/content/${path}`
          }
        } catch {
          // Errors here indicate the file was not a symlink, which is fine.
        }
        const mimeType = mime.getType(path)

        let staticFile
        try {
          staticFile = await nodeFS.open(path)
          await staticFile.stat().then((stats) => {
            if (stats.isFile() === false) {
              throw new Error(`${path} is not a file`)
            }
          })
          return new Response(
            staticFile.readableWebStream({ autoClose: true }),
            {
              status: 200,
              headers: mimeType ? { 'content-type': mimeType } : {},
            },
          )
        } catch (error) {
          console.error(error)
          if (staticFile !== undefined) {
            staticFile.close()
          }
          return new Response('Not found', {
            status: 404,
            headers: { 'content-type': 'text/plain' },
          })
        }
      }
    })
}

/**
 * Expects an `incomingMessage` obtained from a `Server` (it must have its
 * `.url` set).
 */
const incomingMessageToWebRequest = (
  incomingMessage: IncomingMessage,
  baseUrl: string,
): Request => {
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

  return request
}

const writeWebResponseToServerResponse = async (
  webResponse: Response,
  serverResponse: ServerResponse,
): Promise<undefined> => {
  serverResponse.statusCode = webResponse.status
  serverResponse.statusMessage = webResponse.statusText
  serverResponse.setHeaders(webResponse.headers)
  await webResponse.body?.pipeTo(Writable.toWeb(serverResponse))
  await new Promise((resolve) => serverResponse.end(resolve))
}
