import { describe, it, expect } from 'vitest'
import { insertRuby, insertBouten, insertDash } from './textHelpers'

function makeTextarea(value: string, ss: number, se: number): HTMLTextAreaElement {
  return { value, selectionStart: ss, selectionEnd: se } as HTMLTextAreaElement
}

describe('insertRuby', () => {
  it('選択テキストをルビで囲む', () => {
    const ta = makeTextarea('漢字テスト', 0, 2)
    const r = insertRuby(ta, 'かんじ')
    expect(r.value).toBe('｜漢字《かんじ》テスト')
    expect(r.selectionStart).toBe(4)
    expect(r.selectionEnd).toBe(7)
  })

  it('未選択時は空ルビを挿入', () => {
    const ta = makeTextarea('abc', 1, 1)
    const r = insertRuby(ta, 'よみ')
    expect(r.value).toBe('a｜《よみ》bc')
    expect(r.selectionStart).toBe(3)
    expect(r.selectionEnd).toBe(5)
  })

  it('reading が空でもルビ記号を挿入', () => {
    const ta = makeTextarea('漢字', 0, 2)
    const r = insertRuby(ta, '')
    expect(r.value).toBe('｜漢字《》')
  })

  it('文末の選択に対応', () => {
    const ta = makeTextarea('abc', 1, 3)
    const r = insertRuby(ta, 'よみ')
    expect(r.value).toBe('a｜bc《よみ》')
  })

  it('空文字列全体の選択', () => {
    const ta = makeTextarea('', 0, 0)
    const r = insertRuby(ta, 'よみ')
    expect(r.value).toBe('｜《よみ》')
  })
})

describe('insertBouten', () => {
  it('選択テキストを傍点で囲む', () => {
    const ta = makeTextarea('強調テスト', 0, 2)
    const r = insertBouten(ta)
    expect(r.value).toBe('《《強調》》テスト')
    expect(r.selectionStart).toBe(r.selectionEnd)
    expect(r.selectionStart).toBe('《《強調》》'.length)
  })

  it('未選択時も傍点記号を挿入', () => {
    const ta = makeTextarea('abc', 2, 2)
    const r = insertBouten(ta)
    expect(r.value).toBe('ab《《》》c')
  })

  it('全テキスト選択', () => {
    const ta = makeTextarea('全部', 0, 2)
    const r = insertBouten(ta)
    expect(r.value).toBe('《《全部》》')
  })
})

describe('insertDash', () => {
  it('カーソル位置にダッシュを挿入', () => {
    const ta = makeTextarea('abc', 1, 1)
    const r = insertDash(ta)
    expect(r.value).toBe('a──bc')
    expect(r.selectionStart).toBe(3)
    expect(r.selectionEnd).toBe(3)
  })

  it('選択範囲をダッシュで置換', () => {
    const ta = makeTextarea('abc', 0, 3)
    const r = insertDash(ta)
    expect(r.value).toBe('──')
    expect(r.selectionStart).toBe(2)
  })

  it('文頭に挿入', () => {
    const ta = makeTextarea('abc', 0, 0)
    const r = insertDash(ta)
    expect(r.value).toBe('──abc')
  })

  it('文末に挿入', () => {
    const ta = makeTextarea('abc', 3, 3)
    const r = insertDash(ta)
    expect(r.value).toBe('abc──')
  })

  it('空文字列に挿入', () => {
    const ta = makeTextarea('', 0, 0)
    const r = insertDash(ta)
    expect(r.value).toBe('──')
  })
})
