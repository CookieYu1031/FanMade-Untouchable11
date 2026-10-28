/* 語言選單（自製 listbox）—— 點語言按鈕向下展開「國旗矩陣」（2 列 × 6 欄，順序同 i18n.js 的 LANGS），
   滑鼠懸停 / 鍵盤聚焦在國旗上時顯示語言名稱（樣式見 css/settings.css）。
   支援：滑鼠 / 觸控、鍵盤（← → ↑ ↓ Home End Enter Space Esc、直接輸入字母跳選）、螢幕閱讀器（listbox / option + aria-label）。 */
import { LANGS, LANG_INFO, getLang } from '../../i18n/i18n.js';
import { FLAGS } from '../flags.js';
import { $ } from '../dom.js';

const btn = $('selLang'), list = $('langList'), cur = $('langCur');
const COLS = 6;   // 矩陣欄數（要與 css/settings.css 的 grid-template-columns 一致）
let onPick = () => {};

// 每格只放國旗；語言名稱放在 data-name（CSS 提示框）與 aria-label（螢幕閱讀器）
const item = l => `<div class="lopt" role="option" tabindex="-1" id="lang-${l}" data-lang="${l}" data-name="${LANG_INFO[l].label}" aria-label="${LANG_INFO[l].label}" lang="${LANG_INFO[l].html}">${FLAGS[l]}</div>`;
list.innerHTML = LANGS.map(item).join('');
const opts = () => [...list.children];

const isOpen = () => !list.hidden;
function open() {
  list.hidden = false; btn.setAttribute('aria-expanded', 'true');
  list.style.right = '';
  // 矩陣可以伸出設定視窗外，但不能超出螢幕：下方放不下就往上展開；左邊超出螢幕就往右挪
  const r = btn.getBoundingClientRect(), h = list.offsetHeight + 4 + 36, below = innerHeight - r.bottom - 12, above = r.top - 12;   // 多留 36px 給矩陣外側的名稱提示
  list.classList.toggle('up', h > below && above > below);
  const q = list.getBoundingClientRect();
  if (q.left < 8) list.style.right = -(8 - q.left) + 'px';
  (opts().find(o => o.dataset.lang === getLang()) || opts()[0]).focus();
}
function close(focusBtn = false) {
  if (!isOpen()) return;
  list.hidden = true; btn.setAttribute('aria-expanded', 'false');
  if (focusBtn) btn.focus();
}
function pick(l) { close(true); if (l !== getLang()) onPick(l); }

// 按鈕上顯示目前語言（設定視窗開啟 / 語言變更時呼叫；順便把展開中的選單收起來）
export function syncLangPicker() {
  const l = getLang();
  cur.innerHTML = `${FLAGS[l]}<span>${LANG_INFO[l].label}</span>`;
  opts().forEach(o => o.setAttribute('aria-selected', String(o.dataset.lang === l)));
  btn.setAttribute('aria-activedescendant', '');
  close();
}
export const initLangPicker = fn => { onPick = fn; syncLangPicker(); };

btn.addEventListener('click', () => (isOpen() ? close() : open()));
btn.addEventListener('keydown', e => {
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); if (!isOpen()) open(); }
});
list.addEventListener('click', e => { const o = e.target.closest('[data-lang]'); if (o) pick(o.dataset.lang); });
list.addEventListener('keydown', e => {
  const o = opts(), i = o.indexOf(document.activeElement);
  const go = n => { e.preventDefault(); o[(n + o.length) % o.length].focus(); };
  switch (e.key) {
    case 'ArrowRight': go(i + 1); break;
    case 'ArrowLeft': go(i - 1); break;
    case 'ArrowDown': go(i + COLS); break;   // 矩陣上下移動：往下 / 往上一列（兩列之間循環）
    case 'ArrowUp': go(i - COLS); break;
    case 'Home': go(0); break;
    case 'End': go(o.length - 1); break;
    case 'Enter': case ' ': e.preventDefault(); if (i >= 0) pick(o[i].dataset.lang); break;
    case 'Escape': e.preventDefault(); e.stopPropagation(); close(true); break;   // 只收選單，不要連設定視窗一起關掉
    case 'Tab': close(); break;
    default: {   // 輸入字母：跳到名稱以該字母開頭的下一個選項（English → E，再按一次到下一個 E 開頭的）
      const k = e.key.toLowerCase();
      if (k.length === 1) {
        const n = [...o.keys()].map(x => (i + 1 + x) % o.length).find(x => o[x].dataset.name.toLowerCase().startsWith(k));
        if (n !== undefined) go(n);
      }
    }
  }
});
document.addEventListener('pointerdown', e => { if (isOpen() && !e.target.closest('#langPick')) close(); });
