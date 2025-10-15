import { createElement } from '@superhighway/silk'
import { post } from '../post.js'

export default post(import.meta, {
  title: 'Hello Again',
  date: new Date('2025-09-23T19:27:29Z'),
  content: () => (
    <>
      <p>Hello again. This is another post.</p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
    </>
  ),
})
