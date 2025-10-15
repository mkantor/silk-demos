import { createElement } from '@matt.kantor/silk'
import type { Post } from './post.js'
import { posts } from './posts.js'

export const postLink = (post: Post, title?: string) => (
  <a href={`./post?id=${post.id}`}>{title ?? post.title}</a>
)

export const postWithMetadata = (post: Post) => {
  let postIndex = 0
  for (const index in posts) {
    if (posts[index]?.id === post.id) {
      postIndex = Number(index)
    }
  }
  const previousPost = posts[postIndex - 1]
  const nextPost = posts[postIndex + 1]

  return (
    <article>
      <header>
        <h2>{post.title}</h2>
        <time datetime={post.date.toISOString()}>
          {post.date.toDateString()}
        </time>
      </header>
      {post.content()}
      <nav>
        {previousPost ? (
          <small>
            ← {postLink(previousPost, `Next Post (${previousPost.title})`)}
          </small>
        ) : (
          <></>
        )}
        {nextPost ? (
          <small>
            {postLink(nextPost, `Previous Post (${nextPost.title})`)} →
          </small>
        ) : (
          <></>
        )}
      </nav>
    </article>
  )
}
