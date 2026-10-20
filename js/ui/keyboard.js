/* 鍵盤：A 左轉、D 右轉、S 鏡像、X 收回、Z 返回上一步、空格鍵 換出 / 收起拼圖盤（沉浸模式）、Esc 收起拼圖盤 / 離開沉浸模式 */
import { state } from '../state/state.js';
import { transformSelected, returnSelected } from './interaction/transform.js';
import { cancelHold } from './interaction/drag.js';
import { undo } from './interaction/undo.js';
import { toggleFan, isFanOpen, setFanOpen, exitImmersive } from './immersive.js';
import { pageDir } from './dom.js';
import { solModal, stepSolution } from './modals/solution.js';

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.drag && state.drag.hold) { cancelHold(); return; }
  if (e.key === 'Escape' && state.immersive && !document.querySelector('.modal.open')) {   // 沉浸模式：先收起拼圖盤，再按一次離開沉浸模式
    if (isFanOpen()) setFanOpen(false); else exitImmersive();
    return;
  }
  if (e.key === 'Escape') { document.querySelectorAll('.modal.open:not([data-lock])').forEach(m => m.classList.remove('open')); return; }
  if (solModal.classList.contains('open') && pageDir(e)) {   // 解答檢視：← → 或 A D 切換
    stepSolution(pageDir(e)); e.preventDefault(); return;
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
  if (e.key === ' ' && state.immersive) { if (!e.repeat) toggleFan(); e.preventDefault(); return; }   // 空格：換出 / 收起拼圖盤（preventDefault：不捲動頁面、不觸發有焦點的按鈕）
  if (k === 'a') { transformSelected('ccw'); e.preventDefault(); }
  else if (k === 'd') { transformSelected('cw'); e.preventDefault(); }
  else if (k === 's') { transformSelected('flip'); e.preventDefault(); }
  else if (k === 'x') { returnSelected(); e.preventDefault(); }
  else if (k === 'z') { undo(); e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  if (e.key === ' ' && state.immersive) e.preventDefault();   // Firefox 等瀏覽器在 keyup 才對有焦點的按鈕觸發 click
  const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  document.querySelectorAll('.key.lit').forEach(el => { if (el.dataset.k === kk) el.classList.remove('lit'); });
});
window.addEventListener('blur', () => document.querySelectorAll('.key.lit').forEach(el => el.classList.remove('lit')));
// 滑鼠 / 觸控按住說明裡的按鍵時也會亮起
document.addEventListener('pointerdown', e => { const k = e.target.closest && e.target.closest('.key'); if (k) k.classList.add('lit'); });
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => document.querySelectorAll('.key.lit').forEach(el => el.classList.remove('lit'))));
