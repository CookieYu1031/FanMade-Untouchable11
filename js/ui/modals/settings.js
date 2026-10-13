/* 設定視窗：暱稱、語言、音樂 / 音效音量、背景、額外關卡（帳戶與重置資料在各自的模組） */
import { setLang, applyI18n } from '../../i18n/i18n.js';
import { Sfx } from '../../audio/sfx.js';
import { Music } from '../../audio/music.js';
import { settings, saveSettings, applyTheme } from '../../state/settings.js';
import { curLevel } from '../../state/state.js';
import { $ } from '../dom.js';
import { refresh } from '../render.js';
import { renderLevels } from '../render-levels.js';
import { setLevel } from '../level-select.js';
import { renderSettings, renderVol } from './settings-view.js';

const setModal = $('setModal');
$('swExtra').addEventListener('click', () => {
  settings.extra = !settings.extra; saveSettings();
  if (!settings.extra && curLevel().extra) setLevel(8); else renderLevels();   // 關閉時若停在額外難度就回到 Lv8
  renderSettings();
});
$('btnSettings').addEventListener('click', () => { renderSettings(); setModal.classList.add('open'); });
$('setClose').addEventListener('click', () => setModal.classList.remove('open'));
setModal.addEventListener('click', e => { if (e.target === setModal) setModal.classList.remove('open'); });
$('nickInput').addEventListener('input', e => { settings.nick = e.target.value.trim().slice(0, 20); saveSettings(); });
$('selLang').addEventListener('change', e => {
  settings.lang = e.target.value; setLang(settings.lang); saveSettings();
  applyI18n(); refresh(); renderSettings();
});
$('segTheme').addEventListener('click', e => {
  const b = e.target.closest('[data-theme]'); if (!b) return;
  settings.theme = b.dataset.theme; saveSettings(); applyTheme(); renderSettings();
});
$('volRange').addEventListener('input', e => { settings.vol = Number(e.target.value); saveSettings(); renderVol(); });
$('musicRange').addEventListener('input', e => { settings.musicVol = Number(e.target.value); saveSettings(); renderVol(); Music.sync(); });   // 音樂音量（0 = 關閉）
$('volRange').addEventListener('change', () => Sfx.click());   // 放開時播一聲，讓人聽到目前音量
