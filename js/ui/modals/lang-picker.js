/* 語言選擇：設定視窗裡只放一顆「🌐 ISO 代碼」按鈕（如 zh-TW），點下去，設定視窗的「內容」換成語言選擇畫面
   （標題列與視窗大小不變；高度鎖成與設定內容相同），點任一語言就立刻套用並回到設定畫面；標題列的 ✕ 或 Esc = 不換語言、回到設定畫面。
   畫面分兩區：「當前語言與推薦」（一列；最左固定為目前語言，其餘見 i18n.js 的 recommendLangs）、其下「一般語言」
   （依語言原名稱首字母排序，已在推薦區的不重複；點「A~Z ↓」切換正 / 倒序）。每列 4 / 3 / 2 欄依視窗寬度決定；
   一般語言放不下就分頁，翻頁列在視窗外下方中間（取代問題回報小字）。
   鍵盤：← → ↑ ↓ 在語言格間移動（到頁尾自動翻頁）、PageUp / PageDown 翻頁、Enter / 空白鍵選取、Esc 回設定畫面。 */
import { LANGS, LANG_INFO, getLang, recommendLangs, sortLangs } from '../../i18n/i18n.js';
import { $, escapeHtml } from '../dom.js';

const btn = $('selLang'), cur = $('langCur'), setModal = $('setModal'), setBody = $('setBody'), body = $('langBody');
const recEl = $('langRec'), allEl = $('langAll'), sortBtn = $('langSort'), nav = $('langNav'), prev = $('langPrev'), next = $('langNext'), pg = $('langPg');
const setTitle = $('setTitle'), langTitle = $('langTitle'), report = $('setReport');
let onPick = () => {};
let desc = false;                 // 一般語言：false = A~Z、true = Z~A
let current = '', cols = 4, page = 0, pages = 1, rec = [], rest = [];

// 問題回報小字：語言選擇畫面時保留區域但看不見、點不到（視窗才不會跑版）
const ghostReport = on => { report.classList.toggle('ghost', on); report.tabIndex = on ? -1 : 0; report.setAttribute('aria-hidden', String(on)); };
// 剛切換畫面的 ARM_MS 毫秒內忽略點擊（連點保護：點語言按鈕時手滑連點兩下，第二下會落在剛出現的語言格上）。
// 只在事件層攔截、不改任何樣式（不加 class、不改透明度、不用 pointer-events:none），所以使用者看不出來、畫面也不會閃爍
const ARM_MS = 400;
let armedUntil = 0;
const guard = () => { armedUntil = performance.now() + ARM_MS; };
// capture 階段搶在所有按鈕之前攔下（只攔語言畫面與設定畫面內的操作，標題列 ✕ 與背景不受影響）
for (const type of ['pointerdown', 'mousedown', 'click']) {
  setModal.addEventListener(type, e => {
    if (performance.now() >= armedUntil || !(body.contains(e.target) || setBody.contains(e.target))) return;
    e.preventDefault(); e.stopPropagation();
  }, true);
}
export const isLangView = () => !body.hidden;
// 視窗寬度 → 欄數：寬 4 欄、中 3 欄、窄 2 欄
const colsFor = w => (w >= 500 ? 4 : w >= 340 ? 3 : 2);
const cssPx = name => parseFloat(getComputedStyle(body).getPropertyValue(name)) || 0;

const tile = l => `<button type="button" class="lopt" role="radio" data-lang="${l}" aria-checked="${l === current}" lang="${LANG_INFO[l].html}" style="font-family:${escapeHtml(LANG_INFO[l].font)}" data-nosound><span>${escapeHtml(LANG_INFO[l].label)}</span></button>`;

