/* 遊戲狀態 —— 目前關卡、各關卡盤面、拼圖姿態與座標換算
 *   pieceState = { id, rot(0~3), flip(bool), placed(bool), x, y }  ← (x,y) 為矩陣左上角在底板的格座標 */
import { LEVELS, PIECE, COLORS, SLOT_COLORS, CONFIG } from '../core/config.js';
import { orient, cellsOf } from '../core/matrix.js';
import { getLang } from '../i18n/i18n.js';

// 拼圖 id 在關卡 L 中所在的槽位顏色
export const colorOf = (id, L = curLevel()) => {
  const names = SLOT_COLORS[L.ids.length] || SLOT_COLORS[11];
  return COLORS[names[Math.max(0, L.ids.indexOf(id)) % names.length]];
};

export const freshPieces = lv => LEVELS[lv - 1].ids.split('').map(id => ({ id, rot:0, flip:false, placed:false, x:0, y:0 }));
export const state = {
  level: 1,
  boards: {},          // 每個難度各自保留一份盤面，切換難度不會遺失進度
  selected: null,      // 目前選取的拼圖 id
  drag: null,          // 拖曳中的暫存資訊
  cell: 30,            // 底板每格的像素大小
  rotated: false,      // 寬螢幕時底板轉成橫式顯示（整體旋轉 90°），盤面座標以目前顯示方向為準
  bookHidden: false,   // 解答冊是否隱藏
  solveInfo: null,     // 目前盤面過關後的收錄結果 { isNew }
  chain: null,         // 連續同方向旋轉的紀錄 { id, dir, n }，其他操作會把它清掉
  hist: {},            // 每個難度各自的「返回上一步」堆疊（最多 15 步，存盤面快照）
  wiping: false,       // 重置資料時為 true：避免離開頁面時又把盤面存回去
  viewItem: null,      // 解答檢視視窗目前顯示的解答
};
// 依設定檔建立各關卡的初始盤面（需在 loadConfig() 之後呼叫）
export function initState() {
  LEVELS.forEach(l => { state.boards[l.lv] = freshPieces(l.lv); });
}

export const curLevel  = () => LEVELS[state.level - 1];
export const lvName    = L => L.names[getLang()];
// 關卡顯示名稱：Lv1~8 有等級編號；獨立關卡（大師挑戰、危險貨物）只顯示名稱
export const lvLong    = L => L.extra ? lvName(L) : `Level ${L.lv} ${lvName(L)}`;
export const lvShort   = L => L.extra ? lvName(L) : `Level ${L.lv}`;
export const lvTag     = L => L.extra ? lvName(L) : `Lv${L.lv} ${lvName(L)}`;
// 目前「顯示方向」的底板尺寸：橫式時寬高對調
export const dims = () => { const L = curLevel(); return state.rotated ? { cols:L.rows, rows:L.cols } : { cols:L.cols, rows:L.rows }; };
export const curPieces = () => state.boards[state.level];
export const getP      = id => curPieces().find(p => p.id === id);
export const shapeOf   = p => orient(PIECE[p.id].matrix, p.rot, p.flip);
// 拼圖在底板上的所有絕對格座標
export const absCells  = p => cellsOf(shapeOf(p)).map(([x, y]) => [p.x + x, p.y + y]);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 把整組盤面旋轉 90°（切換直式 / 橫式顯示時使用）。W、H = 旋轉前底板的寬、高。
//   順時針：格 (x,y) -> (H-1-y, x)；逆時針：格 (x,y) -> (y, W-1-x)
export function rotatePieces(pieces, dir, W, H) {
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

// 螢幕寬度 >= 760px 視為寬螢幕，底板改橫式（左右寬、上下窄）
export const MQ = window.matchMedia('(min-width: 760px)');
export function applyMode() {
  const want = MQ.matches;
  if (want === state.rotated) return false;
  LEVELS.forEach(L => {
    const rot = ps => want ? rotatePieces(ps, 'cw', L.cols, L.rows) : rotatePieces(ps, 'ccw', L.rows, L.cols);
    state.boards[L.lv] = rot(state.boards[L.lv]);
    state.hist[L.lv] = (state.hist[L.lv] || []).map(rot); // 復原堆疊裡的快照也要一起轉向
  });
  state.rotated = want;
  return true;
}

// 近似解總組數（未知 = null）；遊戲標題（獨立關卡會換標題）
export const nearTotal = L => typeof L.near === 'number' ? L.near : null;
export const gameTitle = L => L.title || CONFIG.defaultTitle;
