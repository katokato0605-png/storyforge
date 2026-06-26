<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { ideaStore } from '../../lib/stores/ideaStore.svelte'
  import { projectStore } from '../../lib/stores/projectStore.svelte'
  import { appStore } from '../../lib/stores/appStore.svelte'
  import { createDragSort } from '../../lib/utils/dragSort.svelte'
  import { PARADIGM_TABLE_HTML } from '../../lib/templates/paradigmTable'

  const ideaDs = createDragSort()
  let ideaOrder = $state<string[]>([])

  onMount(() => {
    try {
      const raw = localStorage.getItem('sf_idea_order')
      ideaOrder = raw ? JSON.parse(raw) : []
    } catch { ideaOrder = [] }
  })

  function saveIdeaOrder(ordered: { id: string }[]) {
    const newIds = ordered.map(i => i.id)
    const others = ideaOrder.filter(id => !newIds.includes(id))
    ideaOrder = [...newIds, ...others]
    localStorage.setItem('sf_idea_order', JSON.stringify(ideaOrder))
  }

  const TEMPLATES_LIST = [
    {
      label: '物語パラダイム表（図）',
      content: PARADIGM_TABLE_HTML,
    },
    {
      label: '物語力学：感情変位と達成率',
      content: `物語力学：連動する感情変位と達成率
出典：お絵描きホーホー論

━━ 2つの指標 ━━

【感情変位】
「理由」の達成を妨害されたことによる精神的な揺さぶりの振れ幅。
障害に直面したとき・対策が失敗したとき・予想外の展開が起きたときに増大する。
感情変位が大きいほど読者の感情が動く＝盛り上がる。

【達成率】
シナリオ概略の「理由」に対する進捗度。スタート地点より悪化すればマイナスにもなる。
必ずしも100%（完全達成）に到達するとは限らない。
達成できなかったこと自体にドラマ性を見出すのがバッドエンド・悲劇の手法。

【連動の法則】
感情変位と達成率はいずれも「理由」に対するパラメータなので連動して動く。
片方が停滞しているときは、もう片方の変化で補うと単調にならない。

━━ 自作の物語に当てはめる ━━

【理由（シナリオ概略より）】
→

場面ごとの変化を書き出す（①〜⑦など区切りを自由に設定）：

①　感情変位[　　]　達成率[　　]　場面：
②　感情変位[　　]　達成率[　　]　場面：
③　感情変位[　　]　達成率[　　]　場面：
④　感情変位[　　]　達成率[　　]　場面：
⑤　感情変位[　　]　達成率[　　]　場面：
⑥　感情変位[　　]　達成率[　　]　場面：
⑦　感情変位[　　]　達成率[　　]　場面：

━━ 物語パラダイム対応の参考例 ━━
①物語の導入部。　　　　　　　　　感情変位↔　達成率↔
②事件発生、崩される日常。　　　　感情変位↑　達成率↓
③一旦解決、覚悟する。　　　　　　感情変位↑　達成率↑
④大失敗、全てが台無しになる。　　感情変位↑↑　達成率↓↓
⑤立ち直れず惨めな日々。　　　　　感情変位↔　達成率↓
⑥きっかけを得て復活、全身全霊。　感情変位↑↑　達成率↑↑
⑦失ったものを受け入れ使命を果たす。感情変位↑　達成率→（不完全でも完結）

━━ チェック ━━
[ ] 感情変位が0のまま続く単調な区間が長すぎないか？
[ ] 達成率が停滞するときは感情変位で補えているか？
[ ] 感情変位が大きな場面はシーンとして描き込めているか？
[ ] 達成率のマイナス（悪化）を意図的に使えているか？
`,
    },
    {
      label: 'シナリオ概略グラフの4つの型',
      content: `シナリオ概略グラフの4つの型
出典：お絵描きホーホー論「シナリオ概略グラフで考える物語力学」

「行動」「理由」「障害」「対策」「結末」の関係性を、グラフの形で捉えると
物語展開の大まかなパターンが4つに分類できる。

━━━━━━━━━━━━━━━━━━━━

【① 突破型】
特徴：障害を力・勇気・根性で正面から打ち破る。迷いなく直進。
グラフ：行動・理由のベクトルが上へ一直線。障害は正面にあり対策で貫く。
感情変位：ほぼ0に近い（揺れが少ない）
達成率　：着実に上昇し最終的に完全達成
向いてる：友情・希望・爽快感を称えるジャンル。ヒーローもの・少年漫画など。
弱点　　：単調になりがちなので達成率の変化に緩急をつけることで補う。
代表例　：桃太郎

この型で考える自作の障害と対策：
　障害：
　対策：

━━━━━━━━━━━━━━━━━━━━

【② 回避型】
特徴：障害に真正面からぶつからず、耐えて・逃げて・すり抜けて目的を達成する。
グラフ：行動・理由のベクトルが進むが障害を迂回する動き。
感情変位：回避成功の瞬間に一気に増大して盛り上がる。
達成率　：じわじわ上がり、回避の瞬間に急上昇。
向いてる：理不尽な状況での静かな抵抗。社会派・感動系・サスペンスなど。
弱点　　：長い忍耐描写が続くと感情変位が落ちるため回避の爽快感で稼ぐ。
代表例　：ショーシャンクの空に

この型で考える自作の障害と回避手段：
　障害：
　回避の手段・タイミング：

━━━━━━━━━━━━━━━━━━━━

【③ 妥協型】
特徴：本来の目標には届かず、鉄壁の障害に阻まれたまま不本意な結末を迎える。
グラフ：行動・理由のベクトルが進むが障害に阻まれ続け、結末は横ズレする。
感情変位：障害に阻まれるたびに増大→バッドエンドでも感情変位は最大になりうる。
達成率　：本来の目標への達成率が見えなくなることで緊張感が生まれる。
向いてる：悲劇・純愛・バッドエンド。泣かせる作品全般。
弱点　　：「何のために見たのか」とならないよう感情変位の爆発で報いる必要がある。
代表例　：ロミオとジュリエット

この型で考える本来の目標と実際の結末：
　本来の目標（理由）：
　阻んだ障害：
　実際の結末（妥協点）：

━━━━━━━━━━━━━━━━━━━━

【④ 即興型】
特徴：次々と別の障害に振り回され、行動と理由が変化しながら最終的な結末へ向かう。
グラフ：複数の障害と対策が錯綜し、結末A〜Eなど複数候補が並ぶ。
感情変位：コンスタントに稼ぎ続ける。読者の予想を常に裏切る。
達成率　：一定せず行き来するが最終的に何らかの着地をする。
向いてる：ラブコメ・群像劇・エピソード型の連載漫画など。
弱点　　：軸（理由②本音）がぶれると散漫に見えるため、最終的な帰着点を先に決める。
代表例　：ToLOVEる・ハーレムラブコメ全般

この型で考える複数の障害と最終的な帰着点：
　障害①：　→　対策①：
　障害②：　→　対策②：
　障害③：　→　対策③：
　最終的な帰着点（結末）：

━━━━━━━━━━━━━━━━━━━━

【自作はどの型か？】
[ ] 突破型　── 力で乗り越える
[ ] 回避型　── 耐えてすり抜ける
[ ] 妥協型　── 阻まれて別の結末へ
[ ] 即興型　── 振り回されて着地する
[ ] 複合型　── （どの型を組み合わせているか）：

狙う感情変位の最大値は（物語のどこで最も感情が動くか）：
達成率は最終的に（完全達成 / 不完全 / マイナス / 不明）：
`,
    },
    {
      label: '普遍性と論理性のピラミッド',
      content: `普遍性と論理性のピラミッド
～トランプタワーのように基礎を固めてつみあげる～
出典：お絵描きホーホー論

考え方：
特殊な設定は単体では物語の中で「浮く」。
普遍的な設定（土台）に論理性（橋渡し）でつなぐことで初めて成立する。
下段が全て繋がっていないと上段を積み上げることができない。

設定の3階層：
　A～D層（土台）　衣食住・社会性・欲求・歴史など　← 説明不要で誰でも理解できる
　E～I層（中段）　特殊能力・陰謀・敵・職業など　　← 土台との論理的なズレで成立させる
　J層　（頂点）　物語の真相・解決策・勝敗など　　← 全層が繋がって初めて説得力を持つ

━━ 土台層（A～D）：普遍的な設定 ━━
※ここは説明なしで読者が理解できるレベル。現実の常識・感覚と一致していること。

【A｜衣食住】この世界の衣・食・住はどうなっているか？
→

【B｜社会性】人間関係・コミュニティ・権力構造はどうなっているか？
→

【C｜欲求】登場人物たちが普遍的に持っている欲求・感情は何か？
→

【D｜歴史・背景】この世界の過去に何があったか？（読者の常識と共鳴する歴史）
→

━━ 論理性（a～c）：土台層をつなぐ橋 ━━
※A～Dの設定同士を「なぜそうなのか」でつなぐ。

【論理a】AとBをつなぐ必然性（なぜこの社会でこの衣食住なのか）：
→

【論理b】BとCをつなぐ必然性（なぜこの社会でこの欲求が生まれるのか）：
→

【論理c】CとDをつなぐ必然性（なぜこの歴史でこの欲求が生まれたのか）：
→

━━ 中段層（E～I）：特殊な設定 ━━
※土台の「ズレ」として生まれる設定。単体で出すと浮くので必ず論理でつなぐ。

【E｜特殊能力・ルール】この世界固有の能力・魔法・技術は何か？
→

【F｜陰謀・秘密】物語の裏で動いている勢力・隠された事実は？
→

【G｜敵・対立構造】主人公に立ちはだかる存在・対立の構図は？
→

【H｜職業・役割】主人公や重要人物が担う特殊な社会的役割は？
→

【I｜その他の特殊設定】
→

━━ 論理性（d～f）：中段と土台をつなぐ橋 ━━
※「なぜ普遍的な世界にこの特殊設定が存在するのか」を言語化する。

【論理d】E（特殊能力）が生まれた土台（A～D）との必然性：
→

【論理e】F（陰謀）が生まれた土台（A～D）との必然性：
→

【論理f】G（敵）が生まれた土台・中段との必然性：
→

━━ 頂点（J）：物語の真相・核心 ━━
※全層が繋がって初めて説得力を持つ。ここだけ先に決めて逆算してもよい。

【J｜物語の真相】物語が最終的に明かす「本当のこと」は何か？
→

【J｜解決策】主人公はどうやって問題を解決するか？（全設定を使い切っているか？）
→

【J｜勝敗・結末】誰が何を得て、何を失うか？
→

━━ 浮き検証チェック ━━
特殊設定を追加したとき、以下を確認する。

[ ] この特殊設定は土台（A～D）のどれかと論理でつながっているか？
[ ] 読者が知らない前提を説明なしで要求していないか？
[ ] キャラクターの反応がこの世界の常識と一致しているか？
[ ] 頂点Jは全ての下段設定を使っているか（無駄な設定・未回収の設定はないか）？
[ ] 土台だけで読んでも世界として成立するか（特殊設定なしで読んだとき）？
`,
    },
    {
      label: 'プロップの31の機能',
      content: `プロップの31の機能（民話の形態学）
使い方：当てはまる機能にチェックを入れ、あなたの物語に合わせて内容を書き込んでください。

━━ 導入部 ━━

① 不在
[ ] 家族・仲間の誰かが家を離れる、またはいなくなる
→ 欠如・空白が物語のきっかけになる
内容：

② 禁止
[ ] 主人公に対して「〜してはならない」という禁止が課される
→ この禁止が後に破られることで事件が始まる
内容：

③ 違反
[ ] 禁止が破られる
→ 破ることで主人公は危機の引き金を引く
内容：

④ 偵察
[ ] 敵・悪の存在が情報収集・調査を行う
→ 敵が主人公や弱点について何かを探る
内容：

⑤ 漏洩
[ ] 敵に情報が渡ってしまう
→ 主人公の居場所・弱点・秘密が知られる
内容：

⑥ 謀略
[ ] 敵が主人公を欺こうとする
→ 変装・嘘・罠などで主人公を騙す計画を立てる
内容：

⑦ 共謀（欺瞞の成功）
[ ] 主人公が騙される、または敵の言いなりになる
→ 主人公が意図せず加担してしまう
内容：

━━ 本編（発端） ━━

⑧ 加害 / 欠如
[ ] 家族が傷つけられる、または何か大切なものが失われる ★物語の核心★
→ 「取り戻す」「復讐する」「救出する」ための動機が生まれる
内容：

⑨ 仲介
[ ] 不幸・欠如が知られ、主人公に依頼・要請・命令が届く
→ 主人公が行動を起こすよう求められる
内容：

⑩ 反作用の開始
[ ] 主人公が欠如の解消・問題解決を決意する
→ 「やってやる」という意志が固まる瞬間
内容：

⑪ 出発
[ ] 主人公が旅立つ・家を出る・未知の世界へ踏み出す
内容：

━━ 試練と援助 ━━

⑫ 贈与者との出会い
[ ] 主人公は魔法の道具・知恵・力をくれる存在に出会う
→ 老人・妖精・謎の人物などが典型
内容：

⑬ 主人公の反応（試練への応答）
[ ] 主人公は試練・質問・戦いに対して行動で応える
→ 優しさ・勇気・知恵などを示す場面
内容：

⑭ 魔法の道具の獲得
[ ] 主人公がアイテム・能力・情報・仲間を手に入れる
内容：

⑮ 目的地への移動
[ ] 主人公が目的の場所（悪のいる地など）へ向かう
→ 空間的・精神的な「旅」を表す
内容：

━━ 対決と解決 ━━

⑯ 悪との対決
[ ] 主人公と敵が直接ぶつかる
→ 戦闘・議論・競技など形式は問わない
内容：

⑰ 主人公に刻印が押される
[ ] 主人公が傷を負う、または特別な印をつけられる
→ 後で身元証明に使われることも
内容：

⑱ 悪の克服
[ ] 敵・悪の力が打ち負かされる
内容：

⑲ 最初の不幸・欠如の解消
[ ] ⑧で失われたものが取り戻される・問題が解決される
内容：

━━ 帰還と試練 ━━

⑳ 帰還
[ ] 主人公が帰路につく
内容：

㉑ 追跡
[ ] 主人公が敵・残党・別の悪に追われる
内容：

㉒ 救出
[ ] 主人公が追跡から逃れる・救われる
内容：

㉓ 偽主人公の先着
[ ] 本物の主人公より先に偽物（ライバル・兄弟など）が帰り、手柄を横取りしようとする
内容：

━━ 真実の暴露と報酬 ━━

㉔ 偽主人公の不当な要求
[ ] 偽物が報酬・地位・結婚を求める
内容：

㉕ 難題
[ ] 主人公に困難な課題が与えられる（真の実力を試す試練）
内容：

㉖ 解決
[ ] 主人公が難題をクリアする
内容：

㉗ 真の主人公の認知
[ ] 主人公の正体・功績が明らかになる
→ ⑰の刻印が証拠になることが多い
内容：

㉘ 偽主人公・裏切り者の正体暴露
[ ] 偽物・嘘をついていた人物の正体が明かされる
内容：

㉙ 変身
[ ] 主人公が新しい外見・地位・力を得る
→ 外見の変化が内的成長を表す
内容：

㉚ 悪への罰
[ ] 敵・偽主人公が相応の罰を受ける
内容：

㉛ 婚姻 / 即位（報酬）
[ ] 主人公が結婚する・王位につく・望んだものを手に入れる ★物語の締め★
内容：

━━ メモ ━━
使用した機能：①②③…
省略した機能とその理由：
`,
    },
    {
      label: 'シナリオ概略（独自パラダイム）',
      content: `シナリオ概略 ── 独自パラダイム版（改善版）
出典：お絵描きホーホー論「ビートシートメソッド」アレンジ
ポイント：「理由」を外面と本音に分けることで、障害・対策の繋げ方が自然に決まる。

━━━━━━━━━━━━━━━━━━━━

【行動】主人公は何をしようとしているか？
→

━━ 理由（2層構造） ━━
※外面と本音の2つを先に決めると、障害③と結末が自然に導き出される。

【理由①｜外面】表向きの行動動機（他者から見える理由）
→

【理由②｜本音】深層の動機・本当に守りたいもの（物語のテーマになる部分）
→

━━ 障害（3つ） ━━

【障害①｜誘う出来事（Inciting Incident）】
　対応：理由①外面 を揺さぶる最初の事件
　日常を壊す出来事。規模は問わない。「おや？」程度の違和感でも、全てを奪う衝撃でもよい。
→

【障害②｜自然な出来事（Spontaneous Incident）】
　対応：理由①外面 を否定しつつ、対策①「決断」の選択を裏切る展開
　決断の延長として当然発生する試練。序盤の決意はこれを乗り越えるための決意だった。
　主人公の通常運転での活躍・堕落を描く「予想通りの課題」。
→

【障害③｜絶望的な出来事（Desperate Incident）】
　対応：理由②本音 を根底から否定し、対策②「一時決着」をぶち壊す
　主人公の能力だけではどうにもならない問題。不可逆な決断を強いられる。
　フェイクエンドの感動すら前置きだったと思わせるどんでん返し。
　行動しなければ絶望・失敗しても絶望、という試練を。
→

━━ 対策（3つ） ━━

【対策①｜決断（Key Incident）】
　障害①への反応。主人公が非日常へ飛び込む覚悟を決める瞬間。
　これがメインストーリーの本当の始まり。
→

【対策②｜一時決着（Fake Ending）】
　障害②を乗り越えた一件落着。読者が「終わった」と思う偽の結末。
　しかしこれは障害③への前置きに過ぎない。
→

【対策③｜決着】
　障害③を超えた末の本当の結末。何を犠牲にし、何を得たか。
　理由②本音 が報われるか、あるいは変容するか。
→

━━ 結末 ━━

【結末】物語が終わった世界はどう変わったか？（OPの逆の状況）
　行動の目的は達成されたか？　理由②本音 は満たされたか？
→

━━ 項目の対応関係 ━━
理由①外面  ←否定← 障害①誘う出来事  →応答→ 対策①決断
理由①外面  ←否定← 障害②自然な出来事 →応答→ 対策②一時決着
　　　　　　　　　　障害②は対策①「決断」も同時に裏切る
理由②本音  ←否定← 障害③絶望的な出来事→応答→ 対策③決着
　　　　　　　　　　障害③は対策②「一時決着」も同時にぶち壊す

━━ 6つの物語関係チェック ━━
[ ] 世界の変化　　── OPとEDで主人公の状況が逆転しているか？
[ ] 主人公の弱点　── 理由②本音 に関わる欠如が物語全体の障害になっているか？
[ ] メインストーリー── 行動と理由①が一貫しているか？
[ ] 決断　　　　　── 主人公が自分の意志で非日常に踏み込んでいるか？
[ ] フェイクエンド── 一時決着が「安心→絶望」の落差を作れているか？
[ ] 最後の試練　　── 絶望的な出来事が理由②本音 を否定し不可逆な選択を迫っているか？
`,
    },
    {
      label: '物語パラダイム（前振りとオチのペア）',
      content: `物語パラダイム ～前振りとオチのペア～
出典：お絵描きホーホー論「物語関係」
使い方：各機能のシーンを自分の物語に当てはめて書き込む。「前振り」で提示したものを「オチ」で回収することが肝。

━━ 世界の変化（序盤） ━━

【OPイメージ】← ★ FinalイメージのOPは必ず逆になる
  作品トーン（雰囲気・色調・テンポ）：
  キャラの願望（主人公が欲しいもの・目指すもの）：
  ビジュアル（印象的な冒頭映像・場面）：

【セットアップ】
  世界観設定（どんな世界か）：
  主人公に欠如するもの（足りないもの・弱点）：← ★ 主人公の弱点

【テーマの提示】
  物語の方向性（何についての話か）：
  何をすべきという真実（作品が伝えたいこと）：

━━ 決断（転換点） ━━

【触媒・きっかけ（Inciting Incident）】
  変化の瞬間（日常が壊れる出来事）：← ★ 以前にない変化
  以前にない変化（主人公の世界が変わる）：

【葛藤・熟慮】← ★ チキンからヒーローになる決断
  変化へのためらい（なぜ動けないか）：
  チキンからヒーローになる決断（何が背中を押すか）：

【ブレイク】
  非日常への突入（日常から非日常へ越える瞬間）：

【サブプロット】
  メインから離れたエピソード（サブキャラの動き・別軸の話）：

━━ メインストーリー ━━

【前提の約束】
  主人公らしく鍵を握る（主人公でなければならない理由）：
  世界観の背景描写（設定の深堀り）：
  ジレンマ（どちらを選んでも辛い選択肢）：

【中間点・ミッドポイント】
  サービスシーン（読者へのご褒美・盛り上がり）：
  人間関係の錯交（キャラ同士の絡み・感情の動き）：
  一時決着（← ★ フェイクエンド）：
  物語の流れが変わる（ここで方向性が変わる）：

━━ フェイクエンド ━━

【最悪・最高の選択 / 敵・幸福の接近】
  主人公の全てを否定する攻撃（敵が主人公の核心を突く）：
  主人公置いてけぼり（仲間・支えを失う）：

【全てを失う瞬間 / 全てを手に入れる瞬間】
  物語の原動力を奪われる（目的・手段を失う）：
  大物から無力を急押しされる（絶望の底）：

━━ 最後の試練 ━━

【魂の暗い夜 / 魂の輝く夜】
  失意の時間を描く（どん底での内面）：
  最も大切なものを選ぶ（真のテーマと向き合う瞬間）：
  物語の情報公開（隠されていた真実が明かされる）：

【侵入・撤退】
  再起（立ち上がる理由・きっかけ）：

【クライマックス / フィナーレ】
  見せ場（最大の対決・感情のピーク）：
  主人公の勝利・敗北（どう終わるか）：

━━ 締め（OPとの対比） ━━

【Finalイメージ・EDイメージ】← ★ OPの反対の状況を視覚的に証明
  OPと対比する場面（何がどう変わったか視覚で示す）：
  主人公の欠如は埋まったか？（セットアップの回収）：
  テーマは証明されたか？（提示した真実の答え）：

━━ 前振りとオチの対応メモ ━━
前振り①　→　オチ：
前振り②　→　オチ：
前振り③　→　オチ：
`,
    },
    {
      label: 'オリジナル作品の作り方',
      content: `オリジナル作品の作り方
①メディアは?(ゲーム? アニメ? 漫画? 実写?)


②ジャンルは? (アクション? ADV? RPG?)


③ターゲットは?


④設定を考える(どこで? 誰が? 何をする?)


⑤面白かった作品を参照する


⑥「これ作りたい! ワクワクする!」まで辿り着く


⑦システムやプロットやキャラクターなどの深掘りへ…`,
    },
    {
      label: 'ストーリーライティング22の法則',
      content: `ストーリーライティング22の法則

１．成功ではなく挑戦にフォーカスする
主人公の成功という部分ではなく、諦めずに挑戦し続けるという部分を賞賛すること

２．自分ではなく読者が求めているものを書く
ライターとしての自分が書いていて楽しいものではなく、読者にとって面白いものを書くこと。この２つには、非常に大きな違いがある。

３．テーマの本質を探る
テーマ探しは非常に重要だ。しかし、ストーリーの本質は書き終えてみるまでは、ライターにも分からない。だから、書き終えたらリライト（書き直し）しよう。

４．定番のストーリーラインを抑える
むかしむかし、あるところに…。毎日…。そんなある日…。そして…。そして…。そしてついに…。

５．キャラクターの魅力を伝える
キャラクターをシンプルにして、キャラクターに焦点を合わせて、キャラクター同士の力や魅力を結合させよう。

６．キャラクターに試練を与える
キャラクターは何が得意で何が好きなのだろうか？それと正反対の試練を与えて、キャラクターに挑戦させよう。キャラクターは、その試練にどのように立ち向かうだろうか？

７．エンディングを決めておく
ストーリーの中盤部分を書く前に、エンディングを決めておこう。エンディングを考えるのは本当に骨が折れる仕事だ。だからこそ、前もってやっておこう。

８．より良いものを追求し続ける
ストーリーを書き上げたら、それが完璧になっていなくても公開しよう。そして、また書き続けて、次はもっと良いものを作ろう。

９．アイデアに詰まったらリサーチ
アイデアに詰まったら、"書くべきではない展開"のリストを作ろう。多くの場合、材料を集めれば集めるほど、良いアイデアが湧いてくる。

１０．自分の中の常識を破壊する
好きなストーリーから離れよう。あなたのアイデアは、それらのストーリーから大きな影響を受けている。自分のストーリーを書き始める前に、その事実を把握しておこう。

１１．アイデアを紙に書き起こす
アイデアを紙に書き起こすと頭の中が整理される。そして、そのアイデアが、あなたの頭から離れなければ、それは素晴らしいアイデアだ。そして、そのアイデアを他人に話してはいけない。

１２．一番最初のアイデアは無視する
一番最初に浮かんでくるアイデアは無視しよう。二番目も、三番目も…。すると、明確な良いアイデアが浮かんでくる。そして、そうやって最終的に出て来たアイデアに、あなた自身が驚くはずだ。

１３．魅力的なキャラクター作りの鉄則を知る
キャラクターにはハッキリとした意見を持たせよう。受動的で順応的なキャラクターは読者にとって退屈だ。

１４．自分の信念を知る
なぜ、あなたは、そのストーリーを伝えなければいけないのだろうか？あなたが心から伝えたい信念はなんだろうか？あなたの信念が、ストーリーの根幹となる。

１５．リアルな感情描写をする
もし、あなたがストーリーの中のキャラクターだとしたら、どう感じるだろうか？そうした感情描写の正直さが、非日常的な状況に親近感を与える。

１６．キャラクターの背景を作り込む
キャラクターが抱えているリスクや過去は何だろうか？なぜ、そのキャラクターがそうなったのかという背景を作り込もう。もし成功しなければどうなるか？挑戦に対して障害を用意しよう。

１７．継続した努力！
あなたの努力の全てはムダにはならない。もしうまくいっていなくても、気にせず進み続けよう。そうした経験は、結局あなたの糧となって戻ってくる。

１８．自分と向き合う
自分自身を知ろう。自分のベストの力が出ている時と、ただ焦って何もできなくなっている時の違いを知ろう。ストーリーライティングは、あなたを磨くのではなく、あなたをテストする。

１９．試練の到来は偶然、試練の克服は必然
キャラクターに偶然、試練が重なることは素晴らしい。しかし、その試練を克服する際に偶然の要素があると興ざめしてしまう。

２０．エクササイズ！
嫌いな映画を見て、その映画の構成要素を分析しよう。あなたは、その映画を良くするために、どのようにアレンジできるだろうか？

２１．人のリアルな心理を知る
自分自身の様々な行動や、その行動を取るにいたった動機を知ろう。ストーリーは、ただかっこ良く書けば良いものではない。

２２．ストーリーを一言で表せるようにする
あなたのストーリーのエッセンス（肝）は何だろうか？それを短い言葉で伝えるなら？もし、あなたの中で、これらのことが明確なら、あなたはそこからキャリアを築くことができる。`,
    },
  ]

  const isInProject = $derived(!!projectStore.currentProjectId)

  function isDiagram(content: string) {
    return content.trimStart().startsWith('<table')
  }

  function diagramPreview(content: string) {
    return content.replace(/contenteditable="true"/g, 'contenteditable="false"')
  }

  function toggleScene(tags: string, set: (v: string) => void) {
    const arr = tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    const has = arr.includes('書きたいシーン')
    set(has ? arr.filter(t => t !== '書きたいシーン').join(', ') : [...arr, '書きたいシーン'].join(', '))
  }

  let showTemplateMenu = $state(false)
  let filterTag = $state('')
  let newTitle = $state('')
  let newContent = $state('')
  let newTags = $state('')
  let adding = $state(false)

  let editId = $state<string | null>(null)
  let editTitle = $state('')
  let editContent = $state('')
  let editTags = $state('')
  let editImageUrl = $state<string | undefined>(undefined)
  let viewImageUrl = $state<string | null>(null)
  let imgFileInput: HTMLInputElement
  let diagramRef = $state<HTMLElement | null>(null)
  let newDiagramRef = $state<HTMLElement | null>(null)

  $effect(() => {
    // editId の変化時のみ innerHTML を初期化（editContent の変化で再実行しない）
    editId
    untrack(() => {
      if (diagramRef && isDiagram(editContent)) {
        diagramRef.innerHTML = editContent
      }
    })
  })

  $effect(() => {
    // newDiagramRef が DOM にバインドされたタイミングで innerHTML を設定
    if (newDiagramRef && isDiagram(untrack(() => newContent))) {
      newDiagramRef.innerHTML = untrack(() => newContent)
    }
  })

  function startEdit(idea: { id: string; title: string; content: string; tags: string[]; imageUrl?: string }) {
    editId = idea.id
    editTitle = idea.title ?? ''
    editContent = idea.content
    editTags = idea.tags.join(', ')
    editImageUrl = idea.imageUrl
  }

  async function saveEdit() {
    if (!editId) return
    const content = isDiagram(editContent) && diagramRef
      ? diagramRef.innerHTML
      : editContent.trim()
    const tags = editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    const matchedProject = projectStore.projects.find(p => tags.includes(p.title))
    const linkedProjectId = matchedProject?.id ?? null
    await ideaStore.update(editId, { title: editTitle.trim(), content, tags, linkedProjectId, imageUrl: editImageUrl })
    editId = null
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit()
    if (e.key === 'Escape') editId = null
  }

  function handleImageFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { editImageUrl = reader.result as string }
    reader.readAsDataURL(file)
  }

  function useTemplate(label: string, content: string) {
    newTitle = label
    newContent = content
    adding = true
    showTemplateMenu = false
  }

  onMount(() => { if (!projectStore.currentProjectId) return; ideaStore.load() })

  const filtered = $derived.by(() => {
    const pid = projectStore.currentProjectId
    const base = ideaStore.ideas.filter(i => {
      if (i.isTrash) return false
      if (pid) {
        if (i.linkedProjectId !== pid) return false
      } else {
        if (i.linkedProjectId) return false
      }
      if (filterTag && !i.tags.includes(filterTag)) return false
      return true
    })
    if (ideaOrder.length === 0) return base
    return [...base].sort((a, b) => {
      const ai = ideaOrder.indexOf(a.id)
      const bi = ideaOrder.indexOf(b.id)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  })

  const allTags = $derived([...new Set(ideaStore.ideas.filter(i => !i.isTrash).flatMap(i => i.tags))].sort())

  async function addIdea() {
    if (!newTitle.trim() && !newContent.trim()) return
    const tags = newTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    const matchedProject = projectStore.projects.find(p => tags.includes(p.title))
    const linkedProjectId = matchedProject ? matchedProject.id : (projectStore.currentProjectId ?? null)
    const content = isDiagram(newContent) && newDiagramRef
      ? newDiagramRef.innerHTML
      : newContent.trim()
    await ideaStore.create(newTitle.trim(), content, tags, linkedProjectId)
    newTitle = ''
    newContent = ''
    newTags = ''
    adding = false
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addIdea()
    if (e.key === 'Escape') { adding = false; newContent = ''; newTags = '' }
  }

  function confirmDelete(id: string) {
    appStore.openModal('confirm', {
      title: 'ゴミ箱に移動',
      message: 'このアイデアをゴミ箱に移動します。1週間後に自動削除されます。',
      danger: false,
      onConfirm: () => ideaStore.trash(id),
    })
  }

  function linkToggle(_id: string, linked: boolean) {
    const currentProject = projectStore.projects.find(p => p.id === projectStore.currentProjectId)
    if (!currentProject) return
    const tags = editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    editTags = linked
      ? tags.filter(t => t !== currentProject.title).join(', ')
      : [...tags, currentProject.title].join(', ')
  }

  function getTagProject(tag: string) {
    return projectStore.projects.find(p => p.title === tag) ?? null
  }

  function handleTagClick(e: MouseEvent, tag: string) {
    e.stopPropagation()
    const proj = getTagProject(tag)
    if (proj) {
      projectStore.selectProject(proj.id)
      appStore.setTab('plot')
    } else {
      filterTag = filterTag === tag ? '' : tag
    }
  }
</script>

<datalist id="idea-tag-suggestions">
  {#if isInProject}<option value="書きたいシーン"></option>{/if}
  {#each projectStore.projects as p}
    <option value={p.title}></option>
  {/each}
  {#each allTags.filter(t => t !== '書きたいシーン' && !projectStore.projects.some(p => p.title === t)) as tag}
    <option value={tag}></option>
  {/each}
</datalist>

<div class="tab-wrap">
  <div class="tab-header">
    <h2 class="tab-title">💡 アイデアVault</h2>
    <div class="header-actions">
      {#if isInProject}
        <button
          class="btn btn-sm scene-filter-btn"
          class:active={filterTag === '書きたいシーン'}
          onclick={() => filterTag = filterTag === '書きたいシーン' ? '' : '書きたいシーン'}
        >📝 書きたいシーン</button>
      {/if}
      {#if allTags.length > 0}
        <select class="fsel hdr-sel" value={filterTag} onchange={(e) => filterTag = (e.target as HTMLSelectElement).value} aria-label="タグ絞り込み">
          <option value="">すべてのタグ</option>
          {#each allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      {/if}
      <div class="tmpl-wrap">
        <button class="btn btn-ghost btn-sm" onclick={() => showTemplateMenu = !showTemplateMenu}>📋 テンプレ ▾</button>
        {#if showTemplateMenu}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div class="tmpl-backdrop" onclick={() => showTemplateMenu = false}></div>
          <div class="tmpl-menu">
            {#each TEMPLATES_LIST as tmpl}
              <button class="tmpl-item" onclick={() => useTemplate(tmpl.label, tmpl.content)}>{tmpl.label}</button>
            {/each}
          </div>
        {/if}
      </div>
      <button class="btn btn-primary btn-sm" onclick={() => { if (adding) { adding = false; newTitle = ''; newContent = ''; newTags = '' } else { adding = true } }}>
        {adding ? 'キャンセル' : '＋ 追加'}
      </button>
    </div>
  </div>

  {#if adding}
    <div class="add-form">
      <input
        class="fi idea-title-input"
        value={newTitle}
        oninput={(e) => newTitle = (e.target as HTMLInputElement).value}
        onkeydown={handleAddKeydown}
        placeholder="タイトル"
        aria-label="タイトル"
      />
      {#if isDiagram(newContent)}
        <div
          class="diagram-editor"
          bind:this={newDiagramRef}
          role="region"
          aria-label="パラダイム図（編集可能）"
        ></div>
      {:else}
        <textarea
          class="fta"
          value={newContent}
          oninput={(e) => newContent = (e.target as HTMLTextAreaElement).value}
          onkeydown={handleAddKeydown}
          placeholder="詳細（任意）… (Ctrl+Enter で保存)"
          rows="3"
          aria-label="詳細"
        ></textarea>
      {/if}
      <div class="add-row">
        <input
          class="fi"
          list="idea-tag-suggestions"
          value={newTags}
          oninput={(e) => newTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        {#if isInProject}
          {@const hasScene = newTags.split(/[,，\s]+/).map(t => t.trim()).includes('書きたいシーン')}
          <button
            class="btn btn-sm scene-tag-btn"
            class:active={hasScene}
            onclick={() => toggleScene(newTags, v => newTags = v)}
            title="書きたいシーンとしてタグ付け"
          >📝{hasScene ? ' ✓' : ''}</button>
        {/if}
        <button class="btn btn-primary btn-sm" onclick={addIdea} disabled={!newTitle.trim() && !newContent.trim()}>保存</button>
      </div>
    </div>
  {/if}

  <div class="idea-list">
    {#if ideaStore.status === 'loading'}
      <div class="empty"><div class="empty-icon">⏳</div><div class="empty-msg">読み込み中…</div></div>
    {:else if filtered.length === 0}
      <div class="empty">
        <div class="empty-icon">💡</div>
        <div class="empty-msg">アイデアがありません</div>
        <div class="empty-sub">「＋ 追加」ボタンでアイデアを記録しましょう</div>
      </div>
    {:else}
      {#each filtered as idea, idx (idea.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="idea-card"
          class:dragging={ideaDs.dragIdx === idx}
          class:drag-over={ideaDs.dragOverIdx === idx}
          draggable="true"
          data-drag-idx={idx}
          ondragstart={() => ideaDs.start(idx)}
          ondragover={(e) => ideaDs.over(e, idx)}
          ondrop={() => { const next = ideaDs.drop([...filtered], idx); if (next) saveIdeaOrder(next) }}
          ondragend={() => ideaDs.end()}
          ontouchstart={() => ideaDs.touchstart(idx)}
          ontouchmove={(e) => ideaDs.touchmove(e)}
          ontouchend={() => { const to = ideaDs.dragOverIdx; if (to !== null) { const next = ideaDs.drop([...filtered], to); if (next) saveIdeaOrder(next) } else ideaDs.end() }}
          onclick={() => startEdit(idea)}
        >
          {#if idea.title}
            <div class="idea-title">{idea.title}</div>
          {/if}
          {#if idea.content}
            {#if isDiagram(idea.content)}
              <div class="diagram-preview">{@html diagramPreview(idea.content)}</div>
            {:else}
              <p class="idea-text">{idea.content}</p>
            {/if}
          {/if}
          {#if idea.tags.length > 0}
            <div class="tags">
              {#each idea.tags as tag}
                {@const proj = getTagProject(tag)}
                <span
                  class="tag"
                  class:tag-linked={!!proj}
                  onclick={(e) => handleTagClick(e, tag)}
                  title={proj ? `「${proj.title}」を開く` : `「${tag}」で絞り込む`}
                >{tag}{#if proj} ↗{/if}</span>
              {/each}
            </div>
          {/if}
          {#if idea.imageUrl}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <img class="card-thumb" src={idea.imageUrl} alt="添付画像" onclick={(e) => { e.stopPropagation(); viewImageUrl = idea.imageUrl! }} />
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if editId}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="fs-overlay" onclick={(e) => { if (e.target === e.currentTarget) editId = null }}>
    <div class="fs-panel" role="dialog" aria-modal="true">
      <div class="fs-header">
        <input
          class="fi fs-title-input"
          value={editTitle}
          oninput={(e) => editTitle = (e.target as HTMLInputElement).value}
          onkeydown={handleEditKeydown}
          placeholder="タイトル"
          aria-label="タイトル"
        />
        <button class="iBtn del fs-del" onclick={() => { const id = editId!; editId = null; confirmDelete(id) }} aria-label="削除">🗑</button>
        <button class="iBtn fs-close" onclick={() => editId = null} aria-label="閉じる">✕</button>
      </div>
      <div class="fs-body">
        {#if isDiagram(editContent)}
          {#key editId}
            <div
              class="diagram-editor"
              bind:this={diagramRef}
              role="region"
              aria-label="パラダイム図（編集可能）"
            ></div>
          {/key}
        {:else}
          <textarea
            class="fta fs-textarea"
            value={editContent}
            oninput={(e) => editContent = (e.target as HTMLTextAreaElement).value}
            onkeydown={handleEditKeydown}
            placeholder="詳細（Ctrl+Enter で保存）"
            aria-label="詳細"
          ></textarea>
        {/if}
        <div class="img-section">
          {#if editImageUrl}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="img-thumb-wrap">
              <img class="img-thumb" src={editImageUrl} alt="添付画像" onclick={() => viewImageUrl = editImageUrl!} />
              <button class="img-del-btn" onclick={() => editImageUrl = undefined} aria-label="画像を削除">✕</button>
            </div>
          {/if}
          <button class="btn btn-ghost btn-sm img-add-btn" onclick={() => imgFileInput.click()}>🖼 画像{editImageUrl ? '変更' : '追加'}</button>
          <input bind:this={imgFileInput} type="file" accept="image/*" style="display:none" onchange={handleImageFile} />
        </div>
      </div>
      <div class="fs-footer">
        <input
          class="fi fs-tags-input"
          list="idea-tag-suggestions"
          value={editTags}
          oninput={(e) => editTags = (e.target as HTMLInputElement).value}
          placeholder="タグ（カンマ区切り）"
          aria-label="タグ"
        />
        {#if isInProject}
          {@const hasScene = editTags.split(/[,，\s]+/).map(t => t.trim()).includes('書きたいシーン')}
          <button
            class="btn btn-sm scene-tag-btn"
            class:active={hasScene}
            onclick={() => toggleScene(editTags, v => editTags = v)}
            title="書きたいシーンとしてタグ付け"
          >📝 書きたいシーン{hasScene ? ' ✓' : ''}</button>
          {@const currentProject = projectStore.projects.find(p => p.id === projectStore.currentProjectId)}
          {@const linked = !!currentProject && editTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).includes(currentProject.title)}
          <button class="btn btn-ghost btn-sm" onclick={() => linkToggle(editId!, linked)} title={linked ? 'リンク解除' : 'この作品にリンク'}>
            🔗 {linked ? 'リンク済み' : 'リンク'}
          </button>
        {/if}
        <button class="btn btn-ghost btn-sm" onclick={() => editId = null}>キャンセル</button>
        <button class="btn btn-primary btn-sm" onclick={saveEdit}>保存</button>
      </div>
    </div>
  </div>
{/if}

{#if viewImageUrl}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="img-viewer-overlay" onclick={() => viewImageUrl = null}>
    <img class="img-viewer-img" src={viewImageUrl} alt="拡大表示" onclick={(e) => e.stopPropagation()} />
    <button class="img-viewer-close" onclick={() => viewImageUrl = null} aria-label="閉じる">✕</button>
  </div>
{/if}

<style>
  .tab-wrap    { display: flex; flex-direction: column; height: 100%; width: 100%; min-width: 0; overflow: hidden }
  .tab-header  { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
  .tab-title   { font-size: 16px; font-weight: 700; margin-right: auto }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
  .hdr-sel     { width: auto; padding: 5px 8px; font-size: 12px }
  .linked-toggle { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); cursor: pointer; user-select: none }
  .add-form    { padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--surface2) }
  .add-form .fta { margin-bottom: 8px }
  .add-row     { display: flex; gap: 8px; align-items: center }
  .add-row .fi { flex: 1 }
  .idea-list   { flex: 1; overflow-y: scroll; overflow-x: hidden; padding: 12px 20px }
  .idea-card   { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; cursor: grab; transition: border-color .15s, opacity .12s }
  .idea-card:hover { border-color: var(--accent) }
  .idea-card.dragging { opacity: 0.35; cursor: grabbing }
  .idea-card.drag-over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent) }
  .idea-title  { font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--text) }
  .idea-card:hover .idea-title { color: var(--accent) }
  .idea-text   { font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: var(--muted); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden }

  .fs-overlay  { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px }
  .fs-panel    { background: var(--surface); border-radius: 14px; width: 100%; max-width: 720px; height: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,.3) }
  .fs-header   { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0 }
  .fs-title-input { flex: 1; font-size: 18px; font-weight: 700; border: none; background: none; outline: none; color: var(--text); font-family: inherit }
  .fs-del      { color: var(--muted) }
  .fs-close    { color: var(--muted) }
  .fs-body     { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 16px 20px }
  .fs-textarea { flex: 1; resize: none; font-size: 14px; line-height: 1.8; border: none; background: none; outline: none; color: var(--text); font-family: inherit; width: 100% }
  .fs-footer   { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap }
  .fs-tags-input { flex: 1; min-width: 120px; font-size: 13px }
  .tag-linked  { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); cursor: pointer }
  .tag-linked:hover { background: color-mix(in srgb, var(--accent) 35%, transparent) }
  .scene-filter-btn { border: 1px solid var(--border); color: var(--muted); background: none }
  .scene-filter-btn:hover { color: var(--text); border-color: var(--accent) }
  .scene-filter-btn.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent) }
  .scene-tag-btn { border: 1px solid var(--border); color: var(--muted); background: none; flex-shrink: 0 }
  .scene-tag-btn:hover { border-color: var(--accent); color: var(--accent) }
  .scene-tag-btn.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent) }
  .tmpl-wrap   { position: relative }
  .tmpl-backdrop { position: fixed; inset: 0; z-index: 10 }
  .tmpl-menu   { position: absolute; top: calc(100% + 4px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.15); z-index: 20; min-width: 200px; overflow: hidden }
  .tmpl-item   { display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text); font-family: inherit }
  .tmpl-item:hover { background: var(--surface2) }

  .img-section     { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 10px; flex-wrap: wrap }
  .img-thumb-wrap  { position: relative; display: inline-flex }
  .img-thumb       { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); cursor: pointer }
  .img-thumb:hover { opacity: .85 }
  .img-del-btn     { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); font-size: 10px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--muted) }
  .img-del-btn:hover { color: var(--danger, #e55) }
  .img-add-btn     { flex-shrink: 0 }
  .card-thumb      { display: block; width: 100%; max-height: 140px; object-fit: cover; border-radius: 6px; margin-top: 8px; cursor: pointer }
  .img-viewer-overlay { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,.8); display: flex; align-items: center; justify-content: center; padding: 24px }
  .img-viewer-img  { max-width: 100%; max-height: 90vh; border-radius: 8px; object-fit: contain }
  .img-viewer-close { position: absolute; top: 16px; right: 20px; background: rgba(255,255,255,.15); border: none; color: #fff; font-size: 20px; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center }
  .img-viewer-close:hover { background: rgba(255,255,255,.3) }

  .diagram-preview { overflow: auto; max-height: 200px; margin-top: 4px; pointer-events: none }
  .diagram-editor  { flex: 1; overflow: auto; min-height: 0 }

  :global(.sf-paradigm-table) {
    border-collapse: collapse;
    font-size: 11px;
    width: 100%;
    min-width: 540px;
    table-layout: auto;
  }
  :global(.sf-paradigm-table th) {
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 5px 7px;
    text-align: center;
    font-weight: 700;
    white-space: nowrap;
    color: var(--text);
  }
  :global(.sf-paradigm-table td) {
    border: 1px solid var(--border);
    padding: 4px 7px;
    vertical-align: middle;
    color: var(--text);
  }
  :global(.sf-part-cell) {
    background: color-mix(in srgb, var(--accent) 10%, var(--surface2));
    text-align: center;
    font-weight: 700;
    font-size: 11px;
    white-space: nowrap;
  }
  :global(.sf-time-cell) {
    background: var(--surface2);
    text-align: center;
    font-weight: 600;
    white-space: nowrap;
  }
  :global(.sf-func-cell) {
    background: color-mix(in srgb, var(--surface2) 60%, var(--surface));
    text-align: center;
    font-size: 10.5px;
    line-height: 1.4;
  }
  :global(.sf-scene-cell) {
    font-size: 10.5px;
    white-space: nowrap;
  }
  :global(.sf-edit-cell) {
    background: var(--surface);
    min-width: 120px;
    outline: none;
    font-size: 11px;
    line-height: 1.5;
    padding: 4px 7px;
    cursor: text;
  }
  :global(.sf-edit-cell[contenteditable="true"]:focus) {
    background: color-mix(in srgb, var(--accent) 8%, var(--surface));
    outline: 1px solid var(--accent);
  }
  :global(.sf-sub) { font-size: 9.5px; font-weight: 400; display: block }

</style>

