import { createElement } from '@matt.kantor/silk'
import { getSlugOrThrow } from '../slug.js'

export const id = getSlugOrThrow(import.meta.url)

export const title = 'First Post'

export const date = new Date('2025-09-22T16:35:17Z')

export const content = () => <p>Hello, world!</p>
