import { createElement } from '@superhighway/silk'

export const layout = (
  props: {
    readonly title: string
    readonly request: Request
  },
  children: createElement.JSX.Children,
) => {
  const currentRoute = decodeURI(new URL(props.request.url).pathname)
  const link = navigationLink(currentRoute)
  return (
    <html lang="en">
      <head>
        <title>{props.title}</title>
        <meta name="viewport" content="width=device-width" />
        <link rel="stylesheet" href="style.css" />
      </head>
      <body>
        <header>
          <h1>My Blog</h1>
          <nav>
            <ul>
              {[
                { href: '/', text: 'Most Recent Post' },
                { href: '/archive', text: 'Archive' },
                { href: '/about', text: 'About Me' },
              ].map(destination => (
                <li>{link(destination)}</li>
              ))}
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <small>© {thisYear.toFixed(0)} Person McPersonface</small>
        </footer>
      </body>
    </html>
  )
}

const navigationLink =
  (currentHref: string) => (props: { readonly href: string; readonly text: string }) => (
    <a href={props.href} class={props.href === currentHref ? 'current' : ''}>
      {props.text}
    </a>
  )

const thisYear = new Date().getUTCFullYear()
