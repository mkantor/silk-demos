export const posts = await Promise.all([
  // Explicitly listing out the posts here is unfortunately necessary to get
  // good type inference (importing a non-literal `string` results in
  // `Promise<any>`).
  //
  // See also: <https://github.com/microsoft/TypeScript/issues/32401>.

  import('./posts/goat.js'),
  import('./posts/hello-again.js'),
  import('./posts/first-post.js'),
])

export const postsByID: Record<string, (typeof posts)[number]> =
  Object.fromEntries(posts.map(module => [module.id, module]))

export type Post = (typeof posts)[number]
