/* English strings (level names live in data/levels.json) */

export default {
    // ── 共通 / ヘッダー・ツールチップ ──
    'tip.info':'Rules & info',
    'tip.settings':'Settings',
    'tip.help':'How to play',
    'tip.special':'Level info',
    'tip.stats':'Statistics',
    'tip.undo':'Undo (Z)',
    'tip.reset':'Reset board (Delete)',
    'tip.ccw':'Rotate left 90° (A)',
    'tip.cw':'Rotate right 90° (D)',
    'tip.flip':'Mirror (S)',
    'tip.return':'Return piece to tray (X)',
    'tip.close':'Close',

    // ── 規則與資訊視窗 ──
    'info.title':'Rules & info',
    'info.rules':'Rules: ',
    'info.rule1':'Fit all the pieces inside the frame',
    'info.rule2':'Pieces may be rotated and mirrored',
    'info.rule3':'Pieces must not touch each other <span class="pn">(overlap, edge contact or corner contact)</span>',
    'info.designer':'Puzzle designers: ',
    'info.designerVal':'<a href="https://www.facebook.com/grabarchuk/" target="_blank" rel="noopener noreferrer">Peter Grabarchuk</a>, <a href="https://www.youtube.com/@Carl_Hoff" target="_blank" rel="noopener noreferrer">Carl Hoff</a>',
    'info.dev':'Web developer: ',
    'info.devVal':'<a href="https://www.instagram.com/cookie_yu_1031/" target="_blank" rel="noopener noreferrer">Cookie Yu</a>',
    'info.ref':'References: ',
    'info.refVal':'<a href="https://www.gathering4gardner.org/g4g13gift/puzzles/HoffCarl-GiftExchange-FromUntouchable11toHazmatCargo-G4G13.pdf" target="_blank" rel="noopener noreferrer">Untouchable11</a>, <a href="https://www.gathering4gardner.org/g4g10gift/puzzles/Hoff_Carl-Untouchable_11.pdf" target="_blank" rel="noopener noreferrer">Master Challenge</a>, <a href="https://www.gathering4gardner.org/g4g15gift/ExchangeArchive-HazmatCargo2-G15-011-1.pdf" target="_blank" rel="noopener noreferrer">Hazmat Cargo2</a>',
    'info.edu':'This website is for educational and learning purposes only',

    // ── 操作說明視窗 ──
    'help.title':'How to play',
    'help.l1':'Drag pieces to move them; click a piece on the board to select it',
    'help.l2':'With a piece selected or being dragged, use the toolbar on the left of the board, or these shortcuts, to change it',
    'help.l3':'On narrow screens, tap the tray\'s title bar to view the whole tray; tapping a piece places it on the board automatically',
    'key.ccw':'Rotate left 90°',
    'key.cw':'Rotate right 90°',
    'key.flip':'Mirror',
    'key.return':'Return piece',
    'key.undo':'Undo',
    'key.reset':'Reset board',

    // ── 拼圖盤 ──
    'tray.title':'Pieces',

    // ── 解答冊 ──
    'book.title':'Solutions',
    'book.count':(lv, n, m) => `<span class="bc-l">${lv}</span><span class="bc-r"><b>${m == null ? n : n + '/' + m}</b> collected</span>`,
    'book.hide':'Hide solutions',
    'book.show':'Show solutions',
    'book.hidden':'Solutions hidden',
    'book.empty':'No solutions yet (collected automatically). Click a thumbnail to view.',
    'book.view':'View this solution',
    'near.tag':'Near solution',
    'near.count':(n, m, note) => `<span class="bc-l">Near solutions<small class="bc-note">${note}</small></span><span class="bc-r"><b>${m == null ? n : n + '/' + m}</b> collected</span>`,
    'near.empty':'No near solutions yet (collected automatically)',
    'near.desc':'*A near solution allows one corner contact',

    // ── 解答檢視視窗 / 分享 ──
    'sol.title':(head, near) => `${head}  ${near ? 'Near solution' : 'Solution'}`,
    'share':'Share',
    'share.credit':'Puzzle designers: Peter Grabarchuk, Carl Hoff    Web developer: Cookie Yu',
    'share.done':'Share image created',
    'share.fail':'Could not create the image',
    'anon':'Anonymous',

    // ── 統計視窗 ──
    'stat.title':'Statistics',
    'stat.lv':'Level',
    'stat.total':'Solutions',
    'stat.got':'Collected',
    'stat.progress':'Progress',
    'stat.near':'Near-solution statistics',
    'tip.statNear':'Near-solution statistics',
    'tip.statExact':'Solution statistics',

    // ── 關卡資訊視窗 ──
    'sp.title':'Level info',
    'sp.desc.h9':'Master Challenge',
    'sp.desc.h10':'Hazmat Cargo',
    'sp.desc.9':'A spin-off designed by Carl Hoff based on "Untouchable 11", using a 12x12 board and 11 pieces, yet it has only 2 solutions.',
    'sp.desc.10':'A puzzle designed by Carl Hoff, using an 11x11 board and 9 pieces, with only 1 unique solution yet 3,761 near solutions (far more misleading).',

    // ── 重置版圖視窗 ──
    'brd.title':'Reset board',
    'brd.desc':'Reset the board for this level?\nAll pieces go back to the tray. This cannot be undone.',
    'brd.confirm':'Reset',

    // ── 設定視窗 ──
    'set.title':'Settings',
    'set.nick':'Nickname',
    'set.nickPh':'Enter nickname',
    'set.lang':'Language',
    'set.theme':'Theme',
    'theme.light':'Light',
    'theme.dark':'Dark',
    'set.vol':'Volume',
    'set.extra':'Enable extra levels',
    'set.extraDesc':'Show spin-off works & special levels',

    // ── 設定 / 資料匯出與匯入 ──
    'set.data':'Export & import data',
    'set.dataDesc':'Data is stored in the browser cache. Please back up regularly.',
    'data.ph':'The export appears here',
    'data.export':'Export',
    'data.pickFile':'Import',
    'data.showJson':'Data (click to expand)',
    'data.dlHint':'If the browser cannot download automatically, expand the data above and copy it manually.',
    'data.dlFail':'Download failed. Expand the data above and copy it manually.',
    'imp.json':'Not valid JSON. Please check that the content is complete.',
    'imp.bad':'Unrecognized format. This is not a file exported by this game.',
    'imp.done':(a, s, b, st, n) => `Import finished: ${a} solution(s)${n ? ` and ${n} near solution(s)` : ''} added, ${s} skipped (duplicate or invalid); boards restored for ${b} level(s); ${st ? 'settings applied' : 'no settings in file'}.`,

    // ── 設定 / 重置資料 ──
    'reset.title':'Reset data',
    'reset.desc':'Export a backup first, then use this with care.',
    'reset.btn':'Reset all data',
    'reset.confirmTitle':'Confirm reset',
    'reset.confirmDesc':'This permanently deletes all solution books, saved boards and settings. It cannot be undone.\nType "Untouchable11" to confirm.',
    'reset.ph':'Untouchable11',
    'reset.cancel':'Cancel',
    'reset.confirm':'Delete',

    // ── 提示訊息（Toast） ──
    'toast.pick':'Select a piece on the board first',
    'toast.reset':'Board reset',
    'toast.emptyBoard':'The board is already empty',
    'toast.noUndo':'Nothing to undo',
    'toast.new':(lv, n) => `Solved! New solution saved (${lv}, #${n})`,
    'toast.dup':'Solved! This solution is already in your book (rotations and mirrors count as the same).',
    'toast.near':'Near solution +1',
};
