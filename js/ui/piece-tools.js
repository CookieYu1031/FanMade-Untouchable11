/* 常駐工具列：拼圖操作按鈕只有在「有選取方框內的拼圖」或「手上拿著拼圖」時可用 */
import { state, getP } from '../state/state.js';
import { els } from './dom.js';
import { toolsAttached, isPortrait, sideBySide } from './viewport.js';

export function syncTools() {
  const d = state.drag, p = state.selected && getP(state.selected);
  const on = !!(d && getP(d.id)) || !!(p && p.placed);
  els.tools.querySelectorAll('[data-act]').forEach(b => { b.disabled = !on; });
}

// 工具列位置依視窗寬度決定（樣式見 board.css、immersive.css）：
//   中、小視窗（< 1008px）→ 固定在視窗左側邊（常駐，不佔圖板區域）
//   大視窗（>= 1008px）、或高度很矮的橫向視窗（<= 520px，如手機橫放）→ 貼著圖板區域的左側邊框、垂直置中；此時圖板區塊高度不得小於工具列高度，圖板寬度也要讓出工具列的位置
//   沉浸模式 → 預設貼左緣垂直置中；手機（長或寬其中一邊 < PHONE_SIDE）且橫向時，改成打橫、緊貼視窗下緣（html.tools-h）

// 是否為手機：視窗的長或寬其中一邊小於 PHONE_SIDE（CSS px）。手機直拿時工具列放左側；橫拿時（鏡頭 / 瀏海常在左右兩側）改放下側。
export const PHONE_SIDE = 600;
export const isPhoneSized = () => Math.min(window.innerWidth, window.innerHeight) < PHONE_SIDE;
// 沉浸模式：決定工具列直放（左緣置中）或橫放（下緣）
function updateToolsOrient() {
  const landscape = window.innerWidth > window.innerHeight;
  document.documentElement.classList.toggle('tools-h', state.immersive && landscape && isPhoneSized());
}
export const toolsHorizontal = () => document.documentElement.classList.contains('tools-h');

// fitBoard 開頭呼叫：回傳圖板左右兩側各需要讓出的寬度（px；直向 = 0；橫放 = 0，改由 toolsReserveBottom 讓出下方空間），並設定圖板區塊的最小高度
export function layoutTools() {
  updateToolsOrient();
  const inBoard = state.immersive || toolsAttached();   // 沉浸模式：不分視窗大小，工具列都在左側
  els.tools.parentElement.style.minHeight = inBoard ? els.tools.offsetHeight + 16 + 'px' : '';
  if (inBoard) return !toolsHorizontal() ? els.tools.offsetWidth : 0;
  // 固定在視窗左側的工具列（中視窗橫向）：會蓋到圖板區域左側（頁面左右邊距 16px 以外的部分），圖板左右各多讓出這個寬度，才不會被工具列擋住；直向時工具列在圖板下方，不用讓
  return !isPortrait() && sideBySide() ? Math.max(0, els.tools.offsetWidth - 16) : 0;
}
// 沉浸模式、工具列橫放在下緣時，圖板下方要讓出的高度（工具列高度，已含安全區 + 間隙 8px）；其他情況 = 0
export const toolsReserveBottom = () => state.immersive && toolsHorizontal() ? els.tools.offsetHeight + 8 : 0;
