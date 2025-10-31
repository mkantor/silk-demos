import { page, requestHandler, type ResponseStatus } from '@superhighway/loom'
import { createElement } from '@superhighway/silk'

export default requestHandler((request, responseDetails) => {
  const errorMessage = getErrorMessage(responseDetails.status)

  const errorPage = page(_ => (
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
        {errorMessage}
      </body>
    </html>
  ))

  return errorPage(request, responseDetails)
})

const getErrorMessage = (status: ResponseStatus): string => {
  switch (status) {
    case 200:
      throw new Error('The error handler was called with a successful status code')
    case 400:
      return 'Bad Request'
    case 404:
      return 'Not Found'
    case 405:
      return 'Method Not Allowed'
    case 406:
      return 'Not Acceptable'
    case 500:
      return 'Internal Server Error'
    case 501:
      return 'Not Implemented'
  }
}
