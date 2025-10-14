import { page } from '@matt.kantor/loom-node'
import { createElement } from '@matt.kantor/silk'

export default page(request => (
  <html lang="en">
    <head>
      <title>Greeting</title>
      <link rel="stylesheet" href="style.css" />
    </head>
    <body>Hello, world!</body>
  </html>
))
