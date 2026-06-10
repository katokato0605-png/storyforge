import { exportAll, importFromJSON } from './exportImport'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const TABLE = 'sync_slots'

export function isConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY)
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY!,
    'Authorization': `Bearer ${SUPABASE_KEY!}`,
  }
}

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}

export async function pushSync(code: string): Promise<void> {
  if (!isConfigured()) throw new Error('Supabaseが設定されていません')
  const data = await exportAll()
  if (data.length > 800_000) {
    throw new Error(`データサイズが大きすぎます（${Math.round(data.length / 1024)}KB）。不要なデータを削除してください。`)
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ code, data, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`アップロード失敗 (${res.status})`)
}

export async function pullSync(code: string): Promise<{ projects: number; chapters: number }> {
  if (!isConfigured()) throw new Error('Supabaseが設定されていません')
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?code=eq.${encodeURIComponent(code)}&select=data`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error(`ダウンロード失敗 (${res.status})`)
  const rows = await res.json() as { data: string }[]
  if (rows.length === 0) throw new Error('そのコードのデータが見つかりません')
  return importFromJSON(rows[0].data)
}
