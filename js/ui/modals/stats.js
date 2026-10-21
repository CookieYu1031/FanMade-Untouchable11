/* 各關卡收錄進度表（正解；開啟「近似解」開關時，同一關卡再多一列近似解）
 *   分頁：第 1 頁 = Lv1~8；第 2 頁 = 獨立關卡（大師挑戰、危險貨物…，需開啟額外關卡）
 *   小視窗（<= 640px，手機直向）：「更多資訊」開啟時，收錄進度只顯示 % 數（不放進度條 / 圓點 / 星星），整張表不需要左右滑動；
 *     視窗高度放不下 Lv1~8 整頁時，自動改成 Lv1~4 / Lv5~8 / 獨立關卡三頁
 *   換頁：視窗下方的左右箭頭（或鍵盤左右鍵），做法與解答檢視相同；沒有上（下）一頁時箭頭不可點按 */
import { t } from '../../i18n/i18n.js';
import { LEVEL_ORDER, LV_COLORS, LV_INK } from '../../core/config.js';
import { loadBook } from '../../storage/book.js';
import { settings, saveSettings } from '../../state/settings.js';
import { state, lvTag, nearTotal, solvedGroups } from '../../state/state.js';
import { $, pageDir } from '../dom.js';
import { EYE, EYE_OFF, starsHTML } from '../render-book.js';
import { isSmall } from '../viewport.js';

function fmtPct(n, total) {   // 無條件捨去到小數點後 2 位；不足 0.01% 顯示 0.00%
  const v = Math.min(100, n / total * 100);
  return (Math.floor(v * 100 + 1e-9) / 100).toFixed(2) + '%';
}
// 分頁內容：第 1 頁 Lv1~8、第 2 頁獨立關卡（未開啟額外關卡時只有第 1 頁）；split = 把 Lv1~8 再拆成 Lv1~4 / Lv5~8（小視窗高度不足時）
const pages = split => {
  const main = LEVEL_ORDER.filter(L => !L.extra), ext = LEVEL_ORDER.filter(L => L.extra);   // 依 levels.json 的 order 排列
  const head = split ? [main.slice(0, 4), main.slice(4)] : [main];
  return settings.extra && ext.length ? [...head, ext] : head;
};
const SOLID = 160;   // 表格區高度上限 = 視窗高度 - SOLID（與 index.html 的 max-height:calc(100vh - 160px) 相同）

