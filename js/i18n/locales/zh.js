/* 中文字串（關卡名稱在 data/levels.json） */

export default {
    // ── 共通 / ヘッダー・ツールチップ ──
    'tip.info':'規則與資訊',
    'tip.settings':'設定',
    'tip.help':'操作說明',
    'tip.special':'關卡資訊',
    'tip.stats':'統計',
    'tip.undo':'返回上一步（Z）',
    'tip.reset':'重置版圖（Delete）',
    'tip.ccw':'向左旋轉 90°（A）',
    'tip.cw':'向右旋轉 90°（D）',
    'tip.flip':'鏡像（S）',
    'tip.return':'將拼圖收回至拼圖盤（X）',
    'tip.close':'關閉',

    // ── 規則與資訊視窗 ──
    'info.title':'規則與資訊',
    'info.rules':'規則：',
    'info.rule1':'將拼圖全部放入方框',
    'info.rule2':'拼圖可以左右旋轉、鏡像擺放',
    'info.rule3':'拼圖間彼此不可以互相觸碰<span class="pn">（包含重疊、邊觸碰、點觸碰）</span>',
    'info.designer':'拼圖作者：',
    'info.designerVal':'<a href="https://www.facebook.com/grabarchuk/" target="_blank" rel="noopener noreferrer">Peter Grabarchuk</a>、<a href="https://www.youtube.com/@Carl_Hoff" target="_blank" rel="noopener noreferrer">Carl Hoff</a>',
    'info.dev':'網頁開發者：',
    'info.devVal':'<a href="https://www.instagram.com/cookie_yu_1031/" target="_blank" rel="noopener noreferrer">Cookie Yu</a>',
    'info.ref':'參考資料：',
    'info.refVal':'<a href="https://www.gathering4gardner.org/g4g13gift/puzzles/HoffCarl-GiftExchange-FromUntouchable11toHazmatCargo-G4G13.pdf" target="_blank" rel="noopener noreferrer">Untouchable11</a>、<a href="https://www.gathering4gardner.org/g4g10gift/puzzles/Hoff_Carl-Untouchable_11.pdf" target="_blank" rel="noopener noreferrer">Master Challenge</a>、<a href="https://www.gathering4gardner.org/g4g15gift/ExchangeArchive-HazmatCargo2-G15-011-1.pdf" target="_blank" rel="noopener noreferrer">Hazmat Cargo2</a>',
    'info.edu':'本網站僅供教育與學習使用',

    // ── 操作說明視窗 ──
    'help.title':'操作說明',
    'help.l1':'拖曳拼圖以移動；點擊方框內的拼圖可選取它',
    'help.l2':'選取或拖曳拼圖時，點按圖板左側工具列的按鈕，或是使用下列快捷鍵以改變拼圖狀態',
    'help.l3':'窄視窗下，點擊拼圖盤頂欄以查看整個拼圖盤，點擊拼圖會自動放到圖板',
    'key.ccw':'左轉 90°',
    'key.cw':'右轉 90°',
    'key.flip':'鏡像',
    'key.return':'收回拼圖',
    'key.undo':'返回上一步',
    'key.reset':'重置版圖',

    // ── 拼圖盤 ──
    'tray.title':'拼圖盤',

    // ── 解答冊 ──
    'book.title':'解答冊',
    'book.count':(lv, n, m) => `<span class="bc-l">${lv}</span><span class="bc-r">已收錄 <b>${m == null ? n : n + '/' + m}</b> 組</span>`,
    'book.hide':'隱藏解答',
    'book.show':'顯示解答',
    'book.hidden':'解答已隱藏',
    'book.empty':'還沒有解答(會自動收錄)，點擊縮圖以查看',
    'book.view':'查看這組解答',
    'near.tag':'近似解',
    'near.count':(n, m, note) => `<span class="bc-l">近似解<small class="bc-note">${note}</small></span><span class="bc-r">已收錄 <b>${m == null ? n : n + '/' + m}</b> 組</span>`,
    'near.empty':'還沒有近似解(會自動收錄)',
    'near.desc':'*近似解允許一個角觸碰',

    // ── 解答檢視視窗 / 分享 ──
    'sol.title':(head, near) => `${head}　${near ? '近似解' : '解答'}`,
    'share':'分享',
    'share.credit':'拼圖設計者：Peter Grabarchuk、Carl Hoff    網頁開發者：Cookie Yu',
    'share.done':'已產生分享圖片',
    'share.fail':'無法產生圖片',
    'anon':'匿名玩家',

    // ── 統計視窗 ──
    'stat.title':'統計',
    'stat.lv':'等級',
    'stat.total':'解答組數',
    'stat.got':'收錄組數',
    'stat.progress':'收錄進度',
    'stat.near':'近似解統計',
    'tip.statNear':'近似解統計',
    'tip.statExact':'正解統計',

    // ── 關卡資訊視窗 ──
    'sp.title':'關卡資訊',
    'sp.desc.h9':'大師挑戰',
    'sp.desc.h10':'危險貨物',
    'sp.desc.9':'Carl Hoff 基於《Untouchable 11》所設計之衍伸作，使用12x12圖板、11片拼圖，卻僅有2組正解',
    'sp.desc.10':'Carl Hoff 所設計之作品，使用11x11圖板、9片拼圖，僅有1組唯一解，卻有3761組近似解(迷惑性更高)',

    // ── 重置版圖視窗 ──
    'brd.title':'重置版圖',
    'brd.desc':'確定要重置目前等級的版圖嗎？\n版圖上的拼圖會全部回到拼圖盤，且無法復原。',
    'brd.confirm':'確認重置',

    // ── 設定視窗 ──
    'set.title':'設定',
    'set.nick':'暱稱',
    'set.nickPh':'輸入暱稱',
    'set.lang':'語言',
    'set.theme':'背景',
    'theme.light':'亮',
    'theme.dark':'暗',
    'set.vol':'音量',
    'set.extra':'啟用額外關卡',
    'set.extraDesc':'顯示延伸作品&特殊關卡',

    // ── 設定 / 資料匯出與匯入 ──
    'set.data':'資料匯出與匯入',
    'set.dataDesc':'資料存於快取，請定期備份',
    'data.ph':'這裡會顯示匯出內容',
    'data.export':'匯出',
    'data.pickFile':'匯入',
    'data.showJson':'資料內容（點擊展開）',
    'data.dlHint':'如果瀏覽器無法自動下載，請展開上方資料內容手動複製保存',
    'data.dlFail':'無法下載，請展開上方資料內容手動複製保存',
    'imp.json':'不是有效的 JSON，請確認內容完整。',
    'imp.bad':'格式不符，這不是本遊戲匯出的資料檔。',
    'imp.done':(a, s, b, st, n) => `匯入完成：新增解答 ${a} 組${n ? `、近似解 ${n} 組` : ''}，略過 ${s} 組（重複或不合法）；還原 ${b} 個難度的盤面；${st ? '已套用設定' : '未包含設定'}。`,

    // ── 設定 / 重置資料 ──
    'reset.title':'重置資料',
    'reset.desc':'請務必先匯出備份，再謹慎使用此功能',
    'reset.btn':'重置所有資料',
    'reset.confirmTitle':'確認重置資料',
    'reset.confirmDesc':'此動作會永久刪除所有解答冊、盤面暫存與設定，無法復原。\n請輸入「Untouchable11」以確認刪除。',
    'reset.ph':'Untouchable11',
    'reset.cancel':'取消',
    'reset.confirm':'確認刪除',

    // ── 提示訊息（Toast） ──
    'toast.pick':'請先點選方框中的拼圖',
    'toast.reset':'已重置版圖',
    'toast.emptyBoard':'版圖上沒有拼圖',
    'toast.noUndo':'沒有可返回的步驟',
    'toast.new':(lv, n) => `過關！新解答已收錄（${lv} 第 ${n} 組）`,
    'toast.dup':'過關！已收錄過該解答（旋轉或鏡向後相同也視為同一組）',
    'toast.near':'近似解+1',
};
