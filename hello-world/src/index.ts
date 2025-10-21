import { createServer } from '@superhighway/loom'

const port = Number(process.env['PORT'] ?? '80')

const server = createServer({
  publicDirectory: `${import.meta.dirname}/public`,
})
await server.listen(port)
console.log(`Server is listening on port ${port}…`)
