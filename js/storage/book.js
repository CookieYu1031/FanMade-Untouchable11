/* 解答冊 —— 讀寫、新增解答、驗證簽章（Level 1~8 與獨立關卡共用） */
import { Store, Hooks, KEY_BOOK } from './store.js';
import { legacyLevels } from './legacy.js';
import { splitStarBook } from './migrate.js';

export const loadBook  = () => {
  const b = Store.get(KEY_BOOK, null);
  if (!b || !b.levels) return { version:2, levels:{}, near:{} };
  if (b.version === 2) { const had = (b.levels[12] || []).length; splitStarBook(b); if ((b.levels[12] || []).length !== had) Store.set(KEY_BOOK, b); return b; }   // 皇冠挑戰拆成北斗 / 獵戶：舊存檔裡獵戶的解答搬到 lv 12.1（只在有搬動時才寫回）
  const m = splitStarBook({ version:2, levels:legacyLevels(b.levels), near:legacyLevels(b.near) });   // 舊版解答冊：自動轉換並存回
  Store.set(KEY_BOOK, m);
  return m;
};
export const saveBook  = b => { Store.set(KEY_BOOK, b); if (Hooks.book) Hooks.book(); };   // 寫本機並通知雲端同步
// 加入一組解答到解答冊物件，回傳是否為新解
// sig = 去除旋轉鏡射後的標準簽章（用來判斷是否同一組）；disp = 玩家實際拼出的擺法（縮圖與檢視用，才不會鏡像顛倒）
// code = 隨機挑戰：玩家輸入的代碼（例如 GOOD；與映射後的原代碼不同才記，畫面上顯示成 GOOD(原代碼)）
export function addSolution(book, lv, sig, time, disp, nick, near, code) {
  const root = near ? (book.near = book.near || {}) : book.levels;   // near = 近似解冊
  const list = (root[lv] = root[lv] || []);
  if (list.some(it => it.sig === sig)) return false;
  const item = { sig, time: time || Date.now() };
  if (disp && disp !== sig) item.disp = disp;
  if (nick) item.nick = nick; // 作答當下的暱稱
  if (code) item.code = code; // 隨機挑戰：作答當下玩家輸入的代碼（只有與原代碼不同時才記）
  list.push(item);
  return true;
}
