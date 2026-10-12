/* 拼圖盤 */
import { PIECE } from '../core/config.js';
import { state, curPieces, curLevel, colorOf } from '../state/state.js';
import { els } from './dom.js';
import { miniSVG } from './svg.js';
import { syncTools } from './piece-tools.js';
import { renderFan } from './fan.js';

// 決定拼圖盤拼圖大小時，至少要放得下幾片：六格骨牌 3 片；其他類別（七格骨牌，如危險貨物2）2 片（版面不限制每行片數）
export const trayPerRow = (L = curLevel()) => (L.family || 'hexo') === 'hexo' ? 3 : 2;
// 拼圖盤每個位置的寬度（格）：六格骨牌固定 4 格；其他類別取本關拼圖的最大寬度
export const trayUnit = (L = curLevel()) => (L.family || 'hexo') === 'hexo' ? 4 : Math.max(4, ...[...L.ids].map(id => PIECE[id].matrix[0].length));
// 寬度超過一個位置的拼圖（六格骨牌的 1、2、3、4、7、8 號）視為「長拼圖」
const isWide = id => PIECE[id].matrix[0].length > trayUnit();

/* 拼圖盤排列：完全依槽位順序（不重排，才不會打亂佈局與顏色配置），由前往後讀取，每一行獨立判定（六格骨牌）：
 *   連續三個正常 → 一行，各佔 1/3
 *   一個正常 + 一個長 → 一行，1/3 + 2/3（長拼圖在前則 2/3 + 1/3）
 *   連續兩個長 → 一行，各佔 1/2
 * 湊不滿的零碎行（結尾的單一長拼圖、剩下的 1~2 個正常拼圖）不拉長，維持原本的欄寬靠左放（長拼圖 1/2、正常拼圖 1/3）。
 * 其他類別（七格骨牌）每行固定 trayPerRow 個。
 * 回傳 rows：每行 = { items:[{ p }], cols:[欄寬比重…] }（欄數可以多於片數，多出的欄留空）。 */
export function trayRows(L = curLevel()) {
  const all = curPieces().map(p => ({ p, wide: isWide(p.id) })), per = trayPerRow(L), rows = [];
  for (let k = 0; k < all.length;) {
    const a = all[k], b = all[k + 1], c = all[k + 2];
    let take, cols;
    if (per !== 3) { take = per; cols = Array(per).fill(1); }
    else if (!a.wide && b && !b.wide && c && !c.wide) { take = 3; cols = [1, 1, 1]; }
    else if (!a.wide && b && b.wide) { take = 2; cols = [1, 2]; }
    else if (a.wide && b && b.wide) { take = 2; cols = [1, 1]; }
    else if (a.wide && b) { take = 2; cols = [2, 1]; }
    else if (a.wide) { take = 1; cols = [1, 1]; }
    else { take = b && !b.wide ? 2 : 1; cols = [1, 1, 1]; }
    rows.push({ items: all.slice(k, k + take), cols });
    k += take;
  }
  return rows;
}
export const trayRowCount = () => trayRows().length;
// 卡片高度（格）：依本關拼圖的最大高度（六格最高 3 格、七格 3 格）；每一行一律用同一個高度，不論一般或長拼圖
export const trayCardRows = () => Math.max(3, ...curPieces().map(p => PIECE[p.id].matrix.length));
export function renderTray() {
  // 行高 = 卡片高度（格數 × 每格像素）+ 內距 12px + 邊框 4px；所有行共用，避免只有長拼圖的行變矮
  els.tray.style.setProperty('--trow-h', (trayCardRows() * state.trayCell + 16) + 'px');
  els.tray.innerHTML = trayRows().map(r =>
    `<div class="trow" style="grid-template-columns:${r.cols.map(w => `minmax(0,${w}fr)`).join(' ')}">` + r.items.map(({ p }) => {
      const sel = state.selected === p.id, pal = colorOf(p.id);
      return `<div class="card${sel ? ' sel' : ''}${p.placed ? ' placed' : ''}" data-id="${p.id}">${miniSVG(PIECE[p.id].matrix, state.trayCell, pal)}</div>`;
    }).join('') + `</div>`).join('');
  syncTools();
  renderFan();   // 沉浸模式的小型拼圖盤（沒開啟時什麼都不做）
}
