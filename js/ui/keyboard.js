/* 鍵盤：A 左轉、D 右轉、S 鏡像、X 收回、Z 返回上一步、Delete 重置版圖 */
import { state } from '../state/state.js';
import { transformSelected, returnSelected } from './interaction/transform.js';
import { cancelHold } from './interaction/drag.js';
import { undo } from './interaction/undo.js';
import { askResetBoard } from './modals/board-reset.js';
import { solModal, stepSolution } from './modals/solution.js';

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.drag && state.drag.hold) { cancelHold(); return; }
  if (e.key === 'Escape') { document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open')); return; }
  if (solModal.classList.contains('open') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {   // 解答檢視：左右鍵切換
    stepSolution(e.key === 'ArrowLeft' ? -1 : 1); e.preventDefault(); return;
  }
  { // 說明視窗開著時：按下對應快捷鍵，畫面上的按鍵跟著亮起
    const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    document.querySelectorAll('.modal.open .key').forEach(el => { if (el.dataset.k === kk) el.classList.add('lit'); });
  }
  if (document.querySelector('.modal.open')) return; // 視窗開著時不處理拼圖快捷鍵
  if (/^(TEXTAREA|INPUT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && !e.altKey && k === 'z') { undo(); e.preventDefault(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'a') { transformSelected('ccw'); e.preventDefault(); }
  else if (k === 'd') { transformSelected('cw'); e.preventDefault(); }
  else if (k === 's') { transformSelected('flip'); e.preventDefault(); }
  else if (k === 'x') { returnSelected(); e.preventDefault(); }
  else if (k === 'z') { undo(); e.preventDefault(); }
  else if (k === 'delete') { askResetBoard(); e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  document.querySelectorAll('.key.lit').forEach(el => { if (el.dataset.k === kk) el.classList.remove('lit'); });
});
window.addEventListener('blur', () => document.querySelectorAll('.key.lit').forEach(el => el.classList.remove('lit')));
// 滑鼠 / 觸控按住說明裡的按鍵時也會亮起
document.addEventListener('pointerdown', e => { const k = e.target.closest && e.target.closest('.key'); if (k) k.classList.add('lit'); });
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => document.querySelectorAll('.key.lit').forEach(el => el.classList.remove('lit'))));
