import { page } from '@superhighway/loom'
import { layout } from '../layout.js'
import { postWithMetadata } from '../post-components.js'
import { posts } from '../posts.js'
import errorPage from './{error}.js'

const newestPost = posts[0]

export default page(request =>
  newestPost === undefined
    ? errorPage(request, { status: 404 })
    : layout(
        { title: newestPost.title, request },
        postWithMetadata(newestPost),
      ),
)
