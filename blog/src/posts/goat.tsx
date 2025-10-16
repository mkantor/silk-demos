import { createElement } from '@superhighway/silk'
import { post } from '../post.js'

const goats = ['/goat1.jpg', '/goat2.jpg', '/goat3.jpg'] as const

export default post(import.meta, {
  title: 'Goat',
  date: new Date('2025-09-30T22:04:24Z'),
  content: () => {
    const randomGoat = goats[Math.floor(Math.random() * goats.length)]
    return (
      <figure>
        <img fetchpriority="high" src={randomGoat ?? goats[0]} />
        <figcaption>Check out this goat.</figcaption>
      </figure>
    )
  },
})
