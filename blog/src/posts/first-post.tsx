import { createElement } from '@matt.kantor/silk'
import { post } from '../post.js'

export default post(import.meta, {
  title: 'First Post',
  date: new Date('2025-09-22T16:35:17Z'),
  content: () => <p>Hello, world!</p>,
})
