export interface MatchSnippet {
  before: string
  match: string
  after: string
  index: number
}

export interface ChapterHit {
  chapterId: string
  chapterTitle: string
  order: number
  snippets: MatchSnippet[]
  totalCount: number
}

export function searchInChapters(
  chapters: Array<{ id: string; title: string; content: string; order: number }>,
  query: string,
  maxSnippetsPerChapter = 3
): ChapterHit[] {
  if (!query) return []
  const results: ChapterHit[] = []

  for (const ch of chapters) {
    const content = ch.content
    const snippets: MatchSnippet[] = []
    let pos = 0
    let totalCount = 0

    while (pos < content.length) {
      const idx = content.indexOf(query, pos)
      if (idx === -1) break
      totalCount++
      if (snippets.length < maxSnippetsPerChapter) {
        const start = Math.max(0, idx - 15)
        const end = Math.min(content.length, idx + query.length + 15)
        snippets.push({
          before: (start > 0 ? '…' : '') + content.slice(start, idx),
          match: content.slice(idx, idx + query.length),
          after: content.slice(idx + query.length, end) + (end < content.length ? '…' : ''),
          index: idx,
        })
      }
      pos = idx + query.length
    }

    if (totalCount > 0) {
      results.push({ chapterId: ch.id, chapterTitle: ch.title, order: ch.order, snippets, totalCount })
    }
  }

  return results.sort((a, b) => a.order - b.order)
}

export function replaceInContent(
  content: string,
  query: string,
  replacement: string
): { content: string; count: number } {
  if (!query) return { content, count: 0 }
  let count = 0
  const parts = content.split(query)
  count = parts.length - 1
  return { content: parts.join(replacement), count }
}
