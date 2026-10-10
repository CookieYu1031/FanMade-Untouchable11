/* 解答冊 —— 收錄數、縮圖、近似解區，以及放大檢視用的解答 SVG */
import { t } from '../i18n/i18n.js';
import { Store, KEY_UI } from '../storage/store.js';
import { rotateCW } from '../core/matrix.js';
import { loadBook } from '../storage/book.js';
import { state, curLevel, lvShort, nearTotal, colorOf, clamp } from '../state/state.js';
import { $, els } from './dom.js';
import { cellRects } from './svg.js';

// 解答縮圖
function sigSVG(sig) {
  let g = sig.split('/').map(r => [...r]);
  if (state.rotated) g = rotateCW(g); // 跟盤面一樣用橫式顯示
  const rows = g.length, cols = g[0].length;
  const px = Math.max(4, Math.floor(Math.min(150 / cols, 110 / rows))); // 縮圖約塞進 150×110
  let r = '';
  g.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${colorOf(ch).fill}"/>`;
  }));
  return `<svg viewBox="0 0 ${cols} ${rows}" width="${cols * px}" height="${rows * px}">${r}</svg>`;
}
const SVG_ATTR = 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
export const EYE = `<svg ${SVG_ATTR}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
export const EYE_OFF = `<svg ${SVG_ATTR}><path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.7A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
function thumbsHTML(list, near) {
  return [...list].reverse().slice(0, 60).map(it =>
    `<button class="thumb" data-key="${it.sig}"${near ? ' data-near="1"' : ''} title="${t('book.view')}">${sigSVG(it.disp || it.sig)}</button>`).join('');
}
export function renderBook() {
  const L = curLevel(), book = loadBook();
  const list = book.levels[L.lv] || [];
  // 隱藏符號按鈕：睜眼 = 目前顯示解答，閉眼 = 目前已遮蔽
  // 這個關卡完全沒有解答（含近似解）時，停用隱藏按鈕，也不套用「隱藏」狀態（沒東西可藏）
  const hasAny = list.length > 0 || (!!L.near && ((book.near && book.near[L.lv]) || []).length > 0);
  const hidden = state.bookHidden && hasAny;
  const hb = $('btnHide');
  hb.disabled = !hasAny;   // 沒有解答時停用（與「返回上一步」相同的灰階樣式），而不是消失
  hb.innerHTML = hidden ? EYE_OFF : EYE;
  hb.title = hidden ? t('book.show') : t('book.hide');
  hb.setAttribute('aria-label', hb.title);
  hb.setAttribute('aria-pressed', String(hidden));

  let info = `<div class="book-count">${t('book.count', lvShort(L), list.length.toLocaleString(), L.total == null ? null : L.total.toLocaleString())}</div>`, thumbs = '';
  if (hidden && list.length) info += `<p class="empty">${t('book.hidden')}</p>`;   // 只遮蔽「有收錄」的區塊；空的區塊照常顯示空白提示
  else if (!list.length) info += `<p class="empty">${t('book.empty')}</p>`;
  else thumbs = thumbsHTML(list, false);
  els.bookInfo.innerHTML = info; els.bookThumbs.innerHTML = thumbs;
  renderNear(L, book, hidden);
}
// 近似解區（只有 Lv8、危險貨物）：顯示在解答冊下方
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
  let g = sig.split('/').map(r => [...r]);
  if (state.rotated) g = rotateCW(g);
  const rows = g.length, cols = g[0].length;
  const px = clamp(Math.floor(Math.min(maxW / cols, maxH / rows)), 8, 40);
  let grid = '';
  for (let x = 1; x < cols; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${rows}"/>`;
  for (let y = 1; y < rows; y++) grid += `<line x1="0" y1="${y}" x2="${cols}" y2="${y}"/>`;
  let r = '';
  g.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== '.') r += cellRects([[x, y]], colorOf(ch));
  }));
  return `<svg viewBox="0 0 ${cols} ${rows}" width="${cols * px}" height="${rows * px}" style="background:var(--board);border:2px solid var(--line);border-radius:3px;display:block"><g stroke="var(--gridline)" stroke-width=".05">${grid}</g>${r}</svg>`;
}

// 隱藏 / 顯示解答：不論目前有沒有收錄解答都可以切換，並記住選擇
$('btnHide').addEventListener('click', () => {
  state.bookHidden = !state.bookHidden;
  Store.set(KEY_UI, { ...Store.get(KEY_UI, {}), hidden: state.bookHidden });
  renderBook();
});
