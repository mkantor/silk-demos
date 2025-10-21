import { createElement } from '@superhighway/silk'
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
  const nextPost = posts[postIndex - 1]
  const previousPost = posts[postIndex + 1]

  return (
    <article>
      <header>
        <h2>{post.title}</h2>
        <time datetime={post.date.toISOString()}>{post.date.toDateString()}</time>
      </header>

      {post.content()}

      <nav>
        {postNavigationItem(nextPost, {
          text: `Next Post (${nextPost?.title})`,
          before: `←${nbsp}`,
        })}
        {postNavigationItem(previousPost, {
          text: `Previous Post (${previousPost?.title})`,
          after: `${nbsp}→`,
        })}
      </nav>
    </article>
  )
}

const nbsp = '\xa0'

const postNavigationItem = (
  post: Post | undefined,
  props: {
    readonly text: string
    readonly before?: string
    readonly after?: string
  },
) =>
  post ? (
    <small>
      {props.before ?? ''}
      {postLink(post, props.text)}
      {props.after ?? ''}
    </small>
  ) : (
    <></>
  )
