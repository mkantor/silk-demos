import { page } from '@superhighway/loom'
import { createElement, type HTMLToken, type ReadableHTMLStream } from '@superhighway/silk'
import sax from 'sax'
import { parseFeed, type NewsFeedItem } from '../../feedParsing.js'
import { mergeStreams, readableStreamFromPromise } from '../../streamUtilities.js'

/**
 * This page consists of a `<form>` to manage a list of feed URLs, followed by
 * the aggregated news feed itself, which is a `<ul>` of links with additional
 * metadata in `<details>` elements.
 *
 * Everything is as non-blocking as possible:
 *  - HTTP requests to fetch feeds are initiated concurrently.
 *  - The response body of each feed is run through a streaming SAX parser.
 *  - Feed items are transformed to HTML and flushed as soon as possible
 *    (whenever an `</item>` closing tag is encountered in the source XML).
 *  - The `ReadableHTMLStream` returned from `aggregatedFeedFromURLs` is a
 *    merge of each individual input feed's stream. As soon as a rendered item
 *    becomes available from any input feed it is flushed to the merged output.
 *
 * The result is a stream which emits an `<li>` element for each feed item as
 * soon as the bytes specifying that specific item are received and processed.
 * Because requests are processed concurrently, the order of feed items on the
 * page depends on the speed/latency of each feed's web server, with items from
 * faster-responding servers ending up near the top of the list.
 */
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

/**
 * Concurrently fetch and transform feeds from a `Set` of `URL`s. The return
 * value is an unordered merge of the results.
 */
const aggregatedFeedFromURLs = async (props: {
  readonly urls: ReadonlySet<URL>
  readonly itemFilter: (item: NewsFeedItem) => boolean
}): Promise<ReadableHTMLStream> => {
  const feedsAsHTML = new Set<ReadableHTMLStream>()
  for (const url of props.urls.values()) {
    const feedAsHTML = fetchFeedAsHTML({
      url,
      itemFilter: props.itemFilter,
    })
    feedsAsHTML.add(readableStreamFromPromise<HTMLToken>(feedAsHTML))
  }
  return mergeStreams(feedsAsHTML)
}

/**
 * Fetch an individual feed and transform its items to HTML (except those for
 * which `itemFilter` returns `false`).
 */
const fetchFeedAsHTML = async (props: {
  readonly url: URL
  readonly itemFilter: (item: NewsFeedItem) => boolean
}): Promise<ReadableHTMLStream> => {
  let response
  try {
    response = await fetch(props.url)
  } catch (error) {
    console.error(error)
    return <></>
  }

  const feed: ReadableHTMLStream | undefined = response.body
    ?.pipeThrough(new TextDecoderStream('utf-8'))
    .pipeThrough(parseFeed(props.url, sax.parser(/* strict */ true, { trim: true })))
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

const transformFeedItemsToHTML = (itemFilter: (item: NewsFeedItem) => boolean) =>
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
