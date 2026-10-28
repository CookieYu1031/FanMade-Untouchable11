/* 遊戲狀態 —— 目前關卡、各關卡盤面、拼圖姿態與座標換算
 *   pieceState = { id, rot(0~3), flip(bool), placed(bool), x, y }  ← (x,y) 為矩陣左上角在底板的格座標 */
import { LEVELS, levelOf, PIECE, COLORS, SLOT_COLORS, STAR_NAMES, CONFIG } from '../core/config.js';
import { orient, cellsOf } from '../core/matrix.js';
import { pickLang } from '../i18n/i18n.js';
import { isTypedCode } from '../core/random-code.js';

/* ---- 拼圖組合（摘星挑戰：L.groups = [{ key, pieces, ids }]；其他關卡沒有） ----
 * 同一關有多組拼圖，每組各自保留一份盤面與「返回上一步」紀錄；目前使用哪一組記在 state.group[lv]。
 * ---- 隨機挑戰（L.random / L.codec）：組合由 4 碼代碼決定 ----
 * state.group[lv] 存的是「玩家輸入（或骰子抽出）的代碼」，可以是任意 4 個字；真正的組合是它映射後的「原代碼」（curGroup）。
 * 盤面的鍵與配色一律用原代碼，所以不同的輸入只要映射到同一組，就共用同一份盤面。 */
// 隨機挑戰：玩家目前輸入的代碼（沒有或格式不對 = 預設組合）
export const typedOf = (L = curLevel()) => { const v = state.group[L.lv]; return isTypedCode(v) ? v : L.codec.defaultCode; };
// 目前使用的組合代號（沒有組合的關卡 = null；隨機挑戰 = 原代碼）
export const curGroup = (L = curLevel()) => L.random ? L.codec.canon(typedOf(L)) : L.groups ? (L.groups.find(g => g.key === state.group[L.lv]) || L.groups[0]).key : null;
// 關卡 L 的某一組使用哪些拼圖（代號字串）；沒指定（或找不到）= 目前使用的組合
// 隨機挑戰的槽位順序：一般拼圖在前、長拼圖（寬度超過 4 格：1、2、3、4、7、8 號）統一排到最後；各自維持號碼由小到大。槽位順序同時決定拼圖盤排列與顏色
const longLast = ids => { const wide = c => PIECE[c].matrix[0].length > 4; return [...ids].filter(c => !wide(c)).concat([...ids].filter(wide)).join(''); };
export const idsOf = (L, grp) => {
  if (L.random) return longLast(L.codec.idsOfCode(grp == null ? curGroup(L) : grp));
  if (!L.groups) return L.ids;
  return (L.groups.find(g => g.key === grp) || L.groups.find(g => g.key === curGroup(L))).ids;
};
// 盤面存放的鍵：一般關卡 = lv；有組合的關卡 = 「lv:組合代號」（隨機挑戰：「lv:原代碼」）
export const boardKey = (lv = state.level, grp) => {
  const L = levelOf(lv);
  if (L.random) return `${lv}:${grp == null ? curGroup(L) : L.codec.canon(grp)}`;
  return L.groups ? `${lv}:${grp == null ? curGroup(L) : grp}` : String(lv);
};
export const keyLv  = key => parseFloat(key);   // lv 可以是小數（如 12.1），「12.1:a」→ 12.1
export const keyGrp = key => String(key).includes(':') ? String(key).split(':')[1] : null;
// 隨機挑戰的盤面鍵會隨玩家抽到的組合不斷增加：本機最多留 12 份，雲端只留「目前代碼」的那一份（見 storage/boards.js、cloud/sync.js）
export const isLocalBoardKey = key => { const L = levelOf(keyLv(key)); return !!(L && L.random); };
// 隨機挑戰上雲端的盤面只有一份：目前代碼（原代碼）對應的那份；lb = 本機存檔（readBoardsStore 的結果）
export const syncRandomKeys = lb => new Set(LEVELS.filter(L => L.random && isTypedCode(lb.group[L.lv])).map(L => `${L.lv}:${L.codec.canon(lb.group[L.lv])}`));
export const allBoardKeys = () => LEVELS.flatMap(L => L.groups ? L.groups.map(g => boardKey(L.lv, g.key)) : [boardKey(L.lv)]);   // 隨機挑戰只有「目前的組合」那一份，其餘用到才建立（見 curPieces）
// 解答 / 盤面字串（sig、disp）是哪一組：用盤面上出現的拼圖代號比對（各組的拼圖組成不同，見 config.js 的檢查）
export function groupOfSig(L, sig) {
  const used = new Set(String(sig).replace(/[./]/g, ''));
  if (L.random) return L.codec.codeOfIdSet([...used].join(''));   // 隨機挑戰：由用到的 9 片拼圖反推原代碼
  if (!L.groups) return null;
  const g = L.groups.find(k => k.ids.length === used.size && [...k.ids].every(c => used.has(c)));
  return g ? g.key : null;
}
// 解答冊清單裡已經解出哪些組合
export const solvedGroups = (L, list) => new Set((list || []).map(it => groupOfSig(L, it.sig)).filter(Boolean));
export const grpTag = (L, key) => L.random ? (key || '') : (L.groups && key) ? starName(key) : '';
// 摘星挑戰：這組（一顆星）目前語言的名稱（北斗 = 天樞…；英 / 日文 = α UMa…；缺少該語言時用中文，再沒有就用代號）
// 星圖上顯示的名稱：所有語言都用拜耳命名（α UMa…），沒有就用原名
export const skyLabel = key => (STAR_NAMES[key] || {}).bayer || starName(key);
export const starName = key => pickLang(STAR_NAMES[key]) || key;
// 隨機挑戰的代碼標註：輸入的代碼與原代碼相同 → 「3K7Z」；不同 → 「GOOD(3K7Z)」（英文字母一律顯示大寫）
const fmtTag = (typed, canon) => { const u = String(typed || '').toUpperCase(); return u && u !== canon ? `${u}(${canon})` : canon; };
export const curTag = (L = curLevel()) => L.random ? fmtTag(typedOf(L), curGroup(L)) : grpTag(L, curGroup(L));   // 標題列用：目前這組
export const itemTag = (L, item) => { const g = groupOfSig(L, item.sig); return L.random ? (g ? fmtTag(item.code, g) : '') : grpTag(L, g); };   // 解答冊用：這組解答

