import { makePostHandler } from '../../post-handler.js'
import { posts } from '../../posts.js'

export default makePostHandler(
  _ => posts[0], // Display the most recent post.
)
