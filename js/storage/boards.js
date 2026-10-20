/* 各關卡盤面的自動暫存與讀回檢查
 * 本機存檔格式：{ version:2, level, group, boards:{鍵:拼圖陣列}, times:{鍵:最後變更時間}, lt:關卡 / 組合最後變更時間 }
 *   times / lt 供雲端同步比對：換裝置登入時，每個盤面以「較晚變更」的那一份為準（見 cloud/sync.js） */
import { Store, Hooks, KEY_BOARDS } from './store.js';
import { LEVELS } from '../core/config.js';
import { state, toNative, fromNative, freshPieces, absCells, keyLv, keyGrp, boardKey, isLocalBoardKey } from '../state/state.js';
import { isTypedCode } from '../core/random-code.js';
import { legacyBoard } from './legacy.js';

// 盤面的鍵：一般關卡 = lv；有拼圖組合的關卡 = 「lv:組合代號」（見 state.js 的 boardKey）；group = 各關卡目前使用的組合
const nativeBoards = () => Object.fromEntries(Object.keys(state.boards).map(k => [k, toNative(state.boards[k], keyLv(k))]));

// 上一次存檔時各盤面的內容（字串）：只有「真的變動」的盤面才會更新時間、通知雲端；重繪、縮放視窗等沒有改變盤面的動作一律不算
const lastSig = {};
let lastMeta = '';
const levelSig = () => JSON.stringify([state.level, state.group]);

// 隨機挑戰的盤面本機只留「動過的」最近 KEEP_RANDOM 份（雲端只留目前代碼的那一份，見 cloud/sync.js）
const KEEP_RANDOM = 12;
const isUntouched = ps => ps.every(p => !p.placed && !p.rot && !p.flip);
function pruneRandom(nb, times) {
  const keys = Object.keys(nb).filter(isLocalBoardKey);
  const keep = new Set(keys.filter(k => !isUntouched(nb[k])).sort((a, b) => (times[b] || 0) - (times[a] || 0)).slice(0, KEEP_RANDOM));
  const cur = isLocalBoardKey(String(state.level)) ? boardKey() : null;   // 正在玩的這一份一定留著（動過的話）
  if (cur && nb[cur] && !isUntouched(nb[cur])) keep.add(cur);
  keys.forEach(k => { if (!keep.has(k)) { delete nb[k]; delete times[k]; } });
}
function seedSig() {
  const nb = nativeBoards();
  Object.keys(nb).forEach(k => { lastSig[k] = JSON.stringify(nb[k]); });
  lastMeta = levelSig();
}

// 讀取本機存檔（雲端同步用）
export function readBoardsStore() {
  const s = Store.get(KEY_BOARDS, null) || {};
  return {
    level: Number.isInteger(s.level) ? s.level : 1,
    group: (s.group && typeof s.group === 'object') ? s.group : {},
    boards: (s.boards && typeof s.boards === 'object') ? s.boards : {},
    times: (s.times && typeof s.times === 'object') ? s.times : {},
    lt: Number.isFinite(s.lt) ? s.lt : 0,
  };
}

export function persistBoards() {
  if (state.wiping) return;
  const prev = readBoardsStore(), times = { ...prev.times }, nb = nativeBoards(), now = Date.now();
  let lt = prev.lt, changed = false;
  for (const k of Object.keys(nb)) {
    const sig = JSON.stringify(nb[k]);
    if (lastSig[k] !== sig) { lastSig[k] = sig; times[k] = now; lt = now; changed = true; }
  }
  pruneRandom(nb, times);
  const m = levelSig();
  if (m !== lastMeta) { lastMeta = m; lt = now; changed = true; }
  Store.set(KEY_BOARDS, { version:2, level:state.level, group:{ ...state.group }, boards:nb, times, lt });
  if (changed && Hooks.boards) Hooks.boards();   // 通知雲端同步（盤面屬於延遲同步：等下一個定時點才真正上傳）
}
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

// 從本機存檔還原各關盤面（開機時、以及雲端資料套用到本機後呼叫）
//   level = true 時一併切到存檔記錄的關卡；存檔裡沒有的盤面視為全新（例如選擇「不合併」而捨棄本機紀錄）
export function restoreBoards({ level = true } = {}) {
  const sb = Store.get(KEY_BOARDS, null);
  if (sb && sb.boards && typeof sb.boards === 'object') {
    const legacyB = sb.version !== 2;   // 舊版暫存盤面：換成新的拼圖代號
    const sg = sb.group;                // 有拼圖組合的關卡，上次使用哪一組（隨機挑戰：上次輸入的代碼）
    if (sg && typeof sg === 'object') LEVELS.forEach(L => {
      if (L.groups && L.groups.some(g => g.key === sg[L.lv])) state.group[L.lv] = sg[L.lv];
      else if (L.random && isTypedCode(sg[L.lv])) state.group[L.lv] = sg[L.lv];
    });
    // 隨機挑戰的盤面：存檔裡有哪些組合的盤面就還原哪些（鍵 = lv:原代碼；格式不對的略過）
    Object.keys(sb.boards).filter(k => isLocalBoardKey(k) && !(k in state.boards)).slice(0, KEEP_RANDOM + 4).forEach(k => {
      const L = LEVELS[keyLv(k) - 1];
      if (L.codec.isCanon(keyGrp(k))) state.boards[k] = freshPieces(keyLv(k), keyGrp(k));
    });
    Object.keys(state.boards).forEach(k => {     // 鍵：lv，或有拼圖組合的「lv:組合」
      const b = sb.boards[k];
      const next = b ? fromNative(sanitizeNative(legacyB ? legacyBoard(b) : b, k), keyLv(k)) : freshPieces(keyLv(k), keyGrp(k));
      if (JSON.stringify(next) !== JSON.stringify(state.boards[k])) { state.boards[k] = next; state.hist[k] = []; }   // 盤面被換掉：舊的「返回上一步」紀錄作廢
    });
    if (level && LEVELS[Number(sb.level) - 1]) state.level = Number(sb.level);
  }
  seedSig();
}
