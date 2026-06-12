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
        '普通の高校生', '優等生', '不良', 'ヤクザ', '格闘家',
        '料理人', '軍人', 'お嬢様', '執事', '侍',
        '忍者', '医者', '小学生', '弁護士', '相撲取り',
        'ボディビルダー', 'アメリカ人', '超能力者', '囚人', '殺し屋',
        '音楽家', '犬',
        '警察官', '無職のニート', '天才科学者', '売れない小説家', '詐欺師',
        '僧侶', '引退した刑事', '孤児院育ち', '貴族の末裔', '山岳救助隊員',
        '占い師', '教師', '芸人', 'YouTuber', '漁師',
        '農家', '建築士', '消防士', '救急隊員', '薬剤師',
        '看護師', '歯科医', '精神科医', '心理カウンセラー', '探偵',
        '泥棒', 'ハッカー', '傭兵', 'スパイ', '剣客',
        '商人', '冒険家', '船乗り', '海賊', 'プロゲーマー',
        'アニメーター', 'マンガ家', 'イラストレーター', 'ピアニスト', '歌手',
        '俳優', 'モデル', 'プロスポーツ選手', 'サッカー選手', '野球選手',
        '柔道家', 'ボクサー', 'バレーダンサー', 'パティシエ', 'バーテンダー',
        'ソムリエ', '元カルト信者', '難民', '富豪の御曹司', '破産した実業家',
        '宗教家', '政治家', '外交官', '通訳', 'ジャーナリスト',
        '戦場カメラマン', 'NGO職員', '獣医師', '森林官', '潜水士',
        'パイロット', 'AI研究者', 'ゲームデザイナー', '株式トレーダー', '葬儀屋',
        '霊媒師', '骨董商', '古書店主', '図書館司書', '元死刑囚',
        '宇宙飛行士候補', '移民一世', '老舗旅館の若旦那', '花街育ち', '修道士',
        '元プロ野球選手', '山伏', '元アイドル', '現役大学院生', '孤独な天文学者',
      ],
    },
    {
      key: 'looks',
      label: '見た目',
      icon: '👁',
      items: [
        '中肉中背の普通の容姿', '自他ともに認める美少女', 'いかつい刺青の入ったガタイのいい男',
        '丸坊主の大男', 'スタイルのいいクールビューティー', '学ラン',
        'セーラー服', '漢服', 'チャイナドレス', 'かわいい童顔',
        '傷だらけ', '燕尾服', '痩せた青年', '金髪', 'ヒーローのコスプレ',
        '軍服', 'タンクトップ', '和服', '白衣', '優男',
        '優しそうな太っちょ', '目つきの悪い悪人顔', '悪そうなデブ', 'ゾンビのようにガリガリ',
        'ドレッドヘアー', '半裸',
        'ハゲ', '長身', '小柄', '銀髪', '片目が義眼',
        '不釣り合いに大きな手', '色白', '常に眠そうな目', '垢抜けない眼鏡', '常に笑顔',
        '猫背', 'いつも黒服', '無精ひげ', '整えられたひげ', 'くせっ毛',
        '長髪', 'ショートカット', '三つ編み', '白髪交じり', '赤毛',
        '巻き毛', '柔らかい目元', '高い鼻', 'そばかす', 'ほくろが多い',
        '大きな口', '厚い唇', '大きな耳', '義手', '義足',
        '車椅子利用者', '常に帽子', 'マスクが手放せない', 'サングラス常用',
        '指が欠けている', '首に傷がある', '常に手袋', '背中に古傷',
        '足を引きずっている', '金歯が一本ある', '口元に泣きぼくろ',
        '左右の目の色が違う', '額が広い', '顎が細い', '丸顔', '面長',
        '鷲鼻', '浅黒い肌', '陶磁器のような肌', '赤ら顔', '肩幅が広い',
        'なで肩', 'O脚', '長い指', '爪を常に噛んでいる', '目の下にクマ',
        '表情が乏しい', '常に汗をかいている', '体臭が独特', '煙草の匂いがする',
        '老け顔', '若く見える', '左利き', '吃音がある', '声が低い',
        '声が高い', 'ポニーテール', '編み込みヘア', '七三分け', '常にスーツ',
        '常にジャージ', '目が細い', '細い眉', '太い眉', '首が長い',
        '爪が長い', '異様に白い歯', '顔が左右非対称', '生え際が薄い', '笑うとえくぼ',
      ],
    },
    {
      key: 'personality',
      label: '性格',
      icon: '🧠',
      items: [
        '陽気', '陰気', '怒りっぽい', '無表情', '冷酷',
        '無慈悲', '冷静沈着', '朗らか', '二重人格', '怖がり',
        '内気', '社交的', '孤高', '無気力', '狂人',
        '戦闘狂',
        '穏やか', '計算高い', '天真爛漫', '皮肉屋', '過度に正直',
        '無口', '世話好き', '完璧主義', '楽観的', 'ひねくれ者',
        '義理堅い', '飽き性', '秘密主義', '好奇心旺盛', '慎重',
        '衝動的', '頑固', '柔軟', '優しい', '感情的',
        '論理的', '直感的', '夢想家', '現実主義', '嫉妬深い',
        '寛大', '自己中心的', '自己犠牲的', '負けず嫌い', '諦めが早い',
        '誠実', '不誠実', 'おっちょこちょい', '几帳面', '神経質',
        '大らか', '悲観的', '野心家', '謙虚', '傲慢',
        'お節介', '無関心', '執念深い', '忘れっぽい', '記憶力が鋭い',
        'お金に細かい', '太っ腹', '冒険好き', '安定志向',
        '恩を忘れない', '恨みがましい', '依存心が強い', '自立心が強い',
        '責任感が強い', '嘘をつくのが上手い', '正義感が強い',
        '反抗心が強い', '従順', '妄想癖がある', 'プレッシャーに強い',
        'プレッシャーに弱い', 'ユーモアがある', '自虐的',
        '罪悪感を持ちやすい', '道徳観が強い', '道徳に無頓着',
        '不器用', '手先が器用', '計画魔', '行き当たりばったり',
        '人の顔色を窺いすぎる', '全く空気を読まない', '共感力が高い', '共感力が低い',
        '熱しやすく冷めやすい', '一途', '凝り性', '話し上手', '聞き上手',
        '説教好き', '愚痴が多い', '自分を過大評価する', '自分を過小評価する',
        '疑り深い', '人を信じやすい', '変化を好む', '変化を恐れる',
        '規則を破りたがる', '秩序を重んじる',
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
            <span class="cm-cat-count">{items.length}種類</span>
            <button
              class="cm-edit-btn"
              class:active={editingCategory === cat.key}
              onclick={() => { editingCategory = editingCategory === cat.key ? null : cat.key; newItemText = '' }}
            >{editingCategory === cat.key ? '完了' : '＋ 編集'}</button>
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
  .cm-edit-btn   { background: var(--surface2); border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; color: var(--muted); transition: .15s; font-family: inherit }
  .cm-edit-btn:hover { color: var(--text); border-color: var(--accent) }
  .cm-edit-btn.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent) }

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
