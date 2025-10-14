export const getSlugOrThrow = (path: string): string => {
  const id = basenameSansExtension(path)
  assertTruthy(id, 'Could not determine slug')
  return id
}

const basenameSansExtension = (path: string): string | undefined =>
  path
    .split('/')
    .pop()
    ?.replace(/\.[^\.]*$/, '')

const assertTruthy: (value: unknown, message: string) => asserts value = (
  value,
  message,
) => {
  if (!value) {
    throw new Error(message)
  }
}
