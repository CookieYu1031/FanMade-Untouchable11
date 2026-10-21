/* 解答冊 —— 收錄數、縮圖、近似解區，以及放大檢視用的解答 SVG */
import { t } from '../i18n/i18n.js';
import { settings, saveSettings } from '../state/settings.js';
import { rotateCW } from '../core/matrix.js';
import { loadBook } from '../storage/book.js';
import { state, curLevel, lvShort, nearTotal, colorOf, clamp, groupOfSig, solvedGroups, itemTag, starName } from '../state/state.js';
import { $, els, escapeHtml } from './dom.js';
import { cellRects, STAR } from './svg.js';

// 解答縮圖
function sigSVG(sig) {
  const L = curLevel(), grp = groupOfSig(L, sig);   // 顏色跟槽位掛鉤：其他組合的解答要用它自己那組的配色
  let g = sig.split('/').map(r => [...r]);
  if (state.rotated) g = rotateCW(g); // 跟盤面一樣用橫式顯示
  const rows = g.length, cols = g[0].length;
  const px = Math.max(4, Math.floor(Math.min(150 / cols, 110 / rows))); // 縮圖約塞進 150×110
  let r = '';
  g.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${colorOf(ch, L, grp).fill}"/>`;
  }));
  return `<svg viewBox="0 0 ${cols} ${rows}" width="${cols * px}" height="${rows * px}">${r}</svg>`;
}
const SVG_ATTR = 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
export const EYE = `<svg ${SVG_ATTR}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
export const EYE_OFF = `<svg ${SVG_ATTR}><path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.7A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
// 星星進度：每個拼圖組合一顆星，解出該組合的唯一解就點亮（書冊與統計表共用）
export function starsHTML(L, solved) {
  return `<div class="stars">${L.groups.map(g => `<i class="${solved.has(g.key) ? 'on' : ''}" title="${escapeHtml(starName(g.key))}">${STAR}</i>`).join('')}</div>`;
}
// 解答 / 近似解的顯示順序：玩家最新解出的在最左側（依收錄時間新→舊；時間相同則後收錄的在前）。縮圖與解答檢視共用
export const newestFirst = list => list.map((it, i) => [it, i]).sort((a, b) => (b[0].time || 0) - (a[0].time || 0) || b[1] - a[1]).map(x => x[0]);
// 縮圖；有拼圖組合的關卡，左上角標註這組解答使用的組合（如 A）
// 縮圖區：縮圖在左（.tl），一行放不下時，最右側出現「>」按鈕收合 / 展開其餘的縮圖（fitThumbs 負責判斷）
const MORE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
function thumbsHTML(list, near) {
  const L = curLevel();
  const items = newestFirst(list).slice(0, 60).map(it => {
    const gk = groupOfSig(L, it.sig), tag = L.random ? itemTag(L, it) : gk ? starName(gk) : '';   // 隨機挑戰：標註代碼（如 3K7Z、GOOD(3K7Z)）
    return `<button class="thumb" data-key="${it.sig}"${near ? ' data-near="1"' : ''} title="${t('book.view')}${tag ? '　' + escapeHtml(tag) : ''}">${sigSVG(it.disp || it.sig)}${gk ? `<span class="gtag${L.random ? ' code' : ''}">${escapeHtml(L.random ? tag : starName(gk))}</span>` : ''}</button>`;
  }).join('');
  return `<div class="tl">${items}</div><button class="tmore" type="button" hidden>${MORE}</button>`;
}
// 展開狀態（只記在記憶體；預設收合成一行）
const open = { book: false, near: false };
// 決定縮圖區是否需要「>」：先拿掉按鈕量，全部都放得進第一行就不需要；放不下才顯示按鈕（縮圖區變窄），收合時高度鎖在一行
function fitThumbs(box, key) {
  const tl = box.querySelector('.tl'), btn = box.querySelector('.tmore');
  if (!tl || !btn) return;
  const kids = [...tl.children]; if (!kids.length) return;
  tl.style.height = ''; btn.hidden = true; box.classList.remove('has-more');
  const top = kids[0].offsetTop, fits = kids.every(c => c.offsetTop === top);
  if (fits) { box.classList.remove('open'); kids.forEach(c => c.removeAttribute('tabindex')); return; }
  btn.hidden = false; box.classList.add('has-more');
  const rowH = kids[0].offsetHeight, isOpen = open[key];
  box.classList.toggle('open', isOpen);
  btn.style.height = rowH + 'px';
  btn.setAttribute('aria-expanded', String(isOpen));
  btn.title = t(isOpen ? 'book.less' : 'book.more'); btn.setAttribute('aria-label', btn.title);
  if (!isOpen) tl.style.height = rowH + 'px';
  const t0 = kids[0].offsetTop;
  kids.forEach(c => { if (!isOpen && c.offsetTop > t0) c.tabIndex = -1; else c.removeAttribute('tabindex'); });   // 收合時被藏起來的縮圖不要被 Tab 選到
}
function fitAll() { fitThumbs(els.bookThumbs, 'book'); fitThumbs($('nearThumbs'), 'near'); }
let fitRaf = 0;
window.addEventListener('resize', () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitAll); });
[['book', els.bookThumbs], ['near', $('nearThumbs')]].forEach(([key, box]) => box.addEventListener('click', e => {
  if (!e.target.closest('.tmore')) return;
  open[key] = !open[key]; fitThumbs(box, key);
}));
export function renderBook() {
  const L = curLevel(), book = loadBook();
  const list = book.levels[L.lv] || [];
  // 隱藏符號按鈕：睜眼 = 目前顯示解答，閉眼 = 目前已遮蔽
  // 這個關卡完全沒有解答（含近似解）時，停用隱藏按鈕，也不套用「隱藏」狀態（沒東西可藏）
  const hasAny = list.length > 0 || (!!L.near && ((book.near && book.near[L.lv]) || []).length > 0);
  const hidden = settings.hideBook && hasAny;
  $('btnRank').hidden = !settings.rank;   // 不參與排行時隱藏排行榜按鈕（右側的隱藏解答按鈕會自動往右靠，不留空位）
  const hb = $('btnHide');
  hb.disabled = !hasAny;   // 沒有解答時停用（與「返回上一步」相同的灰階樣式），而不是消失
  hb.innerHTML = hidden ? EYE_OFF : EYE;
  hb.title = hidden ? t('book.show') : t('book.hide');
  hb.setAttribute('aria-label', hb.title);
  hb.setAttribute('aria-pressed', String(hidden));

  const solved = L.groups ? solvedGroups(L, list) : null;   // 摘星挑戰：收錄數 = 已解出幾顆星（每組拼圖只有 1 組唯一解）
  let info = `<div class="book-count">${t('book.count', lvShort(L), (solved ? solved.size : list.length).toLocaleString(), L.total == null ? null : L.total.toLocaleString())}</div>`, thumbs = '';
  if (solved) info += starsHTML(L, solved);
  if (hidden && list.length) info += `<p class="empty">${t('book.hidden')}</p>`;   // 只遮蔽「有收錄」的區塊；空的區塊照常顯示空白提示
  else if (!list.length) info += `<p class="empty">${t('book.empty')}</p>`;
  else thumbs = thumbsHTML(list, false);
  els.bookInfo.innerHTML = info; els.bookThumbs.innerHTML = thumbs;
  renderNear(L, book, hidden);
  fitAll();
}
// 近似解區（有近似解的關卡）：顯示在解答冊下方
function renderNear(L, book, hidden) {
  const zone = $('nearZone');
  if (!L.near) { zone.hidden = true; return; }
  zone.hidden = false;
  const nl = (book.near && book.near[L.lv]) || [];
  let info = `<div class="book-count">${t('near.count', nl.length.toLocaleString(), nearTotal(L) == null ? null : nearTotal(L).toLocaleString(), t('near.desc'))}</div>`, thumbs = '';
  if (hidden && nl.length) info += `<p class="empty">${t('book.hidden')}</p>`;
  else if (!nl.length) info += `<p class="empty">${t('near.empty')}</p>`;
  else thumbs = thumbsHTML(nl, true);
  $('nearInfo').innerHTML = info; $('nearThumbs').innerHTML = thumbs;
}
// 解答檢視（放大版，含格線與拼圖邊線；方向與盤面顯示一致）
export function solutionSVG(sig, maxW, maxH) {
  const L = curLevel(), grp = groupOfSig(L, sig);
  let g = sig.split('/').map(r => [...r]);
  if (state.rotated) g = rotateCW(g);
  const rows = g.length, cols = g[0].length;
  const px = clamp(Math.floor(Math.min(maxW / cols, maxH / rows)), 8, 40);
  let grid = '';
  for (let x = 1; x < cols; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${rows}"/>`;
  for (let y = 1; y < rows; y++) grid += `<line x1="0" y1="${y}" x2="${cols}" y2="${y}"/>`;
  let r = '';
  g.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== '.') r += cellRects([[x, y]], colorOf(ch, L, grp));
  }));
  return `<svg viewBox="0 0 ${cols} ${rows}" width="${cols * px}" height="${rows * px}" style="background:var(--board);border:2px solid var(--line);border-radius:3px;display:block"><g stroke="var(--gridline)" stroke-width=".05">${grid}</g>${r}</svg>`;
}

// 隱藏 / 顯示解答：不論目前有沒有收錄解答都可以切換，並記在設定裡（登入時同步到雲端）
$('btnHide').addEventListener('click', () => {
  settings.hideBook = !settings.hideBook;
  saveSettings();   // 寫入設定（登入時會同步到雲端）
  renderBook();
});
