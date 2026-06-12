<script lang="ts">
  import { loreStore } from '../../lib/stores/loreStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'

  type Category = { key: 'backbone' | 'looks' | 'personality'; label: string; icon: string; items: string[] }

  const categories: Category[] = [
    {
      key: 'backbone',
      label: 'バックボーン',
      icon: '🎭',
      items: [
        '警察官', '高校の優等生', '元軍人', '無職のニート', '天才科学者',
        '売れない小説家', '医師', '詐欺師', '僧侶', '料理人',
        '引退した刑事', '孤児院育ち', '貴族の末裔', '山岳救助隊員', '占い師',
      ],
    },
    {
      key: 'looks',
      label: '見た目',
      icon: '👁',
      items: [
        'ガリガリ', 'ハゲ', '長身', '小柄', '強面',
        '童顔', '傷だらけ', '銀髪', '片目が義眼', '不釣り合いに大きな手',
        '色白', '常に眠そうな目', '派手な刺青', '垢抜けない眼鏡', '常に笑顔',
      ],
    },
    {
      key: 'personality',
      label: '性格',
      icon: '🧠',
      items: [
        '怒りっぽい', '穏やか', '計算高い', '天真爛漫', '皮肉屋',
        '過度に正直', '臆病', '無口', '世話好き', '完璧主義',
        '楽観的', 'ひねくれ者', '義理堅い', '飽き性', '秘密主義',
      ],
    },
  ]

  // State per category: selected items (editable list) + current random pick
  let customItems = $state<Record<string, string[]>>({
    backbone: [...categories[0].items],
    looks: [...categories[1].items],
    personality: [...categories[2].items],
  })

  let result = $state<Record<string, string> | null>(null)
  let saveSuccess = $state(false)
  let editingCategory = $state<string | null>(null)
  let newItemText = $state('')

  function pickRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function generate() {
    result = {
      backbone: pickRandom(customItems.backbone),
      looks: pickRandom(customItems.looks),
      personality: pickRandom(customItems.personality),
    }
    saveSuccess = false
  }

  function addItem(key: string) {
    const text = newItemText.trim()
    if (!text) return
    customItems[key] = [...customItems[key], text]
    newItemText = ''
  }

  function removeItem(key: string, idx: number) {
    customItems[key] = customItems[key].filter((_, i) => i !== idx)
  }

  function resetCategory(key: string) {
    const cat = categories.find(c => c.key === key)
    if (cat) customItems[key] = [...cat.items]
  }

  async function saveToLore() {
    if (!result || !projectStore.currentProjectId) return
    const title = `${result.backbone}・${result.looks}・${result.personality}`
    const content = `バックボーン: ${result.backbone}\n見た目: ${result.looks}\n性格: ${result.personality}`
    await loreStore.create(projectStore.currentProjectId, 'character', title, content, ['キャラクターメーカー'])
    saveSuccess = true
  }
</script>

