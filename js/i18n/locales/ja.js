/* 日本語の文字列（レベル名は data/levels.json） */

export default {
    // ── 共通 / ヘッダー・ツールチップ ──
    'tip.info':'ルールと情報',
    'tip.settings':'設定',
    'tip.help':'操作方法',
    'tip.special':'レベル情報',
    'tip.stats':'統計',
    'tip.undo':'一つ戻る（Z）',
    'tip.reset':'盤面をリセット（Delete）',
    'tip.ccw':'左に90°回転（A）',
    'tip.cw':'右に90°回転（D）',
    'tip.flip':'反転（S）',
    'tip.return':'ピースを置き場に戻す（X）',
    'tip.close':'閉じる',

    // ── 規則與資訊視窗 ──
    'info.title':'ルールと情報',
    'info.rules':'ルール：',
    'info.rule1':'すべてのピースを枠の中に収める',
    'info.rule2':'ピースは回転・反転して置いてよい',
    'info.rule3':'ピース同士は接触してはいけない<span class="pn">（重なり、辺の接触、角の接触を含む）</span>',
    'info.designer':'パズル作者：',
    'info.designerVal':'<a href="https://www.facebook.com/grabarchuk/" target="_blank" rel="noopener noreferrer">Peter Grabarchuk</a>、<a href="https://www.youtube.com/@Carl_Hoff" target="_blank" rel="noopener noreferrer">Carl Hoff</a>',
    'info.dev':'ウェブ開発：',
    'info.devVal':'<a href="https://www.instagram.com/cookie_yu_1031/" target="_blank" rel="noopener noreferrer">Cookie Yu</a>',
    'info.ref':'参考資料：',
    'info.refVal':'<a href="https://www.gathering4gardner.org/g4g13gift/puzzles/HoffCarl-GiftExchange-FromUntouchable11toHazmatCargo-G4G13.pdf" target="_blank" rel="noopener noreferrer">Untouchable11</a>、<a href="https://www.gathering4gardner.org/g4g10gift/puzzles/Hoff_Carl-Untouchable_11.pdf" target="_blank" rel="noopener noreferrer">Master Challenge</a>、<a href="https://www.gathering4gardner.org/g4g15gift/ExchangeArchive-HazmatCargo2-G15-011-1.pdf" target="_blank" rel="noopener noreferrer">Hazmat Cargo2</a>',
    'info.edu':'このサイトは教育・学習目的のみで提供しています',

    // ── 操作說明視窗 ──
    'help.title':'操作方法',
    'help.l1':'ピースをドラッグして移動します。盤面上のピースをクリックすると選択できます',
    'help.l2':'ピースを選択中またはドラッグ中に、盤面左のツールバーのボタンまたは下記のショートカットで向きや状態を変えられます',
    'help.l3':'幅の狭い画面では、ピース置き場のタイトルバーをタップすると置き場全体を表示でき、ピースをタップすると自動で盤面に置かれます',
    'key.ccw':'左に90°回転',
    'key.cw':'右に90°回転',
    'key.flip':'反転',
    'key.return':'ピースを戻す',
    'key.undo':'一つ戻る',
    'key.reset':'盤面をリセット',

    // ── 拼圖盤 ──
    'tray.title':'ピース置き場',

    // ── 解答冊 ──
    'book.title':'解答集',
    'book.count':(lv, n, m) => `<span class=\"bc-l\">${lv}</span><span class=\"bc-r\">収録 <b>${m == null ? n : n + '/' + m}</b> 件</span>`,
    'book.hide':'解答を隠す',
    'book.show':'解答を表示',
    'book.hidden':'解答は非表示です',
    'book.empty':'まだ解答がありません（自動で収録されます）。サムネイルをクリックすると表示できます',
    'book.view':'この解答を見る',
    'near.tag':'近似解',
    'near.count':(n, m, note) => `<span class=\"bc-l\">近似解<small class=\"bc-note\">${note}</small></span><span class=\"bc-r\">収録 <b>${m == null ? n : n + '/' + m}</b> 件</span>`,
    'near.empty':'近似解はまだありません（自動で収録されます）',
    'near.desc':'*近似解は角の接触を1か所まで許容します',

    // ── 解答檢視視窗 / 分享 ──
    'sol.title':(head, near) => `${head}　${near ? '近似解' : '解答'}`,
    'share':'シェア',
    'share.credit':'パズル作者：Peter Grabarchuk、Carl Hoff    サイト制作：Cookie Yu',
    'share.done':'シェア用画像を作成しました',
    'share.fail':'画像を作成できませんでした',
    'anon':'匿名プレイヤー',

    // ── 統計視窗 ──
    'stat.title':'統計',
    'stat.lv':'レベル',
    'stat.total':'解答数',
    'stat.got':'収録数',
    'stat.progress':'収録率',
    'stat.near':'近似解の統計',
    'tip.statNear':'近似解の統計',
    'tip.statExact':'正解の統計',

    // ── 關卡資訊視窗 ──
    'sp.title':'レベル情報',
    'sp.desc.h9':'名人挑戦',
    'sp.desc.h10':'危険貨物',
    'sp.desc.9':'Carl Hoff が『Untouchable 11』をもとに設計した派生作品。12x12の盤面と11個のピースを使いますが、正解はわずか2通りです',
    'sp.desc.10':'Carl Hoff が設計した作品。11x11の盤面と9個のピースを使い、唯一解は1通りだけですが、近似解は3761通りあります（より紛らわしい）',

    // ── 重置版圖視窗 ──
    'brd.title':'盤面をリセット',
    'brd.desc':'現在のレベルの盤面をリセットしますか？\n盤面上のピースはすべてピース置き場に戻り、元に戻せません。',
    'brd.confirm':'リセットする',

    // ── 設定視窗 ──
    'set.title':'設定',
    'set.nick':'名前',
    'set.nickPh':'ニックネームを入力',
    'set.lang':'言語',
    'set.theme':'背景',
    'theme.light':'明',
    'theme.dark':'暗',
    'set.vol':'音量',
    'set.extra':'追加レベルを有効にする',
    'set.extraDesc':'派生作品・特別レベルを表示',

    // ── 設定 / 資料匯出與匯入 ──
    'set.data':'データの書き出しと読み込み',
    'set.dataDesc':'データはキャッシュに保存されます。定期的にバックアップしてください',
    'data.ph':'ここに書き出し内容が表示されます',
    'data.export':'書き出し',
    'data.pickFile':'読み込み',
    'data.showJson':'データ内容（クリックで展開）',
    'data.dlHint':'自動でダウンロードできない場合は、上のデータを展開して手動でコピー・保存してください',
    'data.dlFail':'ダウンロードできません。上のデータを展開して手動でコピー・保存してください',
    'imp.json':'有効なJSONではありません。内容が完全か確認してください。',
    'imp.bad':'形式が一致しません。このゲームから書き出したデータファイルではありません。',
    'imp.done':(a, s, b, st, n) => `読み込み完了：解答 ${a} 件${n ? `、近似解 ${n} 件` : ''}を追加、${s} 件をスキップ（重複または不正）；${b} レベルの盤面を復元；${st ? '設定を適用しました' : '設定は含まれていません'}。`,

    // ── 設定 / 重置資料 ──
    'reset.title':'データのリセット',
    'reset.desc':'ご使用前に必ずバックアップを作成してください。',
    'reset.btn':'全データをリセット',
    'reset.confirmTitle':'データのリセットを確認',
    'reset.confirmDesc':'この操作で、すべての解答集、盤面の一時保存、設定が完全に削除され、元に戻せません。\n確認のため「Untouchable11」と入力してください。',
    'reset.ph':'Untouchable11',
    'reset.cancel':'キャンセル',
    'reset.confirm':'削除する',

    // ── 提示訊息（Toast） ──
    'toast.pick':'先に盤面上のピースを選んでください',
    'toast.reset':'盤面をリセットしました',
    'toast.emptyBoard':'盤面にピースがありません',
    'toast.noUndo':'戻せる操作がありません',
    'toast.new':(lv, n) => `クリア！新しい解答を保存しました（${lv} ${n}件目）`,
    'toast.dup':'クリア！この解答はすでに保存済みです（回転・反転して同じになるものは同一と見なします）',
    'toast.near':'近似解+1',
};
