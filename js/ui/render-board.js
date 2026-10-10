/* 底板 —— 格子大小計算與底板 SVG（格線、拼圖、違規警示、標題列） */
import { PIECE } from '../core/config.js';
import { analyze } from '../game/analyze.js';
import { schedulePersist } from '../storage/boards.js';
import { updateUndo } from '../storage/history.js';
import { state, curLevel, curPieces, dims, absCells, colorOf, lvLong, clamp } from '../state/state.js';
import { els } from './dom.js';
import { cellRects } from './svg.js';
import { traySlots, trayUnit } from './render-tray.js';
import { syncTools } from './piece-tools.js';

// 觸控裝置（手機）捲動時網址列會收合 / 展開，window.innerHeight 與 resize 事件會跟著變動，
// 造成圖板高度與格子大小一直改變。因此觸控 + 窄視窗時，同一個視窗寬度只取第一次的高度，不再隨捲動更新。
let vhCache = { w: 0, h: 0 };
function viewportH() {
  const w = window.innerWidth;
  if (!window.matchMedia('(max-width:759px) and (pointer:coarse)').matches) return window.innerHeight;
  if (vhCache.w !== w) vhCache = { w, h: window.innerHeight };   // 寬度改變（轉向、分割視窗）才重新取值
  return vhCache.h;
}
// 依視窗大小決定每格像素，並設定 SVG 尺寸（viewBox 以「格」為單位，所以座標都不需換算）
export function fitBoard() {
  const D = dims();
  const availW = Math.max(240, els.wrap.clientWidth - 30);
  const availH = Math.max(300, viewportH() - 240);
  let c = clamp(Math.floor(Math.min(availW / D.cols, availH / D.rows)), 14, 48);

  // 拼圖盤與底板共用同一個格子大小（拖曳時大小才不會跳動）。
  // 先依底板算出 c，再確認拼圖盤放得下；放不下就一起縮小，避免「盤很大、拼圖很小」或反過來。
  const trayW = Math.max(200, els.tray.clientWidth - 24), gap = 8;
  const sideBySide = window.matchMedia('(min-width: 1180px)').matches; // 拼圖盤在右側時高度受視窗限制
  const maxH = sideBySide ? Math.max(420, viewportH() - 180) : Infinity;
  // 第 11 片（5 格寬）要佔兩個欄位，所以拼圖盤至少 2 欄；高度以 12 個欄位（11 片 + 1 個空位）估算
  // 拼圖卡片高度依本關拼圖的最大高度估算（六格骨牌最高 3 格；七格骨牌有 5 格高）
  const u = trayUnit();   // 每個位置的寬度（格）
  const cardRows = Math.max(3, ...curPieces().map(p => PIECE[p.id].matrix.length));
  const trayHeight = k => {
    const cols = Math.max(2, Math.floor((trayW + gap) / (u * k + 12 + gap)));
    return Math.ceil(traySlots() / cols) * (cardRows * k + 12 + gap) + 24;
  };
  while (c > 12 && (2 * (u * c + 12) + gap > trayW || trayHeight(c) > maxH)) c--;

  state.cell = c;
  els.tray.style.gridTemplateColumns = `repeat(auto-fill, minmax(${u * c + 12}px, 1fr))`;
  els.board.setAttribute('viewBox', `0 0 ${D.cols} ${D.rows}`);
  els.board.style.width = D.cols * c + 'px';
  els.board.style.height = D.rows * c + 'px';
}
export function renderBoard() {
  const L = curLevel(), D = dims();
  const an = analyze(curPieces());

  // 底層：格線
  let grid = '';
  for (let x = 1; x < D.cols; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${D.rows}"/>`;
  for (let y = 1; y < D.rows; y++) grid += `<line x1="0" y1="${y}" x2="${D.cols}" y2="${y}"/>`;
  els.gGrid.innerHTML = `<g stroke="var(--gridline)" stroke-width=".05">${grid}</g>`;

  // 拼圖層：每片拼圖一個 <g>，供拖曳事件代理
  els.gPieces.innerHTML = curPieces().filter(p => p.placed).map(p =>
    `<g class="pc${state.selected === p.id ? ' sel' : ''}" data-id="${p.id}">${cellRects(absCells(p), colorOf(p.id))}</g>`).join('');

  // 警示層（疊在拼圖上方、不攔截滑鼠）：
  //   重疊格 → 半透明紅色方塊；邊觸碰 → 紅色線段（落在兩格共用邊上）；角觸碰 → 紅點（落在共用頂點）
  const ov = [];
  an.overlaps.forEach(([x, y]) => ov.push(`<rect x="${x + .05}" y="${y + .05}" width=".9" height=".9" rx=".1" fill="#F0364B" fill-opacity=".8" stroke="#fff" stroke-width=".07"/>`));
  // 邊觸碰：先畫整批白色底線，再畫紅線，讓紅線交會處不會被白邊切斷
  an.edges.forEach(e => ov.push(`<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="#fff" stroke-width=".3" stroke-linecap="round"/>`));
  an.edges.forEach(e => ov.push(`<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="#F0364B" stroke-width=".16" stroke-linecap="round"/>`));
  an.corners.forEach(c => ov.push(`<circle cx="${c.x}" cy="${c.y}" r=".21" fill="#F0364B" stroke="#fff" stroke-width=".07"/>`));
  els.gOverlay.innerHTML = ov.join('');

  // 標題列狀態
  els.title.innerHTML = `<span class="lvn">${lvLong(L)}</span><span class="dims">${L.cols} × ${L.rows}</span>`;
  updateUndo();
  if (!(state.drag && state.drag.moved)) schedulePersist(); // 拖曳 / 吸附途中不存，放下後才存
  syncTools();
  return an;
}