<div class="cm-wrap">
  <div class="cm-header">
    <h2 class="cm-title">🎲 キャラクターメーカー</h2>
    <p class="cm-sub">各カテゴリからランダムに組み合わせてキャラクターを生成します</p>
  </div>

  <div class="cm-body">
    <!-- Categories -->
    <div class="cm-cats">
      {#each categories as cat}
        {@const items = customItems[cat.key]}
        <div class="cm-cat">
          <div class="cm-cat-header">
            <span class="cm-cat-icon">{cat.icon}</span>
            <span class="cm-cat-label">{cat.label}</span>
            <span class="cm-cat-count">{items.length}個</span>
            <button
              class="cm-edit-btn"
              class:active={editingCategory === cat.key}
              onclick={() => { editingCategory = editingCategory === cat.key ? null : cat.key; newItemText = '' }}
              aria-label="編集"
            >✏️</button>
          </div>

          <div class="cm-tags">
            {#each items as item, i}
              <span class="cm-tag" class:editing={editingCategory === cat.key}>
                {item}
                {#if editingCategory === cat.key}
                  <button class="cm-tag-del" onclick={() => removeItem(cat.key, i)} aria-label="削除">×</button>
                {/if}
              </span>
            {/each}
          </div>

          {#if editingCategory === cat.key}
            <div class="cm-add-row">
              <input
                class="fi cm-add-input"
                placeholder="新しい項目を追加…"
                value={newItemText}
                oninput={e => newItemText = (e.target as HTMLInputElement).value}
                onkeydown={e => { if (e.key === 'Enter') addItem(cat.key) }}
              />
              <button class="btn btn-primary btn-sm" onclick={() => addItem(cat.key)} disabled={!newItemText.trim()}>追加</button>
              <button class="btn btn-ghost btn-sm" onclick={() => resetCategory(cat.key)}>リセット</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Generate button -->
    <div class="cm-gen-area">
      <button class="btn-generate" onclick={generate}>
        <span class="gen-dice">🎲</span> ランダム生成
      </button>
    </div>

    <!-- Result -->
    {#if result}
      <div class="cm-result">
        <div class="cm-result-title">生成されたキャラクター</div>
        <div class="cm-result-cards">
          {#each categories as cat}
            <div class="cm-result-card">
              <div class="cm-result-cat">{cat.icon} {cat.label}</div>
              <div class="cm-result-val">{result[cat.key]}</div>
            </div>
          {/each}
        </div>
        <div class="cm-result-summary">
          「<strong>{result.backbone}</strong>」で「<strong>{result.looks}</strong>」な見た目の「<strong>{result.personality}</strong>」な人物
        </div>
        <div class="cm-result-actions">
          <button class="btn btn-primary btn-sm" onclick={generate}>もう一度</button>
          {#if projectStore.currentProjectId}
            <button class="btn btn-ghost btn-sm" onclick={saveToLore} disabled={saveSuccess}>
              {saveSuccess ? '✓ 設定資料に保存済み' : '設定資料に保存'}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .cm-wrap   { display: flex; flex-direction: column; height: 100%; overflow: hidden }
  .cm-header { padding: 16px 24px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .cm-title  { font-size: 16px; font-weight: 700; margin-bottom: 4px }
  .cm-sub    { font-size: 12px; color: var(--muted) }

  .cm-body   { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px }

  .cm-cats   { display: flex; flex-direction: column; gap: 14px }
  .cm-cat    { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px }

  .cm-cat-header { display: flex; align-items: center; gap: 8px }
  .cm-cat-icon   { font-size: 16px }
  .cm-cat-label  { font-size: 14px; font-weight: 700; flex: 1 }
  .cm-cat-count  { font-size: 11px; color: var(--muted) }
  .cm-edit-btn   { background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 6px; opacity: 0.5; transition: .15s }
  .cm-edit-btn:hover, .cm-edit-btn.active { opacity: 1; background: var(--surface2) }

  .cm-tags   { display: flex; flex-wrap: wrap; gap: 6px }
  .cm-tag    { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; color: var(--text) }
  .cm-tag.editing { padding-right: 4px }
  .cm-tag-del { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 13px; line-height: 1; padding: 0 2px; transition: color .1s }
  .cm-tag-del:hover { color: var(--danger, #e05) }

  .cm-add-row { display: flex; gap: 8px; align-items: center }
  .cm-add-input { flex: 1; font-size: 13px }

  .cm-gen-area { display: flex; justify-content: center }
  .btn-generate {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 36px; border-radius: 14px;
    background: var(--accent); color: #fff;
    font-size: 16px; font-weight: 700;
    border: none; cursor: pointer;
    transition: opacity .15s, transform .1s;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .btn-generate:hover  { opacity: .88 }
  .btn-generate:active { transform: scale(.97) }
  .gen-dice { font-size: 22px }

  .cm-result { background: var(--surface); border: 2px solid var(--accent); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px }
  .cm-result-title { font-size: 13px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: .5px }
  .cm-result-cards { display: flex; gap: 10px; flex-wrap: wrap }
  .cm-result-card { flex: 1; min-width: 120px; background: var(--surface2); border-radius: 10px; padding: 12px 14px }
  .cm-result-cat  { font-size: 11px; color: var(--muted); margin-bottom: 4px }
  .cm-result-val  { font-size: 15px; font-weight: 700 }
  .cm-result-summary { font-size: 13px; color: var(--muted); line-height: 1.7; background: var(--surface2); border-radius: 8px; padding: 10px 14px }
  .cm-result-summary strong { color: var(--text) }
  .cm-result-actions { display: flex; gap: 8px; flex-wrap: wrap }
</style>
