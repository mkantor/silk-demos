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

  const seenLinks = new Set<string>()

  return (
    <html lang="en">
      <head>
        <title>Feed Me</title>
        <link rel="stylesheet" href="./variables.css" />
        <link rel="stylesheet" href="./layout.css" />
        <link rel="stylesheet" href="./decoration.css" />
        <link rel="icon" href="./favicon.png" type="image/png" />
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
          <ul>
            {getNewsFeeds(new Set(feedURLsAsArray), (item) => {
              if (!item.link) {
                return false
              } else {
                // Only show each unique `<link>` once.
                const seen = seenLinks.has(item.link)
                seenLinks.add(item.link)
                return !seen
              }
            })}
          </ul>
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
  itemFilter: (item: NewsFeedItem) => boolean,
): Promise<ReadableHTMLTokenStream> => {
  const feeds = new Set<ReadableHTMLTokenStream>()
  for (const url of urls.values()) {
    feeds.add(
      readableStreamFromPromise<HTMLToken>(getNewsFeed(url, itemFilter)),
    )
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

const getNewsFeed = async (
  url: URL,
  itemFilter: (item: NewsFeedItem) => boolean,
): Promise<ReadableHTMLTokenStream> => {
  let response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error(error)
    return <></>
  }

  const feed: ReadableHTMLTokenStream | undefined = response.body
    ?.pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(parseFeed(url, sax.parser(/* strict */ true, { trim: true })))
    .pipeThrough(feedAsHTML(itemFilter))

  return feed ?? <></>
}

const feedAsHTML = (itemFilter: (item: NewsFeedItem) => boolean) =>
  new TransformStream<NewsFeedItem, HTMLToken>({
    transform: async (item, controller) => {
      if (itemFilter(item)) {
        const summary = item.link ? (
          <a href={item.link}>{item.title ?? item.link}</a>
        ) : item.title ? (
          item.title
        ) : undefined
        const html = summary ? (
          <li>
            <details>
              <summary>{summary}</summary>
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
                  <></>
                )}
              </dl>
            </details>
          </li>
        ) : (
          // Don't show anything if a summary can't be generated.
          <></>
        )
        for await (const token of html) {
          controller.enqueue(token)
        }
      }
    },
  })

const parseFeed = (url: URL, saxParser: sax.SAXParser) =>
  new TransformStream<string, NewsFeedItem>({
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
    transform: (chunk, controller) => {
      try {
        saxParser.write(chunk)
      } catch (error) {
        console.error(error)
        controller.terminate()
      }
    },
  })
