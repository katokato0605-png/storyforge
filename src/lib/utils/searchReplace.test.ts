import { describe, it, expect } from 'vitest'
import { searchInChapters, replaceInContent } from './searchReplace'

const chapters = [
  { id: 'c1', title: '第一章', content: 'あいうえお。かきくけこ。あいうえお。', order: 0 },
  { id: 'c2', title: '第二章', content: '日本語テスト。StoryForge。日本語。', order: 1 },
  { id: 'c3', title: '空の章', content: '', order: 2 },
]

describe('searchInChapters', () => {
  it('マッチなしのときは空配列', () => {
    expect(searchInChapters(chapters, 'xyz')).toHaveLength(0)
  })

  it('クエリが空のときは空配列', () => {
    expect(searchInChapters(chapters, '')).toHaveLength(0)
  })

  it('日本語テキストを正しく検索する', () => {
    const results = searchInChapters(chapters, 'あいうえお')
    expect(results).toHaveLength(1)
    expect(results[0].chapterId).toBe('c1')
    expect(results[0].totalCount).toBe(2)
  })

  it('英語テキストを検索する', () => {
    const results = searchInChapters(chapters, 'StoryForge')
    expect(results).toHaveLength(1)
    expect(results[0].chapterId).toBe('c2')
    expect(results[0].totalCount).toBe(1)
  })

  it('複数章にまたがるヒット', () => {
    const results = searchInChapters(chapters, '語')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some(r => r.chapterId === 'c2')).toBe(true)
  })

  it('スニペットに before/match/after が含まれる', () => {
    const results = searchInChapters(chapters, 'あいうえお')
    expect(results[0].snippets[0].match).toBe('あいうえお')
  })

  it('order 順にソートされる', () => {
    const mixed = [
      { id: 'z', title: '後', content: 'x', order: 2 },
      { id: 'a', title: '先', content: 'x', order: 0 },
    ]
    const results = searchInChapters(mixed, 'x')
    expect(results[0].order).toBe(0)
    expect(results[1].order).toBe(2)
  })

  it('1章あたりのスニペットは maxSnippetsPerChapter 以下', () => {
    const ch = [{ id: 'r', title: 'test', content: 'aababababab', order: 0 }]
    const results = searchInChapters(ch, 'a', 2)
    expect(results[0].snippets.length).toBeLessThanOrEqual(2)
    expect(results[0].totalCount).toBeGreaterThan(2)
  })
})

describe('replaceInContent', () => {
  it('基本的な置換', () => {
    const { content, count } = replaceInContent('あいうえお', 'いう', 'XX')
    expect(content).toBe('あXXえお')
    expect(count).toBe(1)
  })

  it('全件置換のカウント', () => {
    const { content, count } = replaceInContent('ababab', 'ab', 'x')
    expect(content).toBe('xxx')
    expect(count).toBe(3)
  })

  it('クエリが空のときは変更なし', () => {
    const { content, count } = replaceInContent('テスト', '', 'X')
    expect(content).toBe('テスト')
    expect(count).toBe(0)
  })

  it('マッチなしのときは変更なし・count 0', () => {
    const { content, count } = replaceInContent('テスト', 'xyz', 'Z')
    expect(content).toBe('テスト')
    expect(count).toBe(0)
  })

  it('空文字への置換（削除）', () => {
    const { content, count } = replaceInContent('あいあい', 'い', '')
    expect(content).toBe('ああ')
    expect(count).toBe(2)
  })
})
