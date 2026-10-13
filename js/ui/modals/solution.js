/* 解答檢視視窗（點縮圖開啟；頂欄顏色 = 該關卡顏色，不動目前正在解的盤面） */
import { t, fmtTime } from '../../i18n/i18n.js';
import { LV_COLORS, LV_INK } from '../../core/config.js';
import { loadBook } from '../../storage/book.js';
import { settings } from '../../state/settings.js';
import { state, curLevel, lvLong, groupOfSig, grpTag } from '../../state/state.js';
import { $, els } from '../dom.js';
import { solutionSVG, newestFirst } from '../render-book.js';

export const solModal = $('solModal');
const solHead = L => L.title || lvLong(L);
function showSolution(list, idx, near) {
  const L = curLevel(), item = list[idx];
  state.viewItem = { item, L, near, list, idx };
  $('solBar').style.background = LV_COLORS[L.lv - 1]; $('solBar').style.color = LV_INK[L.lv - 1];
  const gt = grpTag(L, groupOfSig(L, item.sig));   // 有拼圖組合的關卡：標題標註這組解答使用的組合（如「A組」）
  $('solTitle').textContent = t('sol.title', solHead(L) + (gt ? ' ' + gt : ''), near);
  $('solView').innerHTML = solutionSVG(item.disp || item.sig, Math.min(window.innerWidth - 96, 540), Math.max(240, window.innerHeight * 0.55));
  $('solTime').textContent = item.time ? fmtTime(item.time) : '';
  $('solNick').textContent = item.nick || settings.nick || t('anon');
  $('solPrev').disabled = idx <= 0;                  // 左右箭頭一律顯示；沒有上（下）一個解時不可點按（不循環）
  $('solNext').disabled = idx >= list.length - 1;
  $('solIdx').textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
}
export function stepSolution(d) {
  const v = state.viewItem;
  if (!v || !v.list) return;
  const n = v.idx + d;
  if (n < 0 || n >= v.list.length) return;   // 已經是第一個 / 最後一個
  showSolution(v.list, n, v.near);
}
function openSolution(b) {
  const L = curLevel(), near = !!b.dataset.near, bk = loadBook();
  const list = newestFirst(near ? ((bk.near || {})[L.lv] || []) : (bk.levels[L.lv] || []));   // 順序與縮圖相同（新→舊）
  const idx = list.findIndex(it => it.sig === b.dataset.key);
  if (idx < 0) return;
  showSolution(list, idx, near);
  solModal.classList.add('open');
}
$('solPrev').addEventListener('click', () => stepSolution(-1));
$('solNext').addEventListener('click', () => stepSolution(1));
[els.bookThumbs, $('nearThumbs')].forEach(box => box.addEventListener('click', e => {
  const b = e.target.closest('[data-key]'); if (b) openSolution(b);
}));
$('solClose').addEventListener('click', () => solModal.classList.remove('open'));
solModal.addEventListener('click', e => { if (e.target === solModal) solModal.classList.remove('open'); });
