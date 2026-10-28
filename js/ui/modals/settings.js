/* 設定視窗：暱稱、語言、音樂 / 音效音量、背景、額外關卡、參與排行（帳戶與重置資料在各自的模組） */
import { t, setLang, applyI18n } from '../../i18n/i18n.js';
import { Sfx } from '../../audio/sfx.js';
import { Music } from '../../audio/music.js';
import { settings, saveSettings, saveSettingsLocal, applyTheme } from '../../state/settings.js';
import { curLevel } from '../../state/state.js';
import { $ } from '../dom.js';
import { refresh } from '../render.js';
import { renderLevels } from '../render-levels.js';
import { renderBook } from '../render-book.js';
import { setLevel } from '../level-select.js';
import { renderSettings, renderVol } from './settings-view.js';
import { initLangPicker } from './lang-picker.js';

const setModal = $('setModal');
// 問題回報：手機 / 平板用 mailto（交給裝置預設的郵件程式）；桌機不呼叫系統郵件程式，改在新分頁開 Gmail 網頁版寫信。主旨依目前語言，換語言時一併更新
const REPORT_MAIL = '830601ryan2@gmail.com';
const reportLink = $('setReport');
// 優先用 User-Agent Client Hints 的 mobile 旗標；不支援的瀏覽器（Safari / Firefox）才退回字串判斷
const isDesktop = () => {
  const uaMobile = navigator.userAgentData && navigator.userAgentData.mobile;
  const mobile = typeof uaMobile === 'boolean' ? uaMobile
    : /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);   // iPadOS 會偽裝成 Mac
  return !mobile && matchMedia('(pointer:fine)').matches;
};
const syncReportLink = () => {
  const su = encodeURIComponent(t('set.reportSubject'));
  if (isDesktop()) {
    reportLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(REPORT_MAIL)}&su=${su}`;
    reportLink.target = '_blank'; reportLink.rel = 'noopener noreferrer';
  } else {
    reportLink.href = `mailto:${REPORT_MAIL}?subject=${su}`;
    reportLink.removeAttribute('target'); reportLink.removeAttribute('rel');
  }
};
document.addEventListener('i18n', syncReportLink);
syncReportLink();
$('swExtra').addEventListener('click', () => {
  settings.extra = !settings.extra; saveSettings();
  if (!settings.extra && curLevel().extra) setLevel(8); else renderLevels();   // 關閉時若停在額外難度就回到 Lv8
  renderSettings();
});
// 參與排行：關閉 → 不計分 / 不上榜，並立刻移除榜上已上傳的積分資料（排行榜按鈕一併隱藏）；重新開啟 → 當下重新計算並上傳
$('swRank').addEventListener('click', () => {
  settings.rank = !settings.rank; saveSettings();
  renderSettings(); renderBook();   // renderBook 會依設定顯示 / 隱藏排行榜按鈕
  // 登入時：參與排行屬於主動同步，立刻與設定一起同步（關閉 → 刪除榜上資料；重新開啟 → 重新計算並上傳），見 js/cloud/sync.js
});
$('btnSettings').addEventListener('click', () => { renderSettings(); setModal.classList.add('open'); });
$('setClose').addEventListener('click', () => setModal.classList.remove('open'));
setModal.addEventListener('click', e => { if (e.target === setModal) setModal.classList.remove('open'); });
// 暱稱：輸入中只存本機；輸入完成（離開輸入框 / 按 Enter）才同步，暱稱變更屬於主動同步，不會每打一個字就送出一次
$('nickInput').addEventListener('input', e => { settings.nick = e.target.value.trim().slice(0, 20); saveSettingsLocal(); });
$('nickInput').addEventListener('change', () => saveSettings());
initLangPicker(lang => {   // 語言選單（國旗 + 語言）選了新語言
  settings.lang = lang; setLang(settings.lang); saveSettings();
  applyI18n(); refresh(); renderSettings();
});
$('segTheme').addEventListener('click', e => {
  const b = e.target.closest('[data-theme]'); if (!b) return;
  settings.theme = b.dataset.theme; saveSettings(); applyTheme(); renderSettings();
});
$('volRange').addEventListener('input', e => { settings.vol = Number(e.target.value); saveSettings(); renderVol(); });
$('musicRange').addEventListener('input', e => { settings.musicVol = Number(e.target.value); saveSettings(); renderVol(); Music.sync(); });   // 音樂音量（0 = 關閉）
$('volRange').addEventListener('change', () => Sfx.click());   // 放開時播一聲，讓人聽到目前音量
