/* 視窗大小改變的處理 */
import { applyMode, state } from '../state/state.js';
import { els } from './dom.js';
import { refresh } from './render.js';
import { fitBoard } from './render-board.js';
import { renderTray } from './render-tray.js';
import { syncTools } from './piece-tools.js';

// 視窗大小改變：跨過寬窄分界時，整個盤面旋轉 90° 並重畫；否則只重新計算格子大小
// 觸控裝置窄視窗：捲動造成的「只有高度變動」resize（網址列收合）一律忽略，避免圖板大小亂跳
let lastW = window.innerWidth;
window.addEventListener('resize', () => {
  if (state.drag && state.drag.moved) return;
  const w = window.innerWidth, widthSame = w === lastW; lastW = w;
  if (widthSame && !state.immersive && window.matchMedia('(max-width:759px) and (pointer:coarse)').matches) return;
  if (applyMode()) refresh();
  else { fitBoard(); renderTray(); syncTools(); }
});
window.addEventListener('scroll', syncTools, { passive:true });
els.wrap.addEventListener('scroll', syncTools, { passive:true });
