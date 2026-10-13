/* 沉浸模式 —— 圖板放大到佔滿整個頁面
 *   標題列：關卡名稱在左上角、「關閉沉浸模式」按鈕（與開啟按鈕同一顆）在右上角；左側維持工具列；
 *   右下角圓點（或按空格鍵）展開 / 收起小型拼圖盤（js/ui/fan.js；同拼圖盤、沒有頂欄），直接從裡面拖曳拼圖放進圖板。
 *   樣式見 css/immersive.css；圖板大小的計算見 render-board.js 的 fitBoard。 */
import { t } from '../i18n/i18n.js';
import { state } from '../state/state.js';
import { $ } from './dom.js';
import { fitBoard, renderBoard } from './render-board.js';
import { renderTray } from './render-tray.js';
import { startDrag } from './interaction/drag.js';
import { isFanOpen, setFanOpen } from './fan.js';

const root = document.documentElement, btn = $('btnImmersive');

// 按鈕在「開啟 / 關閉」兩種狀態的圖示（CSS 依 html.immersive 切換）、提示文字與 aria 狀態
function syncButton() {
  const key = state.immersive ? 'tip.immersiveOff' : 'tip.immersive';
  btn.dataset.i18nTitle = key;   // 之後切換語言時 applyI18n 會套用正確的文字
  const v = t(key); btn.title = v; btn.setAttribute('aria-label', v);
  btn.setAttribute('aria-pressed', String(state.immersive));
}
// 皇冠挑戰的「拼圖組合」按鈕平時在拼圖盤標題列；沉浸模式沒有拼圖盤標題列，改放到圖板標題列、「關卡資訊」按鈕左側
const grpBtn = $('btnGroup'), helpBtn = $('btnHelp'), infoBtn = $('btnSpecial');
function placeGroupBtn() {
  if (state.immersive) infoBtn.parentNode.insertBefore(grpBtn, infoBtn);
  else helpBtn.parentNode.insertBefore(grpBtn, helpBtn);
}

// 直向視窗不提供沉浸模式（按鈕在 css/immersive.css 以 orientation:portrait 隱藏，這裡再擋一次，避免其他入口誤開）：
// 沉浸模式中從橫向轉成直向，會自動離開沉浸模式（拖曳中則等放開手指後再離開，才不會中斷拖曳）
const portraitMQ = window.matchMedia('(orientation:portrait)');
function leaveIfPortrait() {
  if (!state.immersive || !portraitMQ.matches) return;
  if (state.drag) {
    const again = () => { window.removeEventListener('pointerup', again); window.removeEventListener('pointercancel', again); setTimeout(leaveIfPortrait, 0); };
    window.addEventListener('pointerup', again); window.addEventListener('pointercancel', again);
    return;
  }
  exitImmersive();
}
portraitMQ.addEventListener('change', leaveIfPortrait);

// 切換後重新計算圖板大小並重畫
function relayout() { fitBoard(); renderBoard(); renderTray(); }

export function enterImmersive() {
  if (state.immersive || state.drag || portraitMQ.matches) return;
  state.immersive = true;
  root.classList.add('immersive');
  setFanOpen(false); syncButton(); placeGroupBtn(); relayout();
}
export function exitImmersive() {
  if (!state.immersive || state.drag) return;
  setFanOpen(false);
  state.immersive = false;
  root.classList.remove('immersive');
  syncButton(); placeGroupBtn(); relayout();
}
// 空格鍵 / 圓點：換出或收起小型拼圖盤（只在沉浸模式有效；拖曳中不處理）
export function toggleFan() {
  if (!state.immersive || state.drag) return;
  setFanOpen(!isFanOpen());
}
export { isFanOpen, setFanOpen };

btn.addEventListener('click', () => { if (state.immersive) exitImmersive(); else enterImmersive(); });
$('fanDot').addEventListener('click', toggleFan);

// 從小型拼圖盤拿起拼圖：與拼圖盤的卡片相同（點一下 = 選取；拖動後小拼圖盤自動收起，放進圖板）
$('fan').addEventListener('pointerdown', e => {
  const c = e.target.closest('.card');
  if (c) startDrag(e, c.dataset.id, true);
});
// 小型拼圖盤展開時，點它與圓點以外的地方就收起（不攔截事件：點到圖板上的拼圖仍可直接拖曳）
document.addEventListener('pointerdown', e => {
  if (!isFanOpen() || (e.target.closest && e.target.closest('#fan, #fanDot'))) return;
  setFanOpen(false);
}, true);
