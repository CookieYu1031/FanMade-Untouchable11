/* 常駐工具列（圖板左側）：拼圖操作按鈕只有在「有選取方框內的拼圖」或「手上拿著拼圖」時可用 */
import { state, getP } from '../state/state.js';
import { els } from './dom.js';

export function syncTools() {
  const d = state.drag, p = state.selected && getP(state.selected);
  const on = !!(d && getP(d.id)) || !!(p && p.placed);
  els.tools.querySelectorAll('[data-act]').forEach(b => { b.disabled = !on; });
}
