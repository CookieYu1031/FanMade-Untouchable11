/* 各關卡收錄進度表（正解；開啟「近似解」開關時，同一關卡再多一列近似解）
 *   分頁：第 1 頁 = Lv1~8；第 2 頁 = 獨立關卡（大師挑戰、危險貨物…，需開啟額外關卡）
 *   換頁：視窗下方的左右箭頭（或鍵盤左右鍵），做法與解答檢視相同；沒有上（下）一頁時箭頭不可點按 */
import { t } from '../../i18n/i18n.js';
import { LEVELS, LV_COLORS, LV_INK } from '../../core/config.js';
import { loadBook } from '../../storage/book.js';
import { settings } from '../../state/settings.js';
import { state, lvTag, nearTotal } from '../../state/state.js';
import { $ } from '../dom.js';
import { EYE, EYE_OFF } from '../render-book.js';

function fmtPct(n, total) {   // 無條件捨去到小數點後 2 位；不足 0.01% 顯示 0.00%
  const v = Math.min(100, n / total * 100);
  return (Math.floor(v * 100 + 1e-9) / 100).toFixed(2) + '%';
}
// 分頁內容：第 1 頁 Lv1~8、第 2 頁獨立關卡（未開啟額外關卡時只有第 1 頁）
const pages = () => {
  const main = LEVELS.filter(L => !L.extra), ext = LEVELS.filter(L => L.extra);
  return settings.extra && ext.length ? [main, ext] : [main];
};

// 正解那一列的三格：解答組數、收錄組數、收錄進度
function exactCells(L, book) {
  const got = (book.levels[L.lv] || []).length;
  const n = L.total == null ? got : Math.min(got, L.total);
  const prog = L.total == null ? '<span class="pct">—</span>'     // 總組數未知：只顯示收錄數
    : L.lv <= 6
    ? `<div class="pbar"><i style="width:${n / L.total * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div><span class="pct">${fmtPct(n, L.total)}</span>`
    : `<div class="dots">${Array.from({ length: L.total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  return `<td>${L.total == null ? '—' : L.total.toLocaleString()}</td><td>${n.toLocaleString()}</td><td class="c-prog"><div class="pg">${prog}</div></td>`;
}
// 近似解那一列的三格（文字為灰字，樣式見 .nr）
function nearCells(L, book) {
  const tot = nearTotal(L), got = ((book.near || {})[L.lv] || []).length;
  if (tot == null) // 實際組數未知：只顯示收錄數，沒有進度條與 %
    return `<td>—</td><td>${got.toLocaleString()}</td><td class="c-prog"><div class="pg"><span class="pct">—</span></div></td>`;
  const n = Math.min(got, tot);
  return `<td>${tot.toLocaleString()}</td><td>${n.toLocaleString()}</td>`
    + `<td class="c-prog"><div class="pg"><div class="pbar"><i style="width:${n / tot * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div><span class="pct">${fmtPct(n, tot)}</span></div></td>`;
}

export function renderStats() {
  const book = loadBook(), near = !!state.statNear, all = pages();
  state.statPage = Math.max(0, Math.min(all.length - 1, state.statPage || 0));   // 關閉額外關卡後頁數可能超出範圍
  const head = `<thead><tr><th>${t('stat.lv')}</th><th>${t(near ? 'stat.totalNear' : 'stat.total')}</th><th>${t('stat.got')}</th><th class="c-prog">${t('stat.progress')}</th></tr></thead>`;
  const tag = (L, span) => { const c = LV_COLORS[L.lv - 1]; return `<td${span > 1 ? ` rowspan="${span}"` : ''}><span class="lvtag" style="background:${c};color:${LV_INK[L.lv - 1]}">${lvTag(L)}</span></td>`; };
  const rows = all[state.statPage].map(L => {
    const st = `style="--c:${LV_COLORS[L.lv - 1]}"`;
    if (!(near && L.near)) return `<tr ${st}>${tag(L, 1)}${exactCells(L, book)}</tr>`;   // 沒有近似解的關卡維持一列
    return `<tr class="g1" ${st}>${tag(L, 2)}${exactCells(L, book)}</tr><tr class="nr" ${st}>${nearCells(L, book)}</tr>`;   // 關卡標籤佔兩列高度
  }).join('');
  $('statTable').innerHTML = `${head}<tbody>${rows}</tbody>`;
  $('statTable').classList.toggle('more', near);   // 窄視窗：「收錄進度」欄預設隱藏，按下「顯示更多資訊」才出現（見 stats.css）
  $('statTitle').innerHTML = t('stat.title') + (all.length > 1 ? `<small>${state.statPage + 1} / ${all.length}</small>` : '');
  const nb = $('statNearBtn');   // 更多資訊（近似解列；窄視窗另含收錄進度欄）：睜眼 = 目前顯示，閉眼 = 目前隱藏（與解答冊的隱藏按鈕相同）
  nb.innerHTML = near ? EYE : EYE_OFF;
  nb.title = t(near ? 'stat.nearHide' : 'stat.nearShow'); nb.setAttribute('aria-label', nb.title);
  nb.setAttribute('aria-pressed', String(near));
  $('statPrev').disabled = state.statPage === 0;                 // 沒有上一頁：箭頭仍顯示但不可點按
  $('statNext').disabled = state.statPage >= all.length - 1;     // 沒有下一頁：同上
}
const statModal = $('statModal');
const turn = d => { state.statPage = (state.statPage || 0) + d; renderStats(); };
$('btnStats').addEventListener('click', () => { state.statPage = 0; renderStats(); statModal.classList.add('open'); });
$('statNearBtn').addEventListener('click', () => { state.statNear = !state.statNear; renderStats(); });
$('statPrev').addEventListener('click', () => turn(-1));
$('statNext').addEventListener('click', () => turn(1));
window.addEventListener('keydown', e => {   // 統計視窗開著時：左右鍵換頁
  if (!statModal.classList.contains('open') || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  if ((e.key === 'ArrowLeft' && !$('statPrev').disabled) || (e.key === 'ArrowRight' && !$('statNext').disabled)) turn(e.key === 'ArrowLeft' ? -1 : 1);
  e.preventDefault();
});
$('statClose').addEventListener('click', () => statModal.classList.remove('open'));
statModal.addEventListener('click', e => { if (e.target === statModal) statModal.classList.remove('open'); });
