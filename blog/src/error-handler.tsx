import { page } from '@superhighway/loom'
import { createElement } from '@superhighway/silk'

export const errorHandler = page(_request => (
  <html lang="en">
    <head>
      <title>Error</title>
      <link rel="stylesheet" href="style.css" />
    </head>
    <body>Something went wrong.</body>
  </html>
))
