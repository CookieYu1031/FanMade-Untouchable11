/* 視窗大小改變的處理 */
import { applyMode, state } from '../state/state.js';
import { els } from './dom.js';
import { refresh } from './render.js';
import { fitBoard, renderBoard } from './render-board.js';
import { renderTray } from './render-tray.js';
import { syncTools } from './piece-tools.js';
import { isSmall } from './viewport.js';

// 視窗大小改變：跨過寬窄分界時，整個盤面旋轉 90° 並重畫；否則只重新計算格子大小
// 觸控裝置小視窗（上下放置）：捲動造成的「只有高度變動」resize（網址列收合）一律忽略，避免圖板大小亂跳
let lastW = window.innerWidth;
// 重新偵測版面並重畫（不做任何「高度忽略」的判斷）：沉浸模式引導玩家轉動裝置後使用（見 js/ui/immersive.js）
export function reflow() {
  lastW = window.innerWidth;
  if (applyMode()) refresh();
  else { fitBoard(); renderBoard(); renderTray(); syncTools(); }
}
window.addEventListener('resize', () => {
  if (state.drag && state.drag.moved) return;
  const w = window.innerWidth, widthSame = w === lastW; lastW = w;
  if (widthSame && !state.immersive && isSmall() && window.matchMedia('(pointer:coarse)').matches) return;
  if (applyMode()) refresh();
  else { fitBoard(); renderTray(); syncTools(); }
});
window.addEventListener('scroll', syncTools, { passive:true });
els.wrap.addEventListener('scroll', syncTools, { passive:true });
