/* 拼圖盤 */
import { PIECE } from '../core/config.js';
import { state, curPieces, curLevel, colorOf } from '../state/state.js';
import { els } from './dom.js';
import { miniSVG } from './svg.js';
import { syncTools } from './piece-tools.js';

// 決定拼圖盤拼圖大小時，至少要放得下幾片：六格骨牌 3 片；其他類別（七格骨牌，如危險貨物2）2 片（版面不限制每行片數）
export const trayPerRow = (L = curLevel()) => (L.family || 'hexo') === 'hexo' ? 3 : 2;
// 拼圖盤每個位置的寬度（格）：六格骨牌固定 4 格；其他類別取本關拼圖的最大寬度
export const trayUnit = (L = curLevel()) => (L.family || 'hexo') === 'hexo' ? 4 : Math.max(4, ...[...L.ids].map(id => PIECE[id].matrix[0].length));
// 寬度超過一個位置的拼圖（六格骨牌的 1、2、3、4、7、8 號）在拼圖盤佔兩個位置（版面見 tray.css 的 .wide）
const isWide = id => PIECE[id].matrix[0].length > trayUnit();
export const traySlots = () => curPieces().reduce((n, p) => n + (isWide(p.id) ? 2 : 1), 0);
export function renderTray() {
  els.tray.innerHTML = curPieces().map(p => {
    const sel = state.selected === p.id, pal = colorOf(p.id);
    return `<div class="card${sel ? ' sel' : ''}${p.placed ? ' placed' : ''}${isWide(p.id) ? ' wide' : ''}" data-id="${p.id}">${miniSVG(PIECE[p.id].matrix, state.trayCell, pal)}</div>`;
  }).join('');
  syncTools();
}
