/* 存檔遷移：皇冠挑戰（lv 12）拆成「摘星:北斗」（lv 12，A~G，11 片）與「摘星:獵戶」（lv 12.1，a~g，12 片）
 * 舊存檔裡 lv 12 同時放了兩種組合的解答與盤面，這裡把 12 片組（獵戶）的部分搬到 lv 12.1。
 * 所有函式都可以重複執行（已經搬過就什麼也不做），本機存檔、雲端資料套用到本機時都會呼叫。 */
import { levelOf } from '../core/config.js';
import { groupOfSig } from '../state/state.js';

const OLD_LV = 12, NEW_LV = 12.1;
const newGroupKeys = () => { const L = levelOf(NEW_LV); return L && L.groups ? new Set(L.groups.map(g => g.key)) : null; };

// 解答冊：lv 12 裡屬於獵戶組合的解答搬到 lv 12.1（回傳同一個物件）
export function splitStarBook(book) {
  const L = levelOf(NEW_LV), old = book && book.levels && book.levels[OLD_LV];
  if (!L || !Array.isArray(old) || !old.length) return book;
  const keep = [], move = [];
  old.forEach(it => (it && groupOfSig(L, it.sig) ? move : keep).push(it));
  if (!move.length) return book;
  const dst = (book.levels[NEW_LV] = book.levels[NEW_LV] || []), seen = new Set(dst.map(it => it.sig));
  move.forEach(it => { if (!seen.has(it.sig)) { seen.add(it.sig); dst.push(it); } });
  book.levels[OLD_LV] = keep;
  return book;
}

// 盤面存檔 { level, group, boards, times }：舊鍵「12:a」→「12.1:a」；目前使用的組合、所在關卡也一起換（回傳同一個物件）
export function migrateBoardData(d) {
  const ks = newGroupKeys();
  if (!ks || !d) return d;
  const boards = d.boards || {}, times = d.times || {};
  Object.keys(boards).forEach(k => {
    const [lv, g] = String(k).split(':');
    if (parseFloat(lv) !== OLD_LV || !ks.has(g)) return;
    const nk = `${NEW_LV}:${g}`;
    if (!(nk in boards) || (times[k] || 0) > (times[nk] || 0)) { boards[nk] = boards[k]; if (k in times) times[nk] = times[k]; }
    delete boards[k]; delete times[k];
  });
  const grp = d.group && d.group[OLD_LV];
  if (grp && ks.has(grp)) {
    if (!d.group[NEW_LV]) d.group[NEW_LV] = grp;
    delete d.group[OLD_LV];
    if (Number(d.level) === OLD_LV) d.level = NEW_LV;   // 當時正停在獵戶的組合：回來時也停在獵戶這一關
  }
  return d;
}

// 雲端上殘留的舊盤面鍵（12:a~g）：已經搬到 12.1，同步時從雲端刪除
export const isMovedBoardKey = k => { const ks = newGroupKeys(), [lv, g] = String(k).split(':'); return !!ks && parseFloat(lv) === OLD_LV && ks.has(g); };
