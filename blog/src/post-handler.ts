import { page, requestHandler } from '@superhighway/loom'
import { errorHandler } from './error-handler.js'
import { layout } from './layout.js'
import { postWithMetadata } from './post-components.js'
import type { Post } from './post.js'

/**
 * This is abstracted to allow reuse (e.g. across pages for specific posts and
 * the "most recent post" page).
 */
export const makePostHandler = (lookUpPost: (request: Request) => Post | undefined) =>
  requestHandler((request, responseDetails) => {
    const post = lookUpPost(request)

    const handler =
      post === undefined
        ? requestHandler(request => errorHandler(request, { status: 404, headers: {} }))
        : page(request => layout({ title: post.title, request }, postWithMetadata(post)))

    return handler(request, responseDetails)
  })
