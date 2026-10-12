/* 拖曳與點擊吸附 —— 從拼圖盤或底板拿起拼圖、預覽吸附位置、放下 */
import { Sfx } from '../../audio/sfx.js';
import { evaluate } from '../../game/solve.js';
import { pushHistory } from '../../storage/history.js';
import { state, curPieces, dims, getP, shapeOf, clamp, clonePieces, colorOf, boardKey } from '../../state/state.js';
import { els } from '../dom.js';
import { miniSVG, cellRects } from '../svg.js';
import { cellsOf } from '../../core/matrix.js';
import { renderBoard } from '../render-board.js';
import { renderTray } from '../render-tray.js';

// 滑鼠位置 -> 底板格座標（可為小數）
function pointerToGrid(cx, cy) {
  const r = els.board.getBoundingClientRect(), D = dims();
  // 外框 2px 邊框不屬於格子區：扣掉邊框後再換算（SVG 為 content-box，內容區正好 = 格數 × 每格像素）
  const bx = els.board.clientLeft, by = els.board.clientTop, w = els.board.clientWidth, h = els.board.clientHeight;
  return { u: (cx - r.left - bx) / w * D.cols, v: (cy - r.top - by) / h * D.rows };
}
// 依指標位置算出吸附結果：以拼圖「中心」對準指標，四捨五入到整數格，再夾進底板內。
// 指標不在底板上則回傳 null（代表放回拼圖盤）。
function snapFromPointer(cx, cy, p) {
  const D = dims(), { u, v } = pointerToGrid(cx, cy);
  if (u < 0 || v < 0 || u > D.cols || v > D.rows) return null;
  const m = shapeOf(p), w = m[0].length, h = m.length;
  return { x: clamp(Math.round(u - w / 2), 0, D.cols - w), y: clamp(Math.round(v - h / 2), 0, D.rows - h) };
}

