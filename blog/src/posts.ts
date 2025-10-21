import nodeFS from 'node:fs/promises'
import { isPostModule } from './post.js'

const postDirectoryPath = `${import.meta.dirname}/posts`
export const posts = (
  await Promise.all(
    (await nodeFS.readdir(postDirectoryPath))
      .filter(path => path.endsWith('.js'))
      .map(path => import(`${postDirectoryPath}/${path}`)),
  )
)
  .filter(isPostModule)
  .map(module => module.default)
  // Order by date (newest first):
  .sort((post1, post2) => (post1.date < post2.date ? 1 : post1.date > post2.date ? -1 : 0))

export const postsByID: Record<string, (typeof posts)[number]> = Object.fromEntries(
  posts.map(module => [module.id, module]),
)
