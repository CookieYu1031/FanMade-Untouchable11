/* 返回上一步 —— 每個關卡各自的盤面快照堆疊 */
import { state, boardKey } from '../state/state.js';

const HIST_MAX = 15;
export const histOf = () => state.hist[boardKey()] || (state.hist[boardKey()] = []);
export function pushHistory(before) {
  const h = histOf(); h.push(before);
  if (h.length > HIST_MAX) h.shift();
  updateUndo();
}
export const updateUndo = () => { const b = document.getElementById('btnUndo'); if (b) b.disabled = !histOf().length; };
