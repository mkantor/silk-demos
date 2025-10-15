import { createServer } from '@superhighway/loom'

const port = 80

const server = createServer({
  publicDirectory: `${import.meta.dirname}/public`,
})
server.listen(port)
console.log(`Server is listening on port ${port}…`)
