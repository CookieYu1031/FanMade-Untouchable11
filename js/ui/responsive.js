/* 窄視窗與視窗大小改變的處理 */
import { applyMode, state } from '../state/state.js';
import { els } from './dom.js';
import { refresh } from './render.js';
import { fitBoard } from './render-board.js';
import { renderTray } from './render-tray.js';
import { syncTools } from './piece-tools.js';

// ---- 窄視窗（<760px，單欄堆疊）：少一點手動捲動 ----
// 點面板頂欄 → 捲到能完整看到該面板；點拼圖盤的拼圖 → 自動跳到圖板，讓玩家點按或拖曳放置
export function isNarrow() { return window.matchMedia('(max-width:759px)').matches; }
export function scrollToPanel(el) {
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
document.querySelectorAll('.stage>h2, .tray-panel>h2').forEach(h => h.addEventListener('click', e => {
  if (!isNarrow() || e.target.closest('button')) return;
  scrollToPanel(h.parentElement);
}));
// 視窗大小改變：跨過寬窄分界時，整個盤面旋轉 90° 並重畫；否則只重新計算格子大小
window.addEventListener('resize', () => {
  if (state.drag && state.drag.moved) return;
  if (applyMode()) refresh();
  else { fitBoard(); renderTray(); syncTools(); }
});
window.addEventListener('scroll', syncTools, { passive:true });
els.wrap.addEventListener('scroll', syncTools, { passive:true });
