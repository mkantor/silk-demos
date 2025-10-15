import { createElement } from '@matt.kantor/silk'
import { post } from '../post.js'

export default post(import.meta, {
  title: 'Goat',
  date: new Date('2025-09-30T22:04:24Z'),
  content: () => (
    <figure>
      <img src="/goat.jpg" />
      <figcaption>Check out this goat.</figcaption>
    </figure>
  ),
})
