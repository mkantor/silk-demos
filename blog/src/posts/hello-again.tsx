import { createElement } from '@superhighway/silk'
import { post } from '../post.js'

export default post(import.meta, {
  title: 'Hello Again',
  date: new Date('2025-09-23T19:27:29Z'),
  content: () => (
    <>
      <p>Hello again. This is another post.</p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras nec tincidunt nibh. Duis
        tincidunt odio ac sem dictum, ut convallis sem efficitur. Quisque augue felis, luctus
        rhoncus mollis a, dictum vel est. Integer sit amet arcu aliquam, dignissim eros in, eleifend
        leo. Aliquam vulputate ipsum ac lorem sollicitudin eleifend in eu felis. Donec ut faucibus
        mi, non rutrum tortor. Quisque ut metus luctus ex tempus bibendum eget id magna. Nunc eu
        justo vitae mauris malesuada placerat. Vivamus pretium varius nisi a posuere. Nam tincidunt
        cursus ipsum ut mollis. Integer aliquet pretium elit, in porttitor magna condimentum at. Ut
        at consequat odio, sit amet pellentesque risus. Maecenas non quam lacinia, rutrum sem in,
        placerat leo. Sed id risus eget massa faucibus tincidunt. Vestibulum dui justo, pellentesque
        a condimentum id, maximus nec quam.
      </p>
      <p>
        Vestibulum euismod, metus sed ullamcorper maximus, justo magna porta diam, vel sagittis nisi
        tellus a neque. Suspendisse scelerisque nibh vel porta finibus. Cras leo orci, consequat
        quis suscipit eget, accumsan nec enim. Proin tincidunt venenatis ante vitae tempus. Orci
        varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Phasellus
        auctor nisi purus, sed ultrices urna luctus eu. Duis eget leo quis quam accumsan facilisis
        id in ligula. Nunc maximus malesuada iaculis.
      </p>
      <p>This is the end of the post. Goodbye for now.</p>
    </>
  ),
})
