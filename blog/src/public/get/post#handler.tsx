import { makePostHandler } from '../../post-handler.js'
import { postsByID } from '../../posts.js'

export default makePostHandler(request => {
  const queryParameters = new URL(request.url).searchParams
  const postID = queryParameters.get('id')
  return postID ? postsByID[postID] : undefined
})
