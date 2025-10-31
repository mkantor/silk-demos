import { page } from '@superhighway/loom'
import { createElement } from '@superhighway/silk'
import { layout } from '../../layout.js'
import { postLink } from '../../post-components.js'
import { posts } from '../../posts.js'

export default page(request =>
  layout(
    { title: 'Archive', request },
    <ul>
      {posts.map(post => (
        <li>
          {postLink(post)} —
          <time datetime={post.date.toISOString()}>{post.date.toDateString()}</time>
        </li>
      ))}
    </ul>,
  ),
)
