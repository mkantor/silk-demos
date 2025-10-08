import { createElement, type ReadableHTMLTokenStream } from '@matt.kantor/silk'
import type { HTMLToken } from '@matt.kantor/silk/dist/htmlToken.js'
import sax from 'sax'
import { mergeStreams, readableStreamFromPromise } from '../streamUtilities.js'

export default (request: Request) => {
  const queryParameters = new URL(request.url).searchParams

  const feedURLsAsArray =
    queryParameters
      .get(feedURLKey)
      ?.split('\n')
      ?.flatMap((urlAsString) => {
        try {
          return [new URL(urlAsString)]
        } catch (error) {
          console.error(error)
          return []
        }
      }) ?? defaultFeedURLs

  return (
    <html lang="en">
      <head>
        <title>Feed Me</title>
        <link rel="stylesheet" href="./layout.css" />
      </head>
      <body>
        <form action="." method="get">
          <label>
            RSS Feed URLs (newline-delimited):
            <textarea name={feedURLKey}>
              {feedURLsAsArray.flatMap((url) => [url.href, '\n'])}
            </textarea>
          </label>
          <input type="submit" value="Refresh Feeds" />
        </form>
        <div>
          <ul>{getNewsFeeds(new Set(feedURLsAsArray))}</ul>
        </div>
      </body>
    </html>
  )
}

const feedURLKey = 'feed-url'

const defaultFeedURLs = [
  'https://feeds.arstechnica.com/arstechnica/index/',
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://feeds.bloomberg.com/markets/news.rss',
  'https://feeds.feedburner.com/time/world',
  'https://feeds.npr.org/1001/rss.xml',
  'https://globalnews.ca/world/feed/',
  'https://lwn.net/headlines/rss',
  'https://news.ycombinator.com/rss',
  'https://phys.org/rss-feed/',
  'https://rss.slashdot.org/Slashdot/slashdotMain',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://www.economist.com/latest/rss.xml',
  'https://www.gamespot.com/feeds/mashup',
  'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  'https://www.nature.com/nature.rss',
  'https://www.newscientist.com/feed/home',
  'https://www.space.com/feeds.xml',
  'https://www.theguardian.com/world/rss',
].map((urlAsString) => new URL(urlAsString))

const getNewsFeeds = async (
  urls: ReadonlySet<URL>,
): Promise<ReadableHTMLTokenStream> => {
  const feeds = new Set<ReadableHTMLTokenStream>()
  for (const url of urls.values()) {
    feeds.add(readableStreamFromPromise<HTMLToken>(getNewsFeed(url)))
  }
  return mergeStreams(feeds)
}

type NewsFeedItem = {
  title: string | undefined
  link: string | undefined
  comments: string | undefined
  pubDate: string | undefined
  readonly feedURL: URL
}

type TagWithExtractableData = 'title' | 'link' | 'comments' | 'pubDate'
const isTagWithExtractableData = (tag: string) =>
  tag == 'title' || tag == 'link' || tag == 'comments' || tag == 'pubDate'

const getNewsFeed = async (url: URL): Promise<ReadableHTMLTokenStream> => {
  const saxParser = sax.parser(/* strict */ true, { trim: true })

  const parseFeed = new TransformStream<string, NewsFeedItem>({
    start: (controller) => {
      const initialOutputChunk = {
        feedURL: url,
        title: undefined,
        link: undefined,
        comments: undefined,
        pubDate: undefined,
      } as const
      let outputChunk: NewsFeedItem = { ...initialOutputChunk }

      let currentLocation: TagWithExtractableData | 'item' | 'irrelevant' =
        'irrelevant'

      saxParser.onopentagstart = (tag) => {
        if (
          tag.name === 'item' ||
          (currentLocation === 'item' && isTagWithExtractableData(tag.name))
        ) {
          currentLocation = tag.name
        }
      }
      saxParser.onclosetag = (tag) => {
        if (tag === 'item') {
          controller.enqueue(outputChunk)
          outputChunk = { ...initialOutputChunk }
          currentLocation = 'irrelevant'
        } else if (isTagWithExtractableData(tag)) {
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
    transform: (chunk, _controller) => {
      saxParser.write(chunk)
    },
  })

  const feedAsHTML = new TransformStream<NewsFeedItem, HTMLToken>({
    transform: async (item, controller) => {
      if (item.link !== undefined) {
        const html = (
          <li>
            <details>
              <summary>
                <a href={item.link}>{item.title ?? item.link}</a>
              </summary>
              <dl>
                <dt>Feed</dt>
                <dd>
                  <a href={item.feedURL.href}>{item.feedURL.href}</a>
                </dd>
                {item.comments !== undefined ? (
                  <>
                    <dt>Comments</dt>
                    <dd>
                      <a href={item.comments}>{item.comments}</a>
                    </dd>
                  </>
                ) : (
                  <></>
                )}
                {item.pubDate !== undefined ? (
                  <>
                    <dt>Published</dt>
                    <dd>
                      <time>{item.pubDate}</time>
                    </dd>
                  </>
                ) : (
                  // Omit items without links.
                  <></>
                )}
              </dl>
            </details>
          </li>
        )
        for await (const token of html) {
          controller.enqueue(token)
        }
      }
    },
  })

  const response = await fetch(url)
  const feed: ReadableHTMLTokenStream | undefined = response.body
    ?.pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(parseFeed)
    .pipeThrough(feedAsHTML)

  return (
    feed ?? (
      <>
        <strong>Error:</strong>Feed content unavailable
      </>
    )
  )
}
