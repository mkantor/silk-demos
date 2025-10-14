import { page } from '@matt.kantor/loom-node'
import { layout } from '../layout.js'
import { postWithMetadata } from '../post-components.js'
import { posts } from '../posts.js'

// Show the most recent post.
export default page((request) =>
  layout({ title: posts[0].title, request }, postWithMetadata(posts[0])),
)
