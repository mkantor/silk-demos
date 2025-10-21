import { page } from '@superhighway/loom'
import {
  createElement,
  type HTMLToken,
  type ReadableHTMLTokenStream,
} from '@superhighway/silk'
import sax from 'sax'
import { parseFeed, type NewsFeedItem } from '../feedParsing.js'
import { mergeStreams, readableStreamFromPromise } from '../streamUtilities.js'

export default page(request => {
  const queryParameters = new URL(request.url).searchParams

  const feedURLsAsArray =
    queryParameters
      .get(feedURLKey)
      ?.split('\n')
      ?.flatMap(urlAsString => {
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
        <meta name="viewport" content="width=device-width" />
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
              {feedURLsAsArray.flatMap(url => [url.href, '\n'])}
            </textarea>
          </label>
          <input type="submit" value="Refresh Feeds" />
        </form>
        <div>
          <ul>
            {aggregatedFeedFromURLs({
              urls: new Set(feedURLsAsArray),
              itemFilter: item => {
                if (!item.link) {
                  return false
                }
                // Only show each unique `<link>` once.
                const seen = seenLinks.has(item.link)
                seenLinks.add(item.link)
                return !seen
              },
            })}
          </ul>
        </div>
      </body>
    </html>
  )
})

const feedURLKey = 'feed-url'

const defaultFeedURLs = [
  'https://feeds.arstechnica.com/arstechnica/features',
  'https://feeds.arstechnica.com/arstechnica/gadgets',
  'https://feeds.arstechnica.com/arstechnica/gaming',
  'https://feeds.arstechnica.com/arstechnica/science',
  'https://feeds.arstechnica.com/arstechnica/technology-lab',
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://feeds.bbci.co.uk/news/health/rss.xml',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bloomberg.com/markets/news.rss',
  'https://feeds.npr.org/1001/rss.xml', // news
  'https://feeds.npr.org/1006/rss.xml', // business
  'https://feeds.npr.org/1007/rss.xml', // science
  'https://feeds.npr.org/1019/rss.xml', // technology
  'https://feeds.npr.org/1026/rss.xml', // space
  'https://feeds.washingtonpost.com/rss/world',
  'https://globalnews.ca/world/feed/',
  'https://lwn.net/headlines/rss',
  'https://news.ycombinator.com/rss',
  'https://phys.org/rss-feed/',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://rss.slashdot.org/Slashdot/slashdotMain',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://www.economist.com/latest/rss.xml',
  'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  'https://www.nature.com/nature.rss',
  'https://www.newscientist.com/feed/home',
  'https://www.theguardian.com/world/rss',
].map(urlAsString => new URL(urlAsString))

const aggregatedFeedFromURLs = async (props: {
  readonly urls: ReadonlySet<URL>
  readonly itemFilter: (item: NewsFeedItem) => boolean
}): Promise<ReadableHTMLTokenStream> => {
  const feedsAsHTML = new Set<ReadableHTMLTokenStream>()
  for (const url of props.urls.values()) {
    const feedAsHTML = fetchFeedAsHTML({
      url,
      itemFilter: props.itemFilter,
    })
    feedsAsHTML.add(readableStreamFromPromise<HTMLToken>(feedAsHTML))
  }
  return mergeStreams(feedsAsHTML)
}

const fetchFeedAsHTML = async (props: {
  readonly url: URL
  readonly itemFilter: (item: NewsFeedItem) => boolean
}): Promise<ReadableHTMLTokenStream> => {
  let response
  try {
    response = await fetch(props.url)
  } catch (error) {
    console.error(error)
    return <></>
  }

  const feed: ReadableHTMLTokenStream | undefined = response.body
    ?.pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(
      parseFeed(props.url, sax.parser(/* strict */ true, { trim: true })),
    )
    .pipeThrough(transformFeedItemsToHTML(props.itemFilter))

  return feed ?? <></>
}

const feedItem = (item: NewsFeedItem) => {
  const summary = item.link ? (
    <a href={item.link}>{item.title?.trim() ?? item.link}</a>
  ) : item.title ? (
    item.title.trim()
  ) : undefined

  return summary ? (
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
  ) : (
    // Don't show anything if a summary can't be generated.
    <></>
  )
}

const transformFeedItemsToHTML = (
  itemFilter: (item: NewsFeedItem) => boolean,
) =>
  new TransformStream<NewsFeedItem, HTMLToken>({
    transform: async (item, controller) => {
      if (itemFilter(item)) {
        const html = <li>{feedItem(item)}</li>
        for await (const token of html) {
          controller.enqueue(token)
        }
      }
    },
  })
