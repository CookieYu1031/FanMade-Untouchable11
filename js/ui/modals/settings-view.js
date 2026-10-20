/* 設定視窗的畫面同步（語言、背景、獨立關卡開關、音樂 / 音效音量） */
import { getLang } from '../../i18n/i18n.js';
import { settings, effTheme } from '../../state/settings.js';
import { $ } from '../dom.js';

export function renderSettings() {
  $('nickInput').value = settings.nick;
  $('selLang').value = getLang();
  const eff = effTheme();
  document.querySelectorAll('#segTheme button').forEach(b => b.classList.toggle('on', b.dataset.theme === eff));
  $('swExtra').setAttribute('aria-checked', String(!!settings.extra));
  $('swRank').setAttribute('aria-checked', String(!!settings.rank));
  renderVol();
}
// 兩條音量滑桿（音樂 / 音效）共用的畫面同步：0~10 段，每段 10%
function renderSlider(prefix, range, val) {
  const r = $(range);
  r.value = val;
  r.style.setProperty('--fill', `calc(9px + (100% - 18px) * ${val / 10})`);
  r.setAttribute('aria-valuetext', val * 10 + '%');
  $(prefix + 'Num').textContent = val * 10 + '%';
}
export function renderVol() {
  renderSlider('vol', 'volRange', settings.vol);             // 音效
  renderSlider('music', 'musicRange', settings.musicVol);    // 音樂
}
