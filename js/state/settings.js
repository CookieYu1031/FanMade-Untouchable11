/* 設定 —— 暱稱、語言、背景、獨立關卡開關、參與排行開關、近似解顯示、解答冊隱藏、音效 / 音樂音量（登入時會同步到雲端） */
import { Store, Hooks, KEY_SET } from '../storage/store.js';
import { normLang } from '../i18n/i18n.js';

// 把任意來源（本機存檔、雲端資料）整理成合法設定
export const sanitizeSettings = (s = {}) => ({
  nick: typeof s.nick === 'string' ? s.nick.slice(0, 20) : '',
  lang: normLang(s.lang),
  theme: s.theme === 'light' ? 'light' : 'dark', // 預設暗色
  extra: s.extra === true,   // 是否啟用獨立關卡（預設關閉）（大師挑戰、危險貨物）
  rank: s.rank === true,     // 是否參與排行（預設關閉）；關閉時不計分、不上榜、不上傳積分，並移除榜上的積分資料
  near: s.near === true,     // 統計：是否顯示近似解（更多資訊）
  hideBook: s.hideBook === true, // 解答冊：是否隱藏解答
  vol: Number.isInteger(s.vol) && s.vol >= 0 && s.vol <= 10 ? s.vol : 10, // 音效音量：0~10 段，每段 10%（預設 100%）
  musicVol: Number.isInteger(s.musicVol) && s.musicVol >= 0 && s.musicVol <= 10 ? s.musicVol : 5, // 音樂音量：0~10 段（0 = 關閉音樂；預設 50%）
});
export const settings = sanitizeSettings(Store.get(KEY_SET, {}) || {});
export const saveSettingsLocal = () => Store.set(KEY_SET, settings);          // 只寫本機（套用雲端資料時用）
export const saveSettings = () => { saveSettingsLocal(); if (Hooks.settings) Hooks.settings(); };   // 寫本機並通知雲端同步
export const effTheme = () => settings.theme;
export function applyTheme() {
  const r = document.documentElement;
  r.setAttribute('data-theme', settings.theme);
  // 瀏覽器網址列 / 狀態列顏色跟著主題（index.html 的 meta 原本只依系統深淺色，會和手動 / 預設的主題不一致）
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = settings.theme === 'dark' ? '#1B1D32' : '#F3F5FB'; });
}
