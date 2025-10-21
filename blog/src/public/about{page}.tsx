import { page } from '@superhighway/loom'
import { createElement } from '@superhighway/silk'
import { layout } from '../layout.js'

export default page(request =>
  layout(
    { title: 'About', request },
    <article>
      <h2>Person McPersonface</h2>
      <p>I am a person. I have a face. I also have a blog, which is what you are looking at.</p>
    </article>,
  ),
)
