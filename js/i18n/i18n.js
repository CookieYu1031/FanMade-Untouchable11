/* 多語系 —— 中 / 英 / 日。靜態文字用 data-i18n* 屬性，動態文字用 t('key', ...參數) */
import zh from './locales/zh.js';
import en from './locales/en.js';
import ja from './locales/ja.js';

const I18N = { zh, en, ja };
export const LANGS = ['zh', 'en', 'ja'];   // 支援的語言（設定下拉選單依此順序）
const HTML_LANG = { zh:'zh-Hant', en:'en', ja:'ja' };
const LOCALE = { zh:'zh-TW', en:'en-US', ja:'ja-JP' };
let LANG = 'zh';
export const getLang = () => LANG;
export const normLang = l => LANGS.includes(l) ? l : 'zh';
export const setLang = l => { LANG = normLang(l); };

export const t = (k, ...a) => {
  const v = (I18N[LANG] && I18N[LANG][k] !== undefined) ? I18N[LANG][k] : I18N.zh[k];
  return typeof v === 'function' ? v(...a) : (v === undefined ? k : v);
};
// 套用到頁面上所有帶 data-i18n* 屬性的靜態元素
export function applyI18n() {
  document.documentElement.lang = HTML_LANG[LANG];
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { const v = t(el.dataset.i18nTitle); el.title = v; el.setAttribute('aria-label', v); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}
export const fmtTime = ts => new Date(ts).toLocaleString(LOCALE[LANG], { hour12:false });
