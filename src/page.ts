import type { ReadableHTMLTokenStream } from '@matt.kantor/silk'
import type { ResponseStatus } from './server.js'

export type Page = { readonly [isPage]: true } & PageFunction
export const page = (handler: PotentialPage): Page => {
  handler[isPage] = true
  return handler as Page
}

export const isPageModule = (
  module: unknown,
): module is { readonly default: Page } =>
  typeof module === 'object' &&
  module !== null &&
  'default' in module &&
  typeof module.default === 'function' &&
  isPage in module.default &&
  module.default[isPage] === true

const isPage = Symbol('isPage')

type ResponseDetails = { readonly status: ResponseStatus }
type PageFunction = (
  request: Request,
  responseDetails: ResponseDetails,
) => ReadableHTMLTokenStream
