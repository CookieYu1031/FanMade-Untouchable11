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
const portraitMQ = window.matchMedia('(orientation:portrait)');
// fitBoard 開頭呼叫：回傳圖板左右兩側各需要讓出的寬度（px；直向 = 0），並設定圖板區塊的最小高度
export function layoutTools() {
  const inBoard = !portraitMQ.matches;
  els.tools.parentElement.style.minHeight = inBoard ? els.tools.offsetHeight + 16 + 'px' : '';
  return inBoard ? els.tools.offsetWidth : 0;
}
