import {
  type ReadableHTMLTokenStream,
  createElement,
  HTMLSerializingTransformStream,
} from '@matt.kantor/silk'
import { createServer } from 'node:http'
import { Writable } from 'node:stream'

const port = 80

const slowlyGetPlanet = (): Promise<ReadableHTMLTokenStream> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(<strong>world</strong>), 2000),
  )

const server = createServer((_request, response) => {
  const document = (
    <html lang="en">
      <head>
        <title>Greeting</title>
      </head>
      <body>Hello, {slowlyGetPlanet()}!</body>
    </html>
  )

  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  document
    .pipeThrough(
      new HTMLSerializingTransformStream({
        includeDoctype: true,
      }),
    )
    .pipeTo(Writable.toWeb(response))
    .catch(console.error)
})

server.listen(port)
console.log(`Server is listening on port ${port}…`)
