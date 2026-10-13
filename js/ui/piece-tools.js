/* 常駐工具列：拼圖操作按鈕只有在「有選取方框內的拼圖」或「手上拿著拼圖」時可用 */
import { state, getP } from '../state/state.js';
import { els } from './dom.js';

export function syncTools() {
  const d = state.drag, p = state.selected && getP(state.selected);
  const on = !!(d && getP(d.id)) || !!(p && p.placed);
  els.tools.querySelectorAll('[data-act]').forEach(b => { b.disabled = !on; });
}

// 工具列位置依視窗方向決定（樣式見 board.css）：
//   直向視窗（不論寬窄）→ 固定在視窗左側邊（常駐，不佔圖板區域）
//   橫向視窗 → 貼著圖板區域的左側邊框、垂直置中；此時圖板區塊高度不得小於工具列高度，圖板寬度也要讓出工具列的位置
//   沉浸模式 → 預設貼左緣垂直置中；手機（isPhoneLike），或偵測到靈動島 / 挖孔 / 瀏海會遮到左緣時，改成打橫靠視窗左下（html.tools-h）
const portraitMQ = window.matchMedia('(orientation:portrait)');

// 偵測螢幕上的遮擋物（靈動島、挖孔鏡頭、瀏海）：網頁唯一能取得的資訊是 env(safe-area-inset-*)（index.html 已設 viewport-fit=cover），
// 用一個隱形探針元素讀出四邊的實際像素值。工具列在左緣，所以左緣有內縮（手機打橫、遮擋物在左邊）就視為會遮到；
// 上緣有內縮而且工具列的上緣被它蓋住（視窗很矮、工具列頂到標題列）也算。
let probe = null;
function insets() {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'
      + 'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe), n = k => parseFloat(cs[k]) || 0;
  return { top: n('paddingTop'), right: n('paddingRight'), bottom: n('paddingBottom'), left: n('paddingLeft') };
}
export function cutoutBlocksTools() {
  const i = insets();
  if (i.left > 0) return true;
  const stage = els.tools.parentElement.parentElement, bar = stage.querySelector(':scope > h2');
  return i.top > 0 && bar && els.tools.getBoundingClientRect().top < bar.getBoundingClientRect().bottom;
}
// 是否為手機（打橫時鏡頭多半在左右短邊的中間，會擋到貼左緣的工具列）：
//   網頁讀不到實際機型（iOS Safari 完全沒有；Android Chrome 的 userAgentData.model 只有型號代碼，還得自備機型對照表），
//   也讀不到 Android 上的挖孔位置（env(safe-area-inset-*) 在 Android Chrome 多半是 0），所以改用「裝置類型」判斷：
//   觸控裝置，且（iPhone / iPod，或螢幕短邊 < 600 CSS px 且不是 userAgentData 標示的非行動裝置）。平板（iPad 等）不算。
let phone = null;
export function isPhoneLike() {
  if (phone !== null) return phone;
  const ua = navigator.userAgentData, s = navigator.userAgent || '';
  if (!window.matchMedia('(pointer:coarse)').matches) phone = false;
  else if (/iPhone|iPod/.test(s)) phone = true;
  else if (ua && ua.mobile === false) phone = false;
  else phone = Math.min(screen.width, screen.height) < 600;
  return phone;
}
// 沉浸模式：決定工具列直放（左緣置中）或橫放（左下）。先切回直放再量，結果才不會被上一次的狀態影響
function updateToolsOrient() {
  const root = document.documentElement;
  root.classList.remove('tools-h');
  if (state.immersive && (isPhoneLike() || cutoutBlocksTools())) root.classList.add('tools-h');
}
export const toolsHorizontal = () => document.documentElement.classList.contains('tools-h');

// fitBoard 開頭呼叫：回傳圖板左右兩側各需要讓出的寬度（px；直向 = 0；橫放 = 0，改由 toolsReserveBottom 讓出下方空間），並設定圖板區塊的最小高度
export function layoutTools() {
  updateToolsOrient();
  const inBoard = state.immersive || !portraitMQ.matches;   // 沉浸模式：不分直橫向，工具列都在左側
  els.tools.parentElement.style.minHeight = inBoard ? els.tools.offsetHeight + 16 + 'px' : '';
  return inBoard && !toolsHorizontal() ? els.tools.offsetWidth : 0;
}
// 沉浸模式、工具列橫放在左下時，圖板下方要讓出的高度（工具列高度 + 下邊距 10px + 間隙 8px）；其他情況 = 0
export const toolsReserveBottom = () => state.immersive && toolsHorizontal() ? els.tools.offsetHeight + 18 : 0;
