/* 各關卡盤面的自動暫存與讀回檢查 */
import { Store, KEY_BOARDS } from './store.js';
import { LEVELS } from '../core/config.js';
import { state, toNative, freshPieces, absCells, keyLv, keyGrp } from '../state/state.js';

// 盤面的鍵：一般關卡 = lv；有拼圖組合的關卡 = 「lv:組合代號」（見 state.js 的 boardKey）；group = 各關卡目前使用的組合
const nativeBoards = () => Object.fromEntries(Object.keys(state.boards).map(k => [k, toNative(state.boards[k], keyLv(k))]));
export function persistBoards() { if (state.wiping) return; Store.set(KEY_BOARDS, { version:2, level:state.level, group:{ ...state.group }, boards:nativeBoards() }); }
let persistTimer = null;
export function schedulePersist() { clearTimeout(persistTimer); persistTimer = setTimeout(persistBoards, 250); }
export const cancelPersist = () => clearTimeout(persistTimer);
// 讀進來的資料一律檢查：格式、旋轉值、座標是否在底板內，不合格的拼圖回到拼圖盤
export function sanitizeNative(arr, key) {
  const lv = keyLv(key), L = LEVELS[lv - 1], out = freshPieces(lv, keyGrp(key));
  if (!Array.isArray(arr)) return out;
  out.forEach(p => {
    const sp = arr.find(q => q && q.id === p.id); if (!sp) return;
    const q = { id:p.id, rot:(Number.isInteger(sp.rot) && sp.rot >= 0 && sp.rot < 4) ? sp.rot : 0, flip:!!sp.flip, placed:false, x:0, y:0 };
    if (sp.placed && Number.isInteger(sp.x) && Number.isInteger(sp.y)) {
      q.x = sp.x; q.y = sp.y;
      if (absCells(q).every(([x, y]) => x >= 0 && y >= 0 && x < L.cols && y < L.rows)) q.placed = true;
      else { q.x = 0; q.y = 0; q.rot = 0; q.flip = false; }
    }
    Object.assign(p, q);
  });
  return out;
}
