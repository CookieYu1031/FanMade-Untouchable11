/* 選取拼圖旁邊的工具列（旋轉、翻轉、收回）的定位 */
import { state, getP, clamp } from '../state/state.js';
import { els } from './dom.js';

// 選取拼圖旁邊的三個圖示（旋轉、翻轉、收回）：貼在被選取拼圖的上方，空間不夠就改放下方
export function syncTools() {
  const t = els.tools, id = state.selected, p = id && getP(id);
  if (!p || !p.placed || (state.drag && state.drag.moved)) { t.hidden = true; return; }
  const target = els.gPieces.querySelector(`.pc[data-id="${id}"]`);
  if (!target) { t.hidden = true; return; }
  t.hidden = false;
  const r = target.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight;
  const left = clamp(r.left + r.width / 2 - tw / 2, 6, window.innerWidth - tw - 6);
  let top = r.top - th - 8;
  if (top < 6) top = r.bottom + 8;
  t.style.left = left + 'px';
  t.style.top = top + 'px';
}
