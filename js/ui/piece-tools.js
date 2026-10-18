/* 常駐工具列：拼圖操作按鈕只有在「有選取方框內的拼圖」或「手上拿著拼圖」時可用 */
import { state, getP } from '../state/state.js';
import { els } from './dom.js';

export function syncTools() {
  const d = state.drag, p = state.selected && getP(state.selected);
  const on = !!(d && getP(d.id)) || !!(p && p.placed);
  els.tools.querySelectorAll('[data-act]').forEach(b => { b.disabled = !on; });
}

// 工具列位置依視窗方向決定（樣式見 board.css、immersive.css）：
//   直向視窗（不論寬窄）→ 固定在視窗左側邊（常駐，不佔圖板區域）
//   橫向視窗 → 貼著圖板區域的左側邊框、垂直置中；此時圖板區塊高度不得小於工具列高度，圖板寬度也要讓出工具列的位置
//   沉浸模式 → 預設貼左緣垂直置中；手機（長或寬其中一邊 < PHONE_SIDE）且橫向時，改成打橫、緊貼視窗下緣（html.tools-h）
const portraitMQ = window.matchMedia('(orientation:portrait)');

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
  const inBoard = state.immersive || !portraitMQ.matches;   // 沉浸模式：不分直橫向，工具列都在左側
  els.tools.parentElement.style.minHeight = inBoard ? els.tools.offsetHeight + 16 + 'px' : '';
  return inBoard && !toolsHorizontal() ? els.tools.offsetWidth : 0;
}
// 沉浸模式、工具列橫放在下緣時，圖板下方要讓出的高度（工具列高度，已含安全區 + 間隙 8px）；其他情況 = 0
export const toolsReserveBottom = () => state.immersive && toolsHorizontal() ? els.tools.offsetHeight + 8 : 0;
