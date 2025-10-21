import { createElement } from '@superhighway/silk'
import { post } from '../post.js'

export default post(import.meta, {
  title: 'Silk & Loom',
  date: new Date('2025-10-13T20:16:08Z'),
  content: () => (
    <>
      <p>
        <a href="https://github.com/mkantor/silk-demos/tree/main/blog">
          This blog
        </a>{' '}
        is built using <a href="https://github.com/mkantor/loom">Loom</a> and{' '}
        <a href="https://github.com/mkantor/silk">Silk</a>.
      </p>
      <p>
        Loom is a web server for Node.js with filesystem-based routing, and Silk
        is an embedded DSL for authoring streaming HTML from TypeScript via JSX.
      </p>
      <p>
        The source for this post can be seen{' '}
        <a href="https://github.com/mkantor/silk-demos/tree/main/blog/src/posts/silk-and-loom.tsx">
          here
        </a>
        .
      </p>
    </>
  ),
})
