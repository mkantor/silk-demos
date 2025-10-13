import { createServer } from './server.js'

const port = 80

const server = createServer({
  publicDirectory: `${import.meta.dirname}/content`,
})
server.listen(port)
console.log(`Server is listening on port ${port}…`)
