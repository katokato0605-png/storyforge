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
        '元外科医', '錬金術師', '吟遊詩人', '遊牧民の末裔', '地下闘技場の主催者',
        '孤島の灯台守', '廃屋に住む隠者', '記憶を失った旅人', '呪われた王族', '人形師',
        '伝説の賞金稼ぎ', '秘密結社の構成員', '砂漠の商隊長', '義賊', '復讐者',
        // 追加分
        '元傭兵で今は農夫', '廃貴族の子', '孤独な旅芸人', '流浪の剣士', '夜逃げ屋',
        '武器商人', '毒使い', '爆発物処理班', '元麻薬捜査官', '地下水路の案内人',
        '競馬騎手', 'フィギュアスケーター', '水泳選手', 'マラソンランナー', '射撃選手',
        'アーチェリー選手', '体操選手', 'クライマー', 'チェスの達人', 'マジシャン',
        'サーカス団員', '腹話術師', '奇術師', '蛇使い', '猛獣使い',
        '養蜂家', '茶農家', '酒蔵の杜氏', '陶芸家', '染物師',
        '蒔絵師', '刀鍛冶', '甲冑師', '弓師', '箱根細工職人',
        '活版印刷工', '写本僧', '暗号解読者', '地図製作者', '測量士',
        '海底探検家', '洞窟探検家', '砂漠の地質学者', '北極探検家', '火山学者',
        '昆虫学者', '植物学者', '鳥類学者', '人類学者', '考古学者',
        '法医学者', '毒物学者', '催眠術師', '記憶術師', '言語学者',
        '哲学者', '神学者', '陰謀論者', '預言者', '異端審問官',
        '武芸百般の達人', '複数の顔を持つ二重スパイ', '神に選ばれた子', '悪魔と契約した者', '不死者',
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
        '全身に包帯を巻いている', '仮面をつけている', '燃え残りのような焦げ跡', '羽織を翻す立ち姿',
        '極端に目が大きい', '鎖骨が際立つ', 'タトゥーが首まである', '輝くような金色の瞳',
        '常に扇子を持っている', '爪に模様が彫られている', '透き通るような青い目',
        // 追加分
        '常に杖をついている', '眼帯をしている', '片耳にだけピアス', '首に数珠を巻いている',
        '常にフード付きコートを着ている', '全身黒いタイツのような服', '裾が長いコート', '軍用ブーツ',
        '薄汚れた旅人の格好', '豪華な刺繍の入った衣', '継ぎ接ぎだらけの服', '白いターバン',
        '体が異様に大きい', '体が異様に小さい（成人）', '全体的に存在感が薄い', '異様に目立つ風貌',
        '美しすぎて性別が判断しにくい', '老人のような肌に若い目', '子供のような体に老いた目',
        '常に血の匂いがする', '花の香りがする', '雨の匂いがする',
        '肌に古代文字のような痣', '額に大きな傷', '頬に三本の爪痕', '耳が欠けている',
        '極端に細い腰', '鋼鉄のような筋肉', '骨張った手', '水かきのような指の間',
        '爪が常に黒い', '黒い涙の跡のような隈', '血のように赤い瞳', '完全に白い虹彩',
        '纏う空気が冷たい', '常に微笑んでいるが目は笑っていない', '美しい所作', '崩れた姿勢',
        '常に何かを食べている', '常に本を持っている', '常に楽器を持ち歩いている',
        '動くたびに鎖の音がする', '纏うと必ず風が吹く', '全身に鳥肌が立っている',
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
        '死を恐れない', '過去に囚われている', '未来しか見ない', '矛盾を抱えている',
        '愛情に飢えている', '孤独を愛している', '笑顔の裏に深い悲しみがある',
        '子どもに異様に優しい', '弱者を見捨てられない', '強者にのみ従う',
        '美しいものに執着する', '破壊衝動がある', '記憶を封印している',
        // 追加分
        '常に仮面を被っている', '本音を絶対に言わない', '本音しか言わない', '感情の起伏が極端',
        '静かだが一度怒ると手がつけられない', '笑っているときが最も危険', '泣き顔を誰にも見せない',
        '恐怖を感じない', '痛みを感じない', '快楽を感じない', '何事にも飽きない',
        '何事にもすぐ飽きる', '死を望んでいる', '生に執着している', '自分の正体を知らない',
        '自分が何者か探している', '目的のためなら手段を選ばない', '手段にこだわりすぎて目的を忘れる',
        '愛する人のためなら悪にもなれる', '愛する人を守るために遠ざける',
        '孤独を選んでいるのに孤独が怖い', '集団にいると安心するが窒息感を覚える',
        '他人に期待しない', '他人に過度に期待する', '裏切られた経験から誰も信じない',
        '裏切られても信じ続ける', '感情を数値で考える', '物事を詩的に捉える',
        '死んだ人間と話す癖がある', '架空の友人がいる', '独り言が多い', '無意識に歌う',
        '意図せず人を惹きつける魅力がある', '意図せず人を遠ざけてしまう',
        '嘘と真実を使い分けて自己を守る', '自分の感情を他人の感情だと思っている',
        '自分が壊れていると自覚している', '自分が壊れていると気づいていない',
        '世界の終わりを望んでいる', '世界を救いたいが方法がわからない',
        'すべてを諦めた顔をしているが諦めていない', '笑顔でいるのが習慣で本音がわからない',
      ],
    },
  ]

  let customItems = $state<Record<string, string[]>>({
    backbone: [...categories[0].items],
    looks: [...categories[1].items],
    personality: [...categories[2].items],
  })

  let result = $state<Record<string, string> | null>(null)
  let saveSuccess = $state(false)
  let editingCategory = $state<string | null>(null)
  let newItemText = $state('')
  let pinned = $state<Record<string, boolean>>({ backbone: false, looks: false, personality: false })
  let searchingCard = $state<string | null>(null)
  let cardSearch = $state<Record<string, string>>({ backbone: '', looks: '', personality: '' })

  function pickRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function generate() {
    const next: Record<string, string> = {}
    for (const cat of categories) {
      if (pinned[cat.key] && result?.[cat.key]) {
        next[cat.key] = result[cat.key]
      } else {
        next[cat.key] = pickRandom(customItems[cat.key])
      }
    }
    result = next
    saveSuccess = false
  }

  function addItem(key: string) {
    const text = newItemText.trim()
    if (!text) return
    customItems[key] = [...customItems[key], text]
    newItemText = ''
  }

  function removeItem(key: string, idx: number) {
    const filtered = customItems[key].filter((_, i) => i !== idx)
    customItems[key] = filtered
  }

  function resetCategory(key: string) {
    const cat = categories.find(c => c.key === key)
    if (cat) customItems[key] = [...cat.items]
  }

  function filteredCardItems(key: string) {
    const q = cardSearch[key].trim().toLowerCase()
    if (!q) return customItems[key]
    return customItems[key].filter(item => item.toLowerCase().includes(q))
  }

  function selectCardItem(key: string, item: string) {
    if (result) result = { ...result, [key]: item }
    searchingCard = null
    cardSearch[key] = ''
    saveSuccess = false
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
        <div class="cm-cat">
          <div class="cm-cat-header">
            <span class="cm-cat-icon">{cat.icon}</span>
            <span class="cm-cat-label">{cat.label}</span>
            <span class="cm-cat-count">{customItems[cat.key].length}種類</span>
            <button
              class="cm-edit-btn"
              class:active={editingCategory === cat.key}
              onclick={() => { editingCategory = editingCategory === cat.key ? null : cat.key; newItemText = '' }}
            >{editingCategory === cat.key ? '完了' : '＋ 編集'}</button>
          </div>

          <div class="cm-tags">
            {#each customItems[cat.key] as item, i}
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
            {@const isSearching = searchingCard === cat.key}
            {@const hits = filteredCardItems(cat.key)}
            <div class="cm-result-card" class:pinned={pinned[cat.key]}>
              <div class="cm-result-cat-row">
                <span class="cm-result-cat">{cat.icon} {cat.label}</span>
                <div class="cm-card-actions">
                  <button
                    class="cm-search-toggle"
                    class:active={isSearching}
                    onclick={() => { searchingCard = isSearching ? null : cat.key; cardSearch[cat.key] = '' }}
                    title="手動で選択"
                    aria-label="検索して選択"
                  >🔍</button>
                  <button
                    class="cm-pin-btn"
                    class:active={pinned[cat.key]}
                    onclick={() => pinned[cat.key] = !pinned[cat.key]}
                    title={pinned[cat.key] ? '固定解除' : '固定（再生成でも変わらない）'}
                    aria-label={pinned[cat.key] ? '固定解除' : '固定'}
                  >{pinned[cat.key] ? '📌' : '📍'}</button>
                </div>
              </div>
              <div class="cm-result-val">{result[cat.key]}</div>
              {#if pinned[cat.key]}
                <div class="cm-pin-label">固定中</div>
              {/if}
              {#if isSearching}
                <div class="cm-card-search">
                  <input
                    class="fi cm-card-search-input"
                    placeholder="絞り込み…"
                    value={cardSearch[cat.key]}
                    oninput={e => cardSearch[cat.key] = (e.target as HTMLInputElement).value}
                    autofocus
                  />
                  <div class="cm-card-search-list">
                    {#each hits as item}
                      <button
                        class="cm-card-search-item"
                        class:current={item === result[cat.key]}
                        onclick={() => selectCardItem(cat.key, item)}
                      >{item}</button>
                    {/each}
                    {#if hits.length === 0}
                      <span class="cm-no-match">一致なし</span>
                    {/if}
                  </div>
                </div>
              {/if}
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
  .cm-no-match { font-size: 12px; color: var(--muted); font-style: italic; padding: 4px 2px }

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
  .cm-result-card { flex: 1; min-width: 120px; background: var(--surface2); border-radius: 10px; padding: 12px 14px; transition: border .15s; border: 2px solid transparent }
  .cm-result-card.pinned { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface2)) }
  .cm-result-cat-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px }
  .cm-result-cat  { font-size: 11px; color: var(--muted) }
  .cm-result-val  { font-size: 15px; font-weight: 700 }
  .cm-card-actions { display: flex; align-items: center; gap: 4px }
  .cm-search-toggle { background: none; border: none; cursor: pointer; font-size: 13px; padding: 0; opacity: .4; transition: opacity .15s }
  .cm-search-toggle:hover { opacity: 1 }
  .cm-search-toggle.active { opacity: 1 }
  .cm-pin-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 0; opacity: .5; transition: opacity .15s, transform .1s }
  .cm-pin-btn:hover { opacity: 1 }
  .cm-pin-btn.active { opacity: 1; transform: rotate(-15deg) }
  .cm-pin-label { font-size: 10px; font-weight: 700; color: var(--accent); letter-spacing: .5px; margin-top: 4px }
  .cm-card-search { margin-top: 8px; display: flex; flex-direction: column; gap: 6px }
  .cm-card-search-input { font-size: 12px; padding: 5px 10px; border-radius: 8px; width: 100%; box-sizing: border-box }
  .cm-card-search-list { max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface) }
  .cm-card-search-item { background: none; border: none; cursor: pointer; text-align: left; padding: 6px 10px; font-size: 12px; color: var(--text); font-family: inherit; transition: background .1s; border-radius: 6px }
  .cm-card-search-item:hover { background: var(--surface2) }
  .cm-card-search-item.current { color: var(--accent); font-weight: 700 }
  .cm-result-summary { font-size: 13px; color: var(--muted); line-height: 1.7; background: var(--surface2); border-radius: 8px; padding: 10px 14px }
  .cm-result-summary strong { color: var(--text) }
  .cm-result-actions { display: flex; gap: 8px; flex-wrap: wrap }
</style>