// 拼圖 id 在關卡 L（的某一組）中所在的槽位顏色：顏色跟槽位掛鉤，所以檢視其他組的解答時要指定 grp
export const colorOf = (id, L = curLevel(), grp) => {
  const ids = idsOf(L, grp);
  const names = SLOT_COLORS[ids.length] || SLOT_COLORS[11];
  return COLORS[names[Math.max(0, ids.indexOf(id)) % names.length]];
};

export const freshPieces = (lv, grp) => idsOf(levelOf(lv), grp).split('').map(id => ({ id, rot:0, flip:false, placed:false, x:0, y:0 }));
export const state = {
  level: 1,
  boards: {},          // 每個難度各自保留一份盤面，切換難度不會遺失進度（鍵見 boardKey：有拼圖組合的關卡每一組各一份）
  group: {},           // 有拼圖組合的關卡目前使用哪一組：{ lv: 組合代號 }（沒記錄 = 第一組）
  selected: null,      // 目前選取的拼圖 id
  drag: null,          // 拖曳中的暫存資訊
  cell: 30,            // 底板每格的像素大小（拖曳殘影也用這個大小）
  trayCell: 20,        // 拼圖盤裡拼圖每格的像素大小（只依拼圖盤寬度決定，與底板無關）
  rotated: false,      // 底板轉成橫式顯示（整體旋轉 90°；啟動時由 applyMode 設為 true），盤面座標以目前顯示方向為準
  immersive: false,    // 沉浸模式：圖板放大到佔滿整個頁面（見 js/ui/immersive.js）
  chain: null,         // 連續同方向旋轉的紀錄 { id, dir, n }，其他操作會把它清掉
  hist: {},            // 每個難度（每一組）各自的「返回上一步」堆疊（最多 15 步，存盤面快照）
  wiping: false,       // 重置資料時為 true：避免離開頁面時又把盤面存回去
  viewItem: null,      // 解答檢視視窗目前顯示的解答
};
// 依設定檔建立各關卡的初始盤面（需在 loadConfig() 之後呼叫）
export function initState() {
  LEVELS.forEach(L => { if (L.random && !isTypedCode(state.group[L.lv])) state.group[L.lv] = L.codec.rollCode(); });   // 隨機挑戰：第一次進來先隨機抽一組（之後以存檔為準）
  allBoardKeys().forEach(k => { state.boards[k] = freshPieces(keyLv(k), keyGrp(k)); });
}

