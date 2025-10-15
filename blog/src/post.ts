import type { ReadableHTMLTokenStream } from '@superhighway/silk'
import { getSlugOrThrow } from './slug.js'

export type Post = PostSpecification & {
  readonly [isPost]: true
  readonly id: string
}
export const post = (
  meta: { readonly url: string },
  specification: PostSpecification,
): Post => ({ ...specification, id: getSlugOrThrow(meta.url), [isPost]: true })

export const isPostModule = (
  module: unknown,
): module is { readonly default: Post } =>
  typeof module === 'object' &&
  module !== null &&
  'default' in module &&
  typeof module.default === 'object' &&
  module.default !== null &&
  isPost in module.default &&
  module.default[isPost] === true

const isPost = Symbol('isPost')

type PostSpecification = {
  readonly title: string
  readonly date: Date
  readonly content: () => ReadableHTMLTokenStream
}
