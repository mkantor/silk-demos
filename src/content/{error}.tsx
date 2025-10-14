import { createElement } from '@matt.kantor/silk'
import { page } from '../page.js'
import type { ResponseStatus } from '../server.js'

export default page((request, { status }) => {
  return (
    <html lang="en">
      <head>
        <title>Feed Me</title>
        <link rel="stylesheet" href="./variables.css" />
        <link rel="stylesheet" href="./layout.css" />
        <link rel="stylesheet" href="./decoration.css" />
        <link rel="icon" href="./favicon.png" type="image/png" />
      </head>
      <body>
        <h1>Error</h1>
        {getErrorMessage(status)}
      </body>
    </html>
  )
})

const getErrorMessage = (status: ResponseStatus): string => {
  switch (status) {
    case 200:
      throw new Error(
        'The error handler was called with a successful status code',
      )
    case 404:
      return 'Not Found'
    case 500:
      return 'Internal Server Error'
  }
}
