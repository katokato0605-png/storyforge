export const SCENARIO_OUTLINE_TABLE_HTML = `<table class="sf-paradigm-table sf-sc-table"><thead><tr><th class="sf-sc-label">項目</th><th colspan="2">社会的な物語</th><th>精神的な物語</th></tr></thead><tbody>
<tr><td class="sf-sc-row">行動</td><td colspan="3" contenteditable="true" class="sf-edit-cell sf-sc-tall"></td></tr>
<tr><td class="sf-sc-row" rowspan="2">理由</td><td colspan="2" class="sf-sc-gaimen">外面</td><td class="sf-sc-honne">本音</td></tr>
<tr><td contenteditable="true" class="sf-edit-cell sf-sc-tall" colspan="2"></td><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td></tr>
<tr><td class="sf-sc-row" rowspan="2">障害</td><td class="sf-sc-obs">①誘う出来事</td><td class="sf-sc-obs">③自発的な出来事</td><td class="sf-sc-obs">⑤絶望的な出来事</td></tr>
<tr><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td></tr>
<tr><td class="sf-sc-row" rowspan="2">対策</td><td class="sf-sc-cnt">②決断</td><td class="sf-sc-cnt">④一時決着</td><td class="sf-sc-cnt">⑥決着</td></tr>
<tr><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td><td contenteditable="true" class="sf-edit-cell sf-sc-tall"></td></tr>
<tr><td class="sf-sc-row">結末</td><td colspan="3" contenteditable="true" class="sf-edit-cell sf-sc-tall"></td></tr>
</tbody></table>`

export const PARADIGM_TABLE_HTML = `<table class="sf-paradigm-table"><thead><tr><th>パート</th><th>時系列</th><th>機能</th><th>シーン</th><th>副機能（プロット）</th></tr></thead><tbody>
<tr><td rowspan="12" class="sf-part-cell">第一幕<br><span class="sf-sub">（テーゼ・旧世界）</span></td><td rowspan="5" class="sf-time-cell">日常</td><td rowspan="3" class="sf-func-cell">OPイメージ</td><td class="sf-scene-cell">作品トーン</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">キャラの願望</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">ビジュアル</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="2" class="sf-func-cell">セットアップ</td><td class="sf-scene-cell">世界観設定</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">主人公に欠如するもの</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="4" class="sf-time-cell">事件</td><td rowspan="2" class="sf-func-cell">テーマの提示</td><td class="sf-scene-cell">物語の方向性</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">何をすべきかという真実</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="2" class="sf-func-cell">触媒・きっかけ<br><span class="sf-sub">（Inciting Incident）</span></td><td class="sf-scene-cell">変化の瞬間</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">以前にない変化</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="3" class="sf-time-cell">決意</td><td rowspan="2" class="sf-func-cell">葛藤・熟慮<br><span class="sf-sub">（Key Incident）</span></td><td class="sf-scene-cell">変化へのためらい</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">チキンからヒーローになる決断</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-func-cell">ブレイク</td><td class="sf-scene-cell">非日常への突入</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="16" class="sf-part-cell">第二幕<br><span class="sf-sub">（アンチテーゼ・異世界）</span></td><td class="sf-time-cell">助走</td><td class="sf-func-cell">サブプロット</td><td class="sf-scene-cell">メインから離れたエピソード</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="7" class="sf-time-cell">成長</td><td rowspan="3" class="sf-func-cell">自然な・自発的な出来事<br><span class="sf-sub">（Spontaneous Incident）</span></td><td class="sf-scene-cell">主人公らしく鍵を握る</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">世界観の背景描写</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">ジレンマ</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="4" class="sf-func-cell">中間点<br><span class="sf-sub">（Fake Ending）</span></td><td class="sf-scene-cell">サービスシーン</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">人間関係の錯交</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">一時決着</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">物語の流れが変わる</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="7" class="sf-time-cell">情動</td><td rowspan="2" class="sf-func-cell">最後の試練<br>どんでん返し</td><td class="sf-scene-cell">主人公の全てを否定する攻撃</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">主人公置いてけぼり</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="2" class="sf-func-cell">全てを失う・得る瞬間<br><span class="sf-sub">（Desperate Incident）</span></td><td class="sf-scene-cell">物語の原動力を奪われる</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">大物から無力を念押しされる</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="3" class="sf-func-cell">魂の沈む・輝く夜</td><td class="sf-scene-cell">失意の時間を描く</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">最も大切なものを選ぶ</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">物語の情報公開</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-time-cell">変化</td><td class="sf-func-cell">侵入・撤退</td><td class="sf-scene-cell">再起</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td rowspan="3" class="sf-part-cell">第三幕<br><span class="sf-sub">（ジンテーゼ・新世界）</span></td><td rowspan="2" class="sf-time-cell">結末</td><td rowspan="2" class="sf-func-cell">クライマックス</td><td class="sf-scene-cell">見せ場</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-scene-cell">決着</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
<tr><td class="sf-time-cell">余韻</td><td class="sf-func-cell">EDイメージ</td><td class="sf-scene-cell">OPの反対の状況を視覚的に証明</td><td contenteditable="true" class="sf-edit-cell"></td></tr>
</tbody></table>`
