/* 解答冊 —— 讀寫、新增解答、驗證簽章（Level 1~8 與獨立關卡共用） */
import { Store, Hooks, KEY_BOOK } from './store.js';
import { legacyLevels } from './legacy.js';
import { analyze, isNear } from '../game/analyze.js';
import { piecesFromSig } from '../game/signature.js';

export const loadBook  = () => {
  const b = Store.get(KEY_BOOK, null);
  if (!b || !b.levels) return { version:2, levels:{}, near:{} };
  if (b.version === 2) return b;
  const m = { version:2, levels:legacyLevels(b.levels), near:legacyLevels(b.near) };   // 舊版解答冊：自動轉換並存回
  Store.set(KEY_BOOK, m);
  return m;
};
export const saveBookLocal = b => Store.set(KEY_BOOK, b);   // 只寫本機（套用雲端資料時用）
export const saveBook  = b => { Store.set(KEY_BOOK, b); if (Hooks.book) Hooks.book(); };   // 寫本機並通知雲端同步
// 加入一組解答到解答冊物件，回傳是否為新解
// sig = 去除旋轉鏡射後的標準簽章（用來判斷是否同一組）；disp = 玩家實際拼出的擺法（縮圖與檢視用，才不會鏡像顛倒）
export function addSolution(book, lv, sig, time, disp, nick, near) {
  const root = near ? (book.near = book.near || {}) : book.levels;   // near = 近似解冊
  const list = (root[lv] = root[lv] || []);
  if (list.some(it => it.sig === sig)) return false;
  const item = { sig, time: time || Date.now() };
  if (disp && disp !== sig) item.disp = disp;
  if (nick) item.nick = nick; // 作答當下的暱稱
  list.push(item);
  return true;
}
// 檢查簽章是否真的是該難度的合法解（尺寸正確、11 片齊全、且判定為完全分開）
export function validSig(sig, L) {
  if (typeof sig !== 'string') return false;
  const rows = sig.split('/');
  if (rows.length !== L.rows || rows.some(r => r.length !== L.cols)) return false;
  const ps = piecesFromSig(sig, L);
  return !!ps && analyze(ps).solved;
}
// 檢查簽章是否為合法的近似解（只有 Lv8、危險貨物有近似解）
export function validNearSig(sig, L) {
  if (!L.near || typeof sig !== 'string') return false;
  const rows = sig.split('/');
  if (rows.length !== L.rows || rows.some(r => r.length !== L.cols)) return false;
  const ps = piecesFromSig(sig, L);
  return !!ps && isNear(analyze(ps), ps.length);
}
