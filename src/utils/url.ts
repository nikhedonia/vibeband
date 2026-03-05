export function isRemoteUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('git@') ||
    url.includes('://')
  )
}
