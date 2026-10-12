/* 沉浸模式的小型拼圖盤 —— 點右下角圓點，在圓點上方彈出（內容與一般拼圖盤相同，只是沒有頂欄）
 *   排列沿用 render-tray.js 的 trayRows（同樣的行、欄寬比重、槽位順序）。
 *   高度上限：視窗夠高（如電腦視窗，>= 560px）→ 不超過視窗高度的一半；
 *             視窗不夠高（如手機打橫）→ 只要不擋到上方標題列的按鈕（關閉沉浸模式等）即可。
 *   寬度上限：不蓋到左側的工具列（工具列打橫靠左下時，彈出的拼圖盤在它上方，不衝突）。
 *   拼圖大小依上述空間自動縮放（放得下就盡量大，最大 28px / 格），真的放不下才出現捲軸。
 *   開啟狀態只在這裡保存；拖曳開始（真的移動）時會自動收起，放下後維持收起（見 renderFan）。
 *   檔名沿用 fan.js 以維持 import 路徑；匯出的函式名稱（isFanOpen / setFanOpen / renderFan）也不變。 */
import { PIECE } from '../core/config.js';
import { state, curPieces, colorOf } from '../state/state.js';
import { $, els } from './dom.js';
import { miniSVG } from './svg.js';
import { trayRows, trayCardRows, trayPerRow, trayUnit } from './render-tray.js';

const TALL = 560;        // 視窗高度達此值才套用「不超過一半」的限制
const GAP = 8;           // 行、欄間距（同拼圖盤）
const PAD = 8;           // 小拼圖盤的內距
const CARD_PAD = 16;     // 卡片內距 12px + 邊框 4px（同拼圖盤）
const MIN_CELL = 6, MAX_CELL = 28;
let open = false;

export const isFanOpen = () => open;
export function setFanOpen(v) {
  v = !!v && state.immersive;
  open = v;
  $('fan').classList.toggle('open', v);
  const dot = $('fanDot');
  dot.classList.toggle('open', v);
  dot.setAttribute('aria-expanded', String(v));
  if (v) renderFan();
}

export function renderFan() {
  if (!open || !state.immersive) return;
  if (state.drag && state.drag.moved) { setFanOpen(false); return; }   // 拖出拼圖後收起（DOM 保留，不影響進行中的拖曳）
  const fan = $('fan'), dot = $('fanDot'), stage = fan.parentElement;
  const sr = stage.getBoundingClientRect(), dr = dot.getBoundingClientRect();
  const bar = stage.querySelector(':scope > h2');
  const barBottom = bar ? bar.getBoundingClientRect().bottom - sr.top : 0;   // 標題列下緣（含右上角按鈕與安全區）
  const rightEdge = dr.right - sr.left;
  const bottomGap = parseFloat(getComputedStyle(fan).bottom) || 0;           // 小拼圖盤下緣 → 圖板區塊下緣（由 CSS 決定，在圓點上方）
  const popBottom = sr.height - bottomGap;                                   // 小拼圖盤下緣（相對圖板區塊上緣）

  // 可用高度：不擋到標題列按鈕；視窗夠高時再限制在一半以內
  let maxH = popBottom - barBottom - 8;
  if (sr.height >= TALL) maxH = Math.min(maxH, sr.height / 2);
  maxH = Math.max(90, maxH);
  // 可用寬度：不蓋到左側垂直工具列（打橫靠左下時不受限）
  const tl = els.tools.getBoundingClientRect();
  const vertical = tl.height > tl.width;
  const sal = parseFloat(getComputedStyle(stage.querySelector('.stage-body')).paddingLeft) || 0;
  const leftBound = vertical ? tl.right - sr.left + 8 : sal + 8;
  const maxW = Math.max(150, rightEdge - leftBound);

  const rows = trayRows(), R = rows.length, per = trayPerRow(), u = trayUnit(), cr = trayCardRows();
  // 每格像素：由寬度與高度兩邊各算一個上限，取較小者
  const wCell = Math.floor(((maxW - 2 - 2 * PAD - GAP * (per - 1)) / per - CARD_PAD) / u);
  const hCell = Math.floor(((maxH - 2 - 2 * PAD - GAP * (R - 1)) / R - CARD_PAD) / cr);
  const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, wCell, hCell));
  const rowH = cr * cell + CARD_PAD;
  // 寬度只取剛好放得下的（每個位置 u 格 + 卡片內距），靠右對齊圓點
  const width = Math.min(maxW, 2 + 2 * PAD + per * (u * cell + CARD_PAD) + GAP * (per - 1));
  const height = Math.min(maxH, 2 + 2 * PAD + R * rowH + GAP * (R - 1));

  fan.style.width = width + 'px';
  fan.style.maxHeight = maxH + 'px';
  fan.style.setProperty('--trow-h', rowH + 'px');
  fan.firstElementChild.innerHTML = rows.map(r =>
    `<div class="trow" style="grid-template-columns:${r.cols.map(w => `minmax(0,${w}fr)`).join(' ')}">` + r.items.map(({ p }) => {
      const sel = state.selected === p.id;
      return `<div class="card${sel ? ' sel' : ''}${p.placed ? ' placed' : ''}" data-id="${p.id}">${miniSVG(PIECE[p.id].matrix, cell, colorOf(p.id))}</div>`;
    }).join('') + `</div>`).join('');
  fan.style.height = height + 'px';
}
