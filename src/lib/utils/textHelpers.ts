/**
 * 選択範囲にルビを挿入
 * 選択: "漢字" → "｜漢字《よみ》"
 * 未選択: カーソル位置に "｜《》" を挿入
 */
export function insertRuby(
  textarea: HTMLTextAreaElement,
  reading = ''
): { value: string; selectionStart: number; selectionEnd: number } {
  const { value, selectionStart: ss, selectionEnd: se } = textarea
  const selected = value.slice(ss, se)
  const inserted = selected
    ? `｜${selected}《${reading}》`
    : `｜《${reading}》`
  const before = value.slice(0, ss)
  const after = value.slice(se)
  const next = before + inserted + after
  // カーソルをルビ読み仮名の内側に
  const rubyStart = before.length + (selected ? 1 + selected.length + 1 : 1 + 1)
  return { value: next, selectionStart: rubyStart, selectionEnd: rubyStart + reading.length }
}

/**
 * 選択範囲に傍点を挿入
 * 選択: "強調" → "《《強調》》"
 */
export function insertBouten(
  textarea: HTMLTextAreaElement
): { value: string; selectionStart: number; selectionEnd: number } {
  const { value, selectionStart: ss, selectionEnd: se } = textarea
  const selected = value.slice(ss, se)
  const inserted = `《《${selected}》》`
  const before = value.slice(0, ss)
  const after = value.slice(se)
  const next = before + inserted + after
  const newPos = before.length + inserted.length
  return { value: next, selectionStart: newPos, selectionEnd: newPos }
}

/**
 * 選択範囲を二重ダッシュで囲む（または挿入）
 */
export function insertDash(
  textarea: HTMLTextAreaElement
): { value: string; selectionStart: number; selectionEnd: number } {
  const { value, selectionStart: ss, selectionEnd: se } = textarea
  const dash = '──'
  const before = value.slice(0, ss)
  const after = value.slice(se)
  const next = before + dash + after
  const newPos = ss + dash.length
  return { value: next, selectionStart: newPos, selectionEnd: newPos }
}

/**
 * 文字数カウント（絵文字・結合文字対応）
 */
export function countChars(text: string): number {
  return [...text].length
}
