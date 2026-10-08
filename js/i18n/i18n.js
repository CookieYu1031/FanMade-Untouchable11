/* 多語系 —— 中 / 英。靜態文字用 data-i18n* 屬性，動態文字用 t('key', ...參數) */
import zh from './locales/zh.js';
import en from './locales/en.js';

const I18N = { zh, en };
let LANG = 'zh';
export const getLang = () => LANG;
export const setLang = l => { LANG = l === 'en' ? 'en' : 'zh'; };

export const t = (k, ...a) => {
  const v = (I18N[LANG] && I18N[LANG][k] !== undefined) ? I18N[LANG][k] : I18N.zh[k];
  return typeof v === 'function' ? v(...a) : (v === undefined ? k : v);
};
// 套用到頁面上所有帶 data-i18n* 屬性的靜態元素
export function applyI18n() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { const v = t(el.dataset.i18nTitle); el.title = v; el.setAttribute('aria-label', v); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}
export const fmtTime = ts => new Date(ts).toLocaleString(LANG === 'zh' ? 'zh-TW' : 'en-US', { hour12:false });
