/* 設定視窗：暱稱、語言、背景、音量、資料匯出 / 匯入 */
import { t, setLang, applyI18n } from '../../i18n/i18n.js';
import { Sfx } from '../../audio/sfx.js';
import { exportJSON, importJSON } from '../../io/data-io.js';
import { settings, saveSettings, applyTheme } from '../../state/settings.js';
import { curLevel } from '../../state/state.js';
import { $ } from '../dom.js';
import { refresh } from '../render.js';
import { renderLevels } from '../render-levels.js';
import { setLevel } from '../level-select.js';
import { renderSettings, renderVol } from './settings-view.js';

const setModal = $('setModal'), dataText = $('dataText'), dataMsg = $('dataMsg');
let genText = '';
const regenExport = () => { genText = exportJSON(); dataText.value = genText; };
$('swExtra').addEventListener('click', () => {
  settings.extra = !settings.extra; saveSettings();
  if (!settings.extra && curLevel().extra) setLevel(8); else renderLevels();   // 關閉時若停在額外難度就回到 Lv8
  renderSettings(); regenExport();
});
$('btnSettings').addEventListener('click', () => {
  renderSettings(); regenExport(); dataMsg.textContent = t('data.gen'); setModal.classList.add('open');
});
$('setClose').addEventListener('click', () => setModal.classList.remove('open'));
setModal.addEventListener('click', e => { if (e.target === setModal) setModal.classList.remove('open'); });
$('nickInput').addEventListener('input', e => {
  settings.nick = e.target.value.trim().slice(0, 20); saveSettings(); regenExport();
});
$('segLang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]'); if (!b) return;
  settings.lang = b.dataset.lang; setLang(settings.lang); saveSettings();
  applyI18n(); refresh(); renderSettings(); regenExport(); dataMsg.textContent = t('data.gen');
});
$('segTheme').addEventListener('click', e => {
  const b = e.target.closest('[data-theme]'); if (!b) return;
  settings.theme = b.dataset.theme; saveSettings(); applyTheme(); renderSettings(); regenExport();
});
$('dataDownload').addEventListener('click', () => {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dataText.value], { type:'application/json' }));
    a.download = 'untouchable11-data.json';
    a.click();
    dataMsg.textContent = t('data.dlHint');
  } catch (e) { dataMsg.textContent = t('data.dlFail'); }
});
// 從檔案匯入：選好檔案就直接匯入
$('dataPick').addEventListener('click', () => $('dataFile').click());
$('dataFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { dataMsg.textContent = importJSON(String(r.result)); regenExport(); };
  r.readAsText(f);
  e.target.value = ''; // 讓同一個檔案可以再選一次
});
$('volRange').addEventListener('input', e => {
  settings.vol = Number(e.target.value); saveSettings(); renderVol(); regenExport();
});
$('volRange').addEventListener('change', () => Sfx.click());   // 放開時播一聲，讓人聽到目前音量
