import { page } from '@matt.kantor/loom-node'
import { layout } from '../layout.js'
import { postWithMetadata } from '../post-components.js'
import { postsByID } from '../posts.js'
import errorPage from './{error}.js'

export default page((request) => {
  const queryParameters = new URL(request.url).searchParams
  const postId = queryParameters.get('id')
  const post = postId ? postsByID[postId] : undefined

  return post === undefined
    ? errorPage(request, { status: 404 })
    : layout({ title: post.title, request }, postWithMetadata(post))
})