// 正解那一列的三格：解答組數、收錄組數、收錄進度
function exactCells(L, book, compact) {
  const list = book.levels[L.lv] || [];
  const solved = L.groups ? solvedGroups(L, list) : null;   // 摘星挑戰：收錄組數 = 已解出幾顆星（幾種拼圖組合）
  const got = solved ? solved.size : list.length;
  const n = L.total == null ? got : Math.min(got, L.total);
  const prog = L.total == null ? '<span class="pct">—</span>'     // 總組數未知：只顯示收錄數
    : compact ? `<span class="pct">${fmtPct(n, L.total)}</span>`   // 小視窗：只顯示 % 數
    : solved ? starsHTML(L, solved)                      // 每種拼圖組合一顆星
    : L.lv <= 6
    ? `<div class="pbar"><i style="width:${n / L.total * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div><span class="pct">${fmtPct(n, L.total)}</span>`
    : `<div class="dots">${Array.from({ length: L.total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  return `<td>${L.total == null ? '—' : L.total.toLocaleString()}</td><td>${n.toLocaleString()}</td><td class="c-prog"><div class="pg">${prog}</div></td>`;
}
// 近似解那一列的三格（文字為灰字，樣式見 .nr）
function nearCells(L, book, compact) {
  const tot = nearTotal(L), got = ((book.near || {})[L.lv] || []).length;
  if (tot == null) // 實際組數未知：只顯示收錄數，沒有進度條與 %
    return `<td>—</td><td>${got.toLocaleString()}</td><td class="c-prog"><div class="pg"><span class="pct">—</span></div></td>`;
  const n = Math.min(got, tot);
  return `<td>${tot.toLocaleString()}</td><td>${n.toLocaleString()}</td>`
    + `<td class="c-prog"><div class="pg">${compact ? '' : `<div class="pbar"><i style="width:${n / tot * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div>`}<span class="pct">${fmtPct(n, tot)}</span></div></td>`;
}

// 某一頁的表格內容（表頭 + 各關卡列）
function tableHTML(page, near, book, all, compact) {
  const head = `<thead><tr><th>${t('stat.lv')}</th><th>${t(near ? 'stat.totalNear' : 'stat.total')}</th><th>${t('stat.got')}</th><th class="c-prog">${t('stat.progress')}</th></tr></thead>`;
  const tag = (L, span) => { const c = LV_COLORS[L.lv]; return `<td${span > 1 ? ` rowspan="${span}"` : ''}><span class="lvtag" style="background:${c};color:${LV_INK[L.lv]}">${lvTag(L)}</span></td>`; };
  const rows = all[page].map(L => {
    const st = `style="--c:${LV_COLORS[L.lv]}"`;
    if (!(near && L.near)) return `<tr ${st}>${tag(L, 1)}${exactCells(L, book, compact)}</tr>`;   // 沒有近似解的關卡維持一列
    return `<tr class="g1" ${st}>${tag(L, 2)}${exactCells(L, book, compact)}</tr><tr class="nr" ${st}>${nearCells(L, book, compact)}</tr>`;   // 關卡標籤佔兩列高度
  }).join('');
  return `${head}<tbody>${rows}</tbody>`;
}

export function renderStats() {
  const book = loadBook(), near = !!settings.near, compact = isSmall() && near;
  const tbl = $('statTable'), wrap = tbl.parentElement, limit = Math.max(0, window.innerHeight - SOLID);
  tbl.classList.toggle('more', near);   // 窄視窗：「收錄進度」欄預設隱藏，按下「顯示更多資訊」才出現（見 stats.css）
  tbl.classList.toggle('compact', compact);   // 小視窗 + 更多資訊：進度只顯示 % 數
  wrap.style.minHeight = '';
  // 小視窗：Lv1~8 整頁放不下（要上下捲動）時，自動拆成 Lv1~4 / Lv5~8 兩頁
  let all = pages(false);
  if (isSmall() && all[0].length > 4) { tbl.innerHTML = tableHTML(0, near, book, all, compact); if (tbl.offsetHeight > limit) all = pages(true); }
  state.statPage = Math.max(0, Math.min(all.length - 1, state.statPage || 0));   // 關閉額外關卡後頁數可能超出範圍
  // 換頁時視窗高度不變：先量出每一頁的高度，取最高的當作固定高度（關卡由上往下依序擺放，下方留白沒關係）
  let maxH = 0;
  all.forEach((_, i) => { tbl.innerHTML = tableHTML(i, near, book, all, compact); maxH = Math.max(maxH, tbl.offsetHeight); });
  tbl.innerHTML = tableHTML(state.statPage, near, book, all, compact);
  wrap.style.minHeight = Math.min(maxH, limit) + 'px';
  $('statTitle').textContent = t('stat.title');
  $('statPg').textContent = `${state.statPage + 1} / ${all.length}`;   // 頁數顯示在 ← → 兩個按鈕中間
  const nb = $('statNearBtn');   // 更多資訊（近似解列；窄視窗另含收錄進度欄）：睜眼 = 目前顯示，閉眼 = 目前隱藏（與解答冊的隱藏按鈕相同）
  nb.innerHTML = near ? EYE : EYE_OFF;
  nb.title = t(near ? 'stat.nearHide' : 'stat.nearShow'); nb.setAttribute('aria-label', nb.title);
  nb.setAttribute('aria-pressed', String(near));
  $('statPrev').disabled = state.statPage === 0;                 // 沒有上一頁：箭頭仍顯示但不可點按
  $('statNext').disabled = state.statPage >= all.length - 1;     // 沒有下一頁：同上
}
const statModal = $('statModal');
const turn = d => { state.statPage = (state.statPage || 0) + d; renderStats(); };
$('btnStats').addEventListener('click', () => { state.statPage = 0; statModal.classList.add('open'); renderStats(); });   // 先開視窗再繪製：才量得到表格高度
$('statNearBtn').addEventListener('click', () => { settings.near = !settings.near; saveSettings(); renderStats(); });   // 寫入設定（登入時會同步到雲端）
window.addEventListener('resize', () => { if (statModal.classList.contains('open')) renderStats(); });   // 視窗大小改變：欄位顯示不同，高度重算
$('statPrev').addEventListener('click', () => turn(-1));
$('statNext').addEventListener('click', () => turn(1));
window.addEventListener('keydown', e => {   // 統計視窗開著時：← → 或 A D 換頁
  const d = pageDir(e);
  if (!statModal.classList.contains('open') || !d) return;
  if ((d < 0 && !$('statPrev').disabled) || (d > 0 && !$('statNext').disabled)) turn(d);
  e.preventDefault();
});
$('statClose').addEventListener('click', () => statModal.classList.remove('open'));
statModal.addEventListener('click', e => { if (e.target === statModal) statModal.classList.remove('open'); });
