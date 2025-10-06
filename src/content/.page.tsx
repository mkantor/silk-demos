import { createElement } from '@matt.kantor/silk'

export default (request: Request) => (
  <html lang="en">
    <head>
      <title>Greeting</title>
    </head>
    <body>
      Hello, <strong>{request.headers.get('user-agent') ?? 'world'}</strong>!
    </body>
  </html>
)
