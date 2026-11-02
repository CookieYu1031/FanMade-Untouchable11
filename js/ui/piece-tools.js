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
//   沉浸模式 → 一律貼左緣垂直置中（已有安全區域設計，不再轉到下方，以免擠壓圖板）

// fitBoard 開頭呼叫：回傳圖板左右兩側各需要讓出的寬度（px），並設定圖板區塊的最小高度
export function layoutTools() {
  const inBoard = state.immersive || toolsAttached();   // 沉浸模式：不分視窗大小，工具列都在左側
  els.tools.parentElement.style.minHeight = inBoard ? els.tools.offsetHeight + 16 + 'px' : '';
  if (inBoard) return els.tools.offsetWidth;
  // 固定在視窗左側的工具列（中視窗橫向）：會蓋到圖板區域左側（頁面左右邊距 16px 以外的部分），圖板左右各多讓出這個寬度，才不會被工具列擋住；直向時工具列在圖板下方，不用讓
  return !isPortrait() && sideBySide() ? Math.max(0, els.tools.offsetWidth - 16) : 0;
}
