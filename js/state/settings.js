/* 設定 —— 暱稱、語言、背景、獨立關卡開關、參與排行開關、近似解顯示、解答冊隱藏、音效 / 音樂音量（登入時會同步到雲端） */
import { Store, Hooks, KEY_SET } from '../storage/store.js';
import { normLang } from '../i18n/i18n.js';

// 把任意來源（本機存檔、雲端資料）整理成合法設定
export const sanitizeSettings = (s = {}) => ({
  nick: typeof s.nick === 'string' ? s.nick.slice(0, 20) : '',
  lang: normLang(s.lang),
  theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : null, // null = 跟隨系統
  extra: s.extra === true,   // 是否啟用獨立關卡（大師挑戰、危險貨物）
  rank: s.rank !== false,    // 是否參與排行（預設參與）；關閉時不計分、不上榜、不上傳積分，並移除榜上的積分資料
  near: s.near === true,     // 統計：是否顯示近似解（更多資訊）
  hideBook: s.hideBook === true, // 解答冊：是否隱藏解答
  vol: Number.isInteger(s.vol) && s.vol >= 0 && s.vol <= 10 ? s.vol : 5, // 音效音量：0~10 段，每段 10%
  musicVol: Number.isInteger(s.musicVol) && s.musicVol >= 0 && s.musicVol <= 10 ? s.musicVol : 4, // 音樂音量：0~10 段（0 = 關閉音樂）
});
export const settings = sanitizeSettings(Store.get(KEY_SET, {}) || {});
export const saveSettingsLocal = () => Store.set(KEY_SET, settings);          // 只寫本機（套用雲端資料時用）
export const saveSettings = () => { saveSettingsLocal(); if (Hooks.settings) Hooks.settings(); };   // 寫本機並通知雲端同步
export const effTheme = () => settings.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
export function applyTheme() {
  const r = document.documentElement;
  if (settings.theme) r.setAttribute('data-theme', settings.theme); else r.removeAttribute('data-theme');
}