function drawAll() {
  const gap = cssPx('--lg'), row = cssPx('--lr');
  const rows = Math.max(1, Math.floor((allEl.clientHeight + gap) / (row + gap)));   // 一般語言區放得下幾列
  const cap = rows * cols;
  pages = Math.max(1, Math.ceil(rest.length / cap));
  page = Math.min(page, pages - 1);
  allEl.innerHTML = rest.slice(page * cap, page * cap + cap).map(tile).join('');
  nav.hidden = pages <= 1;
  pg.textContent = `${page + 1} / ${pages}`;
  prev.disabled = page === 0; next.disabled = page >= pages - 1;
}
function layout() {   // 欄數、推薦列、一般列全部重算（開啟 / 視窗大小改變時）
  cols = colsFor(body.clientWidth + 32);
  body.style.setProperty('--lc', cols);
  rec = recommendLangs(current, cols);
  rest = sortLangs(LANGS.filter(l => !rec.includes(l)), desc);
  sortBtn.textContent = desc ? 'Z~A ↓' : 'A~Z ↓';
  recEl.innerHTML = rec.map(tile).join('');
  drawAll();
}
const tiles = () => [...body.querySelectorAll('.lopt')];

function open() {
  current = getLang(); page = 0;
  body.style.height = setBody.getBoundingClientRect().height + 'px';   // 內容高度與設定畫面相同，視窗大小不變
  setBody.hidden = true; body.hidden = false;
  setTitle.hidden = true; langTitle.hidden = false; ghostReport(true);
  guard();
  btn.setAttribute('aria-expanded', 'true');
  layout();
  (body.querySelector('.lopt[aria-checked="true"]') || tiles()[0]).focus();
}
export function closeLangView(focusBtn = true) {
  if (body.hidden) return;
  body.hidden = true; setBody.hidden = false; nav.hidden = true;
  langTitle.hidden = true; setTitle.hidden = false; ghostReport(false);
  if (focusBtn) guard();   // 選完語言回到設定畫面時，同一個位置的連點也不要誤觸設定（syncLangPicker 內部呼叫不需要）
  btn.setAttribute('aria-expanded', 'false');
  if (focusBtn) btn.focus();
}
function turn(d, focusFirst = false) {
  const n = Math.min(pages - 1, Math.max(0, page + d));
  if (n === page) return false;
  page = n; drawAll();
  if (focusFirst) (d > 0 ? allEl.firstElementChild : allEl.lastElementChild)?.focus();
  return true;
}

// 設定視窗上的按鈕：🌐 + ISO 代碼（設定視窗開啟 / 語言變更時呼叫；順便回到設定畫面）
export function syncLangPicker() {
  cur.textContent = LANG_INFO[getLang()].code;
  closeLangView(false);
}
export const initLangPicker = fn => { onPick = fn; syncLangPicker(); };

btn.addEventListener('click', open);
body.addEventListener('click', e => {
  const o = e.target.closest('.lopt'); if (!o) return;
  const l = o.dataset.lang;
  closeLangView();
  if (l !== current) onPick(l);   // 選了別的語言：立刻套用；選目前語言 = 直接回設定畫面
});
sortBtn.addEventListener('click', () => { desc = !desc; page = 0; layout(); });
prev.addEventListener('click', () => turn(-1));
next.addEventListener('click', () => turn(1));
window.addEventListener('resize', () => { if (isLangView() && setModal.classList.contains('open')) layout(); });

// Esc 只回到設定畫面，不要連設定視窗一起關掉：用 capture 搶在 keyboard.js 之前處理
document.addEventListener('keydown', e => {
  if (!isLangView()) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLangView(); return; }
  if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); turn(e.key === 'PageDown' ? 1 : -1); return; }
  const t = tiles(), i = t.indexOf(document.activeElement);
  if (i < 0 || !e.key.startsWith('Arrow')) return;
  e.preventDefault(); e.stopPropagation();
  const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key], n = i + d;
  if (n >= 0 && n < t.length) t[n].focus();
  else if (d > 0 && n >= t.length) turn(1, true);   // 超過最後一格：翻到下一頁（往上 / 往左永遠有格子可去，最前面是推薦列）
}, true);
