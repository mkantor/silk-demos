import sax from 'sax'

export type NewsFeedItem = {
  title: string | undefined
  link: string | undefined
  comments: string | undefined
  pubDate: string | undefined
  readonly feedURL: URL
}

export const parseFeed = (url: URL, saxParser: sax.SAXParser) =>
  new TransformStream<string, NewsFeedItem>({
    start: controller => {
      const initialOutputChunk = {
        feedURL: url,
        title: undefined,
        link: undefined,
        comments: undefined,
        pubDate: undefined,
      } as const
      let outputChunk: NewsFeedItem = { ...initialOutputChunk }

      let currentLocation: TagWithExtractableData | 'item' | 'irrelevant' = 'irrelevant'

      saxParser.onopentagstart = tag => {
        const lowercaseTagName = tag.name.toLowerCase()
        if (
          lowercaseTagName === 'item' ||
          (currentLocation === 'item' && isTagWithExtractableData(lowercaseTagName))
        ) {
          currentLocation = lowercaseTagName
        }
      }
      saxParser.onclosetag = tag => {
        const lowercaseTagName = tag.toLowerCase()
        if (lowercaseTagName === 'item') {
          controller.enqueue(outputChunk)
          outputChunk = { ...initialOutputChunk }
          currentLocation = 'irrelevant'
        } else if (isTagWithExtractableData(lowercaseTagName)) {
          // All extractable data is within `<item>`s.
          currentLocation = 'item'
        }
      }

      const onTextOrCData = (textOrCData: string) => {
        if (isTagWithExtractableData(currentLocation)) {
          outputChunk[currentLocation] = textOrCData
        }
      }

      saxParser.ontext = onTextOrCData
      saxParser.oncdata = onTextOrCData
    },
    transform: (chunk, controller) => {
      try {
        saxParser.write(chunk)
      } catch (error) {
        controller.error(error)
      }
    },
  })

type TagWithExtractableData = 'title' | 'link' | 'comments' | 'pubDate'
const isTagWithExtractableData = (tag: string) =>
  tag == 'title' || tag == 'link' || tag == 'comments' || tag == 'pubDate'