// ---- 拖曳 ----
function startDrag(e, id, fromTray) {
  if (e.button > 0) return;
  e.preventDefault();
  state.selected = id; state.chain = null;
  state.drag = { id, pid:e.pointerId, fromTray:!!fromTray, sx:e.clientX, sy:e.clientY, cx:e.clientX, cy:e.clientY, moved:false, ghost:null, before:clonePieces(curPieces()) };
  renderBoard(); renderTray();
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}
export function updateGhost() {
  const d = state.drag, p = getP(d.id);
  d.ghost.innerHTML = miniSVG(shapeOf(p), state.cell, colorOf(p.id));
  placeGhost();
}
function placeGhost() {
  const d = state.drag, m = shapeOf(getP(d.id));
  d.ghost.style.left = d.cx - m[0].length * state.cell / 2 + 'px';
  d.ghost.style.top = d.cy - m.length * state.cell / 2 + 'px';
}
// 底板上的半透明吸附預覽
export function movePreview() {
  const d = state.drag, p = getP(d.id), snap = snapFromPointer(d.cx, d.cy, p);
  if (!snap) { els.gPreview.innerHTML = ''; return; }
  const cells = cellsOf(shapeOf(p)).map(([x, y]) => [snap.x + x, snap.y + y]);
  els.gPreview.innerHTML = `<g opacity=".55">${cellRects(cells, colorOf(p.id))}</g>`;
}
function onMove(e) {
  const d = state.drag; if (!d) return;
  if (d.pid != null && e.pointerId !== d.pid) return;   // 多點觸控：忽略其他手指
  d.cx = e.clientX; d.cy = e.clientY;
  if (!d.moved) {
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return; // 小位移視為點擊
    d.moved = true;
    getP(d.id).placed = false; // 拖起時先離開盤面（放開後再決定去向）
    d.ghost = document.createElement('div');
    d.ghost.className = 'ghost';
    document.body.appendChild(d.ghost);
    updateGhost();
    renderBoard(); renderTray();
  }
  placeGhost(); movePreview();
}
function onUp(e) {
  if (state.drag && state.drag.pid != null && e.pointerId !== state.drag.pid) return;   // 其他手指離開不結束拖曳
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  const d = state.drag; state.drag = null;
  if (!d) return;
  if (!d.moved) {
    // 單純點擊：點方框內的拼圖＝選取它（可用工具列調整）；點拼圖盤的卡片＝不動作
    if (d.fromTray || e.type === 'pointercancel') state.selected = null;
    renderBoard(); renderTray();
    return;
  }
  finishPlace(d, e.clientX, e.clientY);
}
// 放下拖曳 / 吸附中的拼圖：在方框內就對齊格線放置，否則回拼圖盤並恢復預設方向
function finishPlace(d, x, y) {
  d.ghost.remove();
  els.gPreview.innerHTML = '';
  const p = getP(d.id), snap = snapFromPointer(x, y, p);
  if (snap) { p.placed = true; p.x = snap.x; p.y = snap.y; Sfx.place(); } // 吸附對齊格線；允許與他片接觸，不強制阻擋
  else { p.placed = false; p.rot = 0; p.flip = false; Sfx.back(); }
  state.selected = null; // 放下後不顯示工具列，要再調整請點一下該拼圖
  if (d.before && JSON.stringify(d.before) !== JSON.stringify(curPieces())) pushHistory(d.before);
  renderBoard(); renderTray();
  evaluate();
}
// 取消吸附（Esc / 右鍵）：恢復成拿起之前的樣子（從方框拿起的拼圖會回到原位）
export function cancelHold() {
  const d = state.drag; if (!d || !d.hold) return;
  d.ghost.remove(); els.gPreview.innerHTML = '';
  if (d.before) state.boards[boardKey()] = d.before;
  state.drag = null; state.selected = null; state.chain = null;
  renderBoard(); renderTray();
}
// 收回：把吸附中的拼圖放回拼圖盤（若是從方框拿起的，可用「返回上一步」還原）
export function returnHeld() {
  const d = state.drag; if (!d || !d.hold) return;
  d.ghost.remove(); els.gPreview.innerHTML = '';
  const p = getP(d.id); p.placed = false; p.rot = 0; p.flip = false;
  state.drag = null; state.selected = null; state.chain = null;
  if (d.before && JSON.stringify(d.before) !== JSON.stringify(curPieces())) pushHistory(d.before);
  Sfx.back();
  renderBoard(); renderTray(); evaluate();
}
window.addEventListener('pointermove', e => {
  const d = state.drag; if (!d || !d.hold) return;
  if (d.touching != null && e.pointerId !== d.touching) return;   // 多點觸控：只跟著按住拼圖的那根手指
  d.cx = e.clientX; d.cy = e.clientY; placeGhost(); movePreview();
});
// 吸附中按左鍵 = 放下（用 capture 先攔截，避免同時觸發別的拖曳 / 點選）
window.addEventListener('pointerdown', e => {
  const d = state.drag; if (!d || !d.hold || e.button > 0) return;
  if (e.target.closest && e.target.closest('#pieceTools')) return;   // 點工具列按鈕：不當作放下
  e.preventDefault(); e.stopPropagation();
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    // 觸控：按下時只移動預覽（可以拖曳微調位置），手指放開才放下
    d.touching = e.pointerId; d.cx = e.clientX; d.cy = e.clientY; placeGhost(); movePreview();
    return;
  }
  state.drag = null; finishPlace(d, e.clientX, e.clientY);
}, true);
window.addEventListener('pointerup', e => {
  const d = state.drag; if (!d || !d.hold || d.touching == null || e.pointerId !== d.touching) return;
  state.drag = null; finishPlace(d, e.clientX, e.clientY);
}, true);
window.addEventListener('pointercancel', e => {
  const d = state.drag; if (d && d.hold && d.touching === e.pointerId) d.touching = null;
});
// 捲動後，預覽位置要跟著重算
window.addEventListener('scroll', () => { const d = state.drag; if (d && d.hold) movePreview(); }, { passive:true });
window.addEventListener('contextmenu', e => {
  const d = state.drag;
  if (d && d.hold) {
    e.preventDefault();
    if (e.pointerType === 'touch' || d.touching != null) return;   // 觸控長按會跳出選單，不要因此取消
    cancelHold(); return;
  }
  if (e.target.closest && e.target.closest('.card, .pc')) e.preventDefault();   // 長按拼圖不跳出系統選單
});

// ---- 事件綁定：拼圖盤 / 底板 ----
els.tray.addEventListener('pointerdown', e => {
  const c = e.target.closest('.card'); if (c) startDrag(e, c.dataset.id, true);
});
els.gPieces.addEventListener('pointerdown', e => {
  const g = e.target.closest('.pc'); if (g) startDrag(e, g.dataset.id);
});
// 點底板空白處取消選取
els.board.addEventListener('pointerdown', e => {
  if (e.target.closest('.pc') || !state.selected) return;
  state.selected = null; renderBoard(); renderTray();
});
