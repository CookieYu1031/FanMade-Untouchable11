/* 設定 —— 暱稱、語言、背景、獨立關卡開關、音量 */
import { Store, KEY_SET } from '../storage/store.js';

// ---- 設定 ----
export const settings = (() => {
  const s = Store.get(KEY_SET, {}) || {};
  return {
    nick: typeof s.nick === 'string' ? s.nick.slice(0, 20) : '',
    lang: s.lang === 'en' ? 'en' : 'zh',
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : null, // null = 跟隨系統
    extra: s.extra === true,   // 是否啟用獨立關卡（大師挑戰、危險貨物）
    vol: Number.isInteger(s.vol) && s.vol >= 0 && s.vol <= 10 ? s.vol : 5, // 音量：0~10 段，每段 10%
  };
})();
export const saveSettings = () => Store.set(KEY_SET, settings);
export const effTheme = () => settings.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
export function applyTheme() {
  const r = document.documentElement;
  if (settings.theme) r.setAttribute('data-theme', settings.theme); else r.removeAttribute('data-theme');
}
