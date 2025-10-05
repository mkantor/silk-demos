import { createElement } from '@matt.kantor/silk'

const output = (
  <>
    {'Hello, '}
    {'world!'}
  </>
)

for await (const chunk of output) {
  if (chunk.kind === 'text') {
    process.stdout.write(chunk.text)
  }
}
process.stdout.write('\n')
