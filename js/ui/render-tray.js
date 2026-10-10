/* 拼圖盤 */
import { PIECE, TRAY_ORDER } from '../core/config.js';
import { state, curPieces, curLevel, colorOf } from '../state/state.js';
import { els } from './dom.js';
import { miniSVG } from './svg.js';
import { syncTools } from './piece-tools.js';

// 拼圖盤每個位置的寬度（格）：六格骨牌固定 4 格；其他類別（七格骨牌）取本關拼圖的最大寬度，讓一行放得下兩片
export const trayUnit = (L = curLevel()) => (L.family || 'hexo') === 'hexo' ? 4 : Math.max(4, ...[...L.ids].map(id => PIECE[id].matrix[0].length));
// 寬度超過一個位置的拼圖（六格骨牌的 1、2、3、4、7、8 號）在拼圖盤佔兩個位置
const isWide = id => PIECE[id].matrix[0].length > trayUnit();
export const traySlots = () => curPieces().reduce((n, p) => n + (isWide(p.id) ? 2 : 1), 0);
const trayOrder = () => {
  const ids = curLevel().ids, ord = TRAY_ORDER[ids.length] || [...ids].map((_, i) => i + 1);
  return ord.map(n => ids[n - 1]).join('');
};
function trayRows() {
  const g = getComputedStyle(els.tray).gridTemplateColumns;
  const cols = g && g !== 'none' ? g.trim().split(/\s+/).length : 0;
  return cols ? Math.ceil(traySlots() / cols) : 0;   // 寬拼圖佔兩格
}
export function renderTray() {
  let list = curPieces();
  if (trayRows() === 2) { const ord = trayOrder(); list = [...list].sort((a, b) => ord.indexOf(a.id) - ord.indexOf(b.id)); }
  els.tray.innerHTML = list.map(p => {
    const sel = state.selected === p.id, pal = colorOf(p.id);
    return `<div class="card${sel ? ' sel' : ''}${p.placed ? ' placed' : ''}${isWide(p.id) ? ' wide' : ''}" data-id="${p.id}">${miniSVG(PIECE[p.id].matrix, state.cell, pal)}</div>`;
  }).join('');
  syncTools();
}
