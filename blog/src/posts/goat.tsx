import { createElement } from '@matt.kantor/silk'
import { getSlugOrThrow } from '../slug.js'

export const id = getSlugOrThrow(import.meta.url)

export const title = 'Goat'

export const date = new Date('2025-09-30T22:04:24Z')

export const content = () => (
  <>
    <figure>
      <img src="/goat.jpg" />
      <figcaption>Check out this goat.</figcaption>
    </figure>
  </>
)
