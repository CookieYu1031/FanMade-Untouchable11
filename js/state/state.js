/* 遊戲狀態 —— 目前關卡、各關卡盤面、拼圖姿態與座標換算
 *   pieceState = { id, rot(0~3), flip(bool), placed(bool), x, y }  ← (x,y) 為矩陣左上角在底板的格座標 */
import { LEVELS, PIECE, COLORS, SLOT_COLORS, CONFIG } from '../core/config.js';
import { orient, cellsOf } from '../core/matrix.js';
import { getLang, t } from '../i18n/i18n.js';

/* ---- 拼圖組合（皇冠挑戰：L.groups = [{ key, pieces, ids }]；其他關卡沒有） ----
 * 同一關有多組拼圖，每組各自保留一份盤面與「返回上一步」紀錄；目前使用哪一組記在 state.group[lv]。 */
// 目前使用的組合代號（沒有組合的關卡 = null）
export const curGroup = (L = curLevel()) => L.groups ? (L.groups.find(g => g.key === state.group[L.lv]) || L.groups[0]).key : null;
// 關卡 L 的某一組使用哪些拼圖（代號字串）；沒指定（或找不到）= 目前使用的組合
export const idsOf = (L, grp) => {
  if (!L.groups) return L.ids;
  return (L.groups.find(g => g.key === grp) || L.groups.find(g => g.key === curGroup(L))).ids;
};
// 盤面存放的鍵：一般關卡 = lv；有組合的關卡 = 「lv:組合代號」
export const boardKey = (lv = state.level, grp) => {
  const L = LEVELS[lv - 1];
  return L.groups ? `${lv}:${grp == null ? curGroup(L) : grp}` : String(lv);
};
export const keyLv  = key => parseInt(key, 10);
export const keyGrp = key => String(key).includes(':') ? String(key).split(':')[1] : null;
export const allBoardKeys = () => LEVELS.flatMap(L => L.groups ? L.groups.map(g => boardKey(L.lv, g.key)) : [boardKey(L.lv)]);
// 解答 / 盤面字串（sig、disp）是哪一組：用盤面上出現的拼圖代號比對（各組的拼圖組成不同，見 config.js 的檢查）
export function groupOfSig(L, sig) {
  if (!L.groups) return null;
  const used = new Set(String(sig).replace(/[./]/g, ''));
  const g = L.groups.find(k => k.ids.length === used.size && [...k.ids].every(c => used.has(c)));
  return g ? g.key : null;
}
// 解答冊清單裡已經解出哪些組合
export const solvedGroups = (L, list) => new Set((list || []).map(it => groupOfSig(L, it.sig)).filter(Boolean));
export const grpTag = (L, key) => (L.groups && key) ? t('grp.tag', key) : '';

// 拼圖 id 在關卡 L（的某一組）中所在的槽位顏色：顏色跟槽位掛鉤，所以檢視其他組的解答時要指定 grp
export const colorOf = (id, L = curLevel(), grp) => {
  const ids = idsOf(L, grp);
  const names = SLOT_COLORS[ids.length] || SLOT_COLORS[11];
  return COLORS[names[Math.max(0, ids.indexOf(id)) % names.length]];
};

export const freshPieces = (lv, grp) => idsOf(LEVELS[lv - 1], grp).split('').map(id => ({ id, rot:0, flip:false, placed:false, x:0, y:0 }));
export const state = {
  level: 1,
  boards: {},          // 每個難度各自保留一份盤面，切換難度不會遺失進度（鍵見 boardKey：有拼圖組合的關卡每一組各一份）
  group: {},           // 有拼圖組合的關卡目前使用哪一組：{ lv: 組合代號 }（沒記錄 = 第一組）
  selected: null,      // 目前選取的拼圖 id
  drag: null,          // 拖曳中的暫存資訊
  cell: 30,            // 底板每格的像素大小（拖曳殘影也用這個大小）
  trayCell: 20,        // 拼圖盤裡拼圖每格的像素大小（只依拼圖盤寬度決定，與底板無關）
  rotated: false,      // 底板轉成橫式顯示（整體旋轉 90°；啟動時由 applyMode 設為 true），盤面座標以目前顯示方向為準
  bookHidden: false,   // 解答冊是否隱藏
  chain: null,         // 連續同方向旋轉的紀錄 { id, dir, n }，其他操作會把它清掉
  hist: {},            // 每個難度（每一組）各自的「返回上一步」堆疊（最多 15 步，存盤面快照）
  wiping: false,       // 重置資料時為 true：避免離開頁面時又把盤面存回去
  viewItem: null,      // 解答檢視視窗目前顯示的解答
};
// 依設定檔建立各關卡的初始盤面（需在 loadConfig() 之後呼叫）
export function initState() {
  allBoardKeys().forEach(k => { state.boards[k] = freshPieces(keyLv(k), keyGrp(k)); });
}

export const curLevel  = () => LEVELS[state.level - 1];
export const lvName    = L => L.names[getLang()] || L.names.zh;
// 關卡顯示名稱：Lv1~8 有等級編號；獨立關卡（大師挑戰、危險貨物）只顯示名稱
export const lvLong    = L => L.extra ? lvName(L) : `Level ${L.lv} ${lvName(L)}`;
export const lvShort   = L => L.extra ? lvName(L) : `Level ${L.lv}`;
export const lvTag     = L => L.extra ? lvName(L) : `Lv${L.lv} ${lvName(L)}`;
// 目前「顯示方向」的底板尺寸：橫式時寬高對調
export const dims = () => { const L = curLevel(); return state.rotated ? { cols:L.rows, rows:L.cols } : { cols:L.cols, rows:L.rows }; };
export const curPieces = () => state.boards[boardKey()];
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
export const toNative   = (ps, lv) => { const L = LEVELS[lv - 1]; return state.rotated ? rotatePieces(ps, 'ccw', L.rows, L.cols) : clonePieces(ps); };
export const fromNative = (ps, lv) => { const L = LEVELS[lv - 1]; return state.rotated ? rotatePieces(ps, 'cw', L.cols, L.rows) : clonePieces(ps); };

// 底板一律用橫式顯示（左右寬、上下窄），不論視窗寬度。
// 第一次呼叫時把初始（簡報冊方向）的盤面整個轉成橫式；之後 want 恆為 true，不會再有變化。
export function applyMode() {
  const want = true;
  if (want === state.rotated) return false;
  Object.keys(state.boards).forEach(k => {
    const L = LEVELS[keyLv(k) - 1];
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
