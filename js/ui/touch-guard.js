/* 觸控守門員 —— 遊玩時的觸控規則（要在其他會綁定指標事件的模組之前載入，見 main.js 的匯入順序）
 *   1. 最多同時感應兩根手指：第三根（含以後）手指的觸控完全無視（一根手指拖拼圖、另一根點工具列，兩根就夠用）
 *   2. 滑鼠優先：滑鼠有任何操作（移動 / 按下 / 放開 / 滾輪）後，2 秒內新的觸控一律無視；滑鼠按著不放時一直無視
 *      （已經在進行中的觸控不受影響，讓它自然結束，避免拖曳卡在一半）
 *   3. 一般模式：可雙指縮放頁面（meta viewport 放行），但沒有雙擊縮放（css/base.css 的 touch-action:manipulation）
 *      沉浸模式（html.immersive）：任何縮放一律禁止 —— 雙指縮放、Safari 手勢縮放、Ctrl + 滾輪 / 觸控板捏合、Ctrl + (+ / - / 0)；
 *      縮放被擋不掉時（如瀏覽器選單縮放）的偵測與還原見 js/ui/immersive.js
 *   4. 只限制觸控操作：不要長按跳出選單 / 放大鏡 / 選取文字 / 拖曳圖片；滑鼠操作時仍可選取、複製文字（html[data-input] 記錄最近一次的操作方式，樣式見 css/base.css）
 *      輸入框、文字欄位、管理員的回報內容在觸控時也可選取
 *   被無視的觸控：pointer 事件在 window 的 capture 階段就攔下（stopImmediatePropagation），
 *   touchstart 另外 preventDefault（連同捲動、點擊、模擬的滑鼠事件一起取消）。 */
const MAX_TOUCH = 2, MOUSE_HOLD_MS = 2000;
const active = new Set();    // 目前接受中的觸控 pointerId
const ignored = new Set();   // 被無視的觸控 pointerId（直到手指離開）
let mouseAt = -Infinity, mouseDown = false, lastType = 'mouse';
const mouseBusy = () => mouseDown || performance.now() - mouseAt < MOUSE_HOLD_MS;
const block = e => { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); };
const root = document.documentElement;
const immersive = () => root.classList.contains('immersive');
const selectable = t => !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], .admdetail'));
const OPT = { capture: true, passive: false };

const setInput = type => { lastType = type; root.dataset.input = type === 'touch' ? 'touch' : 'mouse'; };
setInput(window.matchMedia('(pointer:coarse)').matches ? 'touch' : 'mouse');   // 第一次操作前：依裝置主要輸入方式
function onPointer(e) {
  if (e.pointerType && e.pointerType !== lastType && (e.pointerType === 'touch' || e.pointerType === 'mouse')) setInput(e.pointerType);
  if (e.pointerType === 'mouse') {
    mouseAt = performance.now();
    if (e.type === 'pointerdown') mouseDown = true;
    else if (e.type === 'pointerup' || e.type === 'pointercancel' || (e.type === 'pointermove' && e.buttons === 0)) mouseDown = false;   // 按鈕在視窗外放開時也能還原
    return;
  }
  if (e.pointerType !== 'touch') return;
  const id = e.pointerId, end = e.type === 'pointerup' || e.type === 'pointercancel';
  if (e.type === 'pointerdown') (mouseBusy() || active.size >= MAX_TOUCH ? ignored : active).add(id);
  if (ignored.has(id)) { block(e); if (end) ignored.delete(id); return; }
  if (end) active.delete(id);
}
['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, onPointer, OPT));
window.addEventListener('wheel', () => { mouseAt = performance.now(); }, { capture: true, passive: true });   // 滾輪也算滑鼠操作

// 觸控事件：第三根手指以後、滑鼠操作中的新觸控，連預設行為（捲動 / 點擊 / 縮放）一起取消
window.addEventListener('touchstart', e => {
  if (e.touches.length > MAX_TOUCH || mouseBusy()) block(e);
}, OPT);
const clear = () => { active.clear(); ignored.clear(); mouseDown = false; };
window.addEventListener('touchend', e => { if (!e.touches.length) { active.clear(); ignored.clear(); } }, true);   // 全部手指離開：保險清除
window.addEventListener('blur', clear);
document.addEventListener('visibilitychange', clear);

// 觸控長按 / 選取：不跳出系統選單、放大鏡、選取框，不拖曳圖片 / 連結（滑鼠操作與可選取的欄位不受影響）
window.addEventListener('contextmenu', e => { if (lastType === 'touch' && !selectable(e.target)) e.preventDefault(); }, true);
document.addEventListener('dragstart', e => { if (lastType === 'touch' && !selectable(e.target)) e.preventDefault(); }, true);
document.addEventListener('selectstart', e => { if (lastType === 'touch' && !selectable(e.target)) e.preventDefault(); }, true);

// 沉浸模式：禁止任何形式的縮放
const noZoom = e => { if (immersive() && e.cancelable) e.preventDefault(); };
window.addEventListener('touchmove', e => { if (e.touches.length > 1) noZoom(e); }, OPT);   // 雙指縮放
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => window.addEventListener(t, noZoom, OPT));   // iOS Safari 手勢縮放
window.addEventListener('wheel', e => { if (e.ctrlKey) noZoom(e); }, OPT);   // Ctrl + 滾輪、觸控板捏合
window.addEventListener('keydown', e => {   // Ctrl / ⌘ + (+ - 0)
  if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) noZoom(e);
}, OPT);