export const curLevel  = () => levelOf(state.level);
export const lvName    = L => pickLang(L.names);
// 關卡顯示名稱：Lv1~8 有等級編號；獨立關卡（大師挑戰、危險貨物）只顯示名稱
export const lvLong    = L => L.extra ? lvName(L) : `Level ${L.lv} ${lvName(L)}`;
export const lvShort   = L => L.extra ? lvName(L) : `Level ${L.lv}`;
export const lvTag     = L => L.extra ? lvName(L) : `Lv${L.lv} ${lvName(L)}`;
// 目前「顯示方向」的底板尺寸：橫式時寬高對調
export const dims = () => { const L = curLevel(); return state.rotated ? { cols:L.rows, rows:L.cols } : { cols:L.cols, rows:L.rows }; };
export const curPieces = () => { const k = boardKey(); return state.boards[k] || (state.boards[k] = freshPieces(state.level, curGroup())); };   // 隨機挑戰第一次用到的組合在這裡才建立盤面
export const getP      = id => curPieces().find(p => p.id === id);
export const shapeOf   = p => orient(PIECE[p.id].matrix, p.rot, p.flip);
// 拼圖在底板上的所有絕對格座標
export const absCells  = p => cellsOf(shapeOf(p)).map(([x, y]) => [p.x + x, p.y + y]);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 把整組盤面旋轉 90°（切換直式 / 橫式顯示時使用）。W、H = 旋轉前底板的寬、高。
//   順時針：格 (x,y) -> (H-1-y, x)；逆時針：格 (x,y) -> (y, W-1-x)
function rotatePieces(pieces, dir, W, H) {
  return pieces.map(p => {
    if (!p.placed) return { ...p };
    const m = shapeOf(p), w = m[0].length, h = m.length;
    return dir === 'cw'
      ? { ...p, rot:(p.rot + 1) % 4, x:H - p.y - h, y:p.x }
      : { ...p, rot:(p.rot + 3) % 4, x:p.y, y:W - p.x - w };
  });
}
export const clonePieces = ps => JSON.parse(JSON.stringify(ps));
// 暫存槽與解答冊一律用簡報冊的原始方向存，讀取時再轉成目前顯示方向
export const toNative   = (ps, lv) => { const L = levelOf(lv); return state.rotated ? rotatePieces(ps, 'ccw', L.rows, L.cols) : clonePieces(ps); };
export const fromNative = (ps, lv) => { const L = levelOf(lv); return state.rotated ? rotatePieces(ps, 'cw', L.cols, L.rows) : clonePieces(ps); };

// 底板一律用橫式顯示（左右寬、上下窄），不論視窗寬度。
// 第一次呼叫時把初始（簡報冊方向）的盤面整個轉成橫式；之後 want 恆為 true，不會再有變化。
export function applyMode() {
  const want = true;
  if (want === state.rotated) return false;
  Object.keys(state.boards).forEach(k => {
    const L = levelOf(keyLv(k));
    const rot = ps => want ? rotatePieces(ps, 'cw', L.cols, L.rows) : rotatePieces(ps, 'ccw', L.rows, L.cols);
    state.boards[k] = rot(state.boards[k]);
    state.hist[k] = (state.hist[k] || []).map(rot); // 復原堆疊裡的快照也要一起轉向
  });
  state.rotated = want;
  return true;
}

// 近似解總組數（未知 = null）；遊戲標題（獨立關卡會換標題）
export const nearTotal = L => typeof L.near === 'number' ? L.near : null;
export const gameTitle = L => L.title || CONFIG.defaultTitle;
