/* 底板 —— 格子大小計算與底板 SVG（格線、拼圖、違規警示、標題列） */
import { PIECE } from '../core/config.js';
import { t } from '../i18n/i18n.js';
import { layoutTools, toolsReserveBottom } from './piece-tools.js';
import { analyze } from '../game/analyze.js';
import { schedulePersist } from '../storage/boards.js';
import { updateUndo } from '../storage/history.js';
import { state, curLevel, curPieces, curGroup, dims, absCells, colorOf, lvLong, clamp } from '../state/state.js';
import { els } from './dom.js';
import { cellRects } from './svg.js';
import { trayUnit, trayPerRow, renderTray } from './render-tray.js';
import { syncTools } from './piece-tools.js';
import { isSmall, sideBySide as isSideBySide } from './viewport.js';

// 觸控裝置（手機）捲動時網址列會收合 / 展開，window.innerHeight 與 resize 事件會跟著變動，
// 造成圖板高度與格子大小一直改變。因此觸控 + 小視窗（上下放置）時，同一個視窗寬度只取第一次的高度，不再隨捲動更新。
let vhCache = { w: 0, h: 0 };
function viewportH() {
  const w = window.innerWidth;
  if (!(isSmall() && window.matchMedia('(pointer:coarse)').matches)) return window.innerHeight;
  if (vhCache.w !== w) vhCache = { w, h: window.innerHeight };   // 寬度改變（轉向、分割視窗）才重新取值
  return vhCache.h;
}
// 依視窗大小決定每格像素，並設定 SVG 尺寸（viewBox 以「格」為單位，所以座標都不需換算）
export function fitBoard() {
  const D = dims(), imm = state.immersive;
  // 橫向視窗的工具列貼在圖板區域左邊框：圖板維持置中，左右各讓出工具列的寬度（+間隙），才不會被遮到
  const toolsW = layoutTools();
  // 沉浸模式：左右各讓出工具列的位置（圖板維持左右置中），上下邊緣僅留小邊距，圖板盡量放大
  // 左右對稱地讓出工具列的寬度，圖板才會在整個頁面左右置中
  // 工具列因靈動島 / 挖孔遮擋而橫放在左下時，改成在圖板下方讓出工具列的高度（toolsW = 0，左右不讓）
  const reserveB = toolsReserveBottom();
  els.wrap.style.paddingLeft = els.wrap.style.paddingRight = imm ? (reserveB ? '' : toolsW + 14 + 'px') : '';
  els.wrap.style.paddingBottom = reserveB ? reserveB + 'px' : '';
  const wCS0 = getComputedStyle(els.wrap);
  const availW = imm
    ? Math.max(120, els.wrap.clientWidth - parseFloat(wCS0.paddingLeft) - parseFloat(wCS0.paddingRight))
    : Math.max(240, Math.min(els.wrap.clientWidth - 30, els.wrap.clientWidth - 2 * (toolsW + 8) - 4));
  // 圖板與拼圖盤並排（中、大視窗，寬 >= 641px）時：圖板區域高度 = 拼圖盤區域高度（見 layout.css 的 contain:size），圖板高度以此為上限
  // 並排條件（要與 css/layout.css 一致）：小視窗（<= 640px）上下放置，其餘左右放置
  const sideBySide = isSideBySide();

  // 拼圖盤的拼圖大小與底板無關（換關卡、底板縮放都不會變），只看拼圖盤寬度：以「至少放得下 3 片（七格骨牌關卡 2 片）」決定大小；
  // 實際每行放幾片不設限（拼圖盤夠寬就會多放）。
  // 拖曳出來的殘影才用底板的格子大小（state.cell），所以放到底板上大小會對得上。
  const trayCS = getComputedStyle(els.tray);
  const trayW = Math.max(200, els.tray.clientWidth - parseFloat(trayCS.paddingLeft) - parseFloat(trayCS.paddingRight)), gap = 8;
  const perRow = trayPerRow(), u = trayUnit();   // u = 每個位置的寬度（格）
  const colW = (trayW - gap * (perRow - 1)) / perRow;   // 每個位置的卡片寬（px）；卡片左右各有 6px 內距 + 2px 邊框
  // 拼圖盤高度隨拼圖片數而定，不再因視窗高度限制而縮小拼圖：拼圖大小只由寬度決定
  const tc = clamp(Math.floor((colW - 16) / u), 12, sideBySide ? 28 : 36);
  state.trayCell = tc;

  let availH;
  if (imm) {
    // 沉浸模式：圖板區域 = 整個視窗扣掉標題列，直接量目前實際高度
    availH = Math.max(120, els.wrap.clientHeight - parseFloat(wCS0.paddingTop) - parseFloat(wCS0.paddingBottom));
  } else if (sideBySide) {
    // 先用新的拼圖大小重畫拼圖盤，才量得到拼圖盤區域「實際」高度，再扣掉圖板區塊的上下內距
    renderTray();
    const wCS = getComputedStyle(els.wrap);
    availH = Math.max(120, els.wrap.clientHeight - parseFloat(wCS.paddingTop) - parseFloat(wCS.paddingBottom));
  } else availH = Math.max(300, viewportH() - 240);
  // #board 為 content-box，外框 2px × 2 另外加在格子區之外：兩個方向都先扣掉 4px，否則會多出 2px 而冒出捲軸（灰色條）
  const BORDER = 4;
  const c = clamp(Math.floor(Math.min((availW - BORDER) / D.cols, (availH - BORDER) / D.rows)), 8, imm ? 160 : 48);   // 下限 8：Lv7（24 格寬）在窄手機上若硬撐到 14px 會超出寬度而冒出捲軸
  state.cell = c;

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
  const gk = curGroup(L);   // 有拼圖組合的關卡：標題列顯示目前使用的組合（如「A組」）
  els.title.innerHTML = `<span class="lvn">${lvLong(L)}</span>${gk ? `<span class="lvg">${t('grp.tag', gk)}</span>` : ''}<span class="dims">${L.cols} × ${L.rows}</span>`;
  updateUndo();
  if (!(state.drag && state.drag.moved)) schedulePersist(); // 拖曳 / 吸附途中不存，放下後才存
  syncTools();
  return an;
}
