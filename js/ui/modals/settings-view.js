/* 設定視窗的畫面同步（語言、背景、獨立關卡開關、音量） */
import { getLang } from '../../i18n/i18n.js';
import { settings, effTheme } from '../../state/settings.js';
import { $ } from '../dom.js';

export function renderSettings() {
  $('nickInput').value = settings.nick;
  $('selLang').value = getLang();
  const eff = effTheme();
  document.querySelectorAll('#segTheme button').forEach(b => b.classList.toggle('on', b.dataset.theme === eff));
  $('swExtra').setAttribute('aria-checked', String(!!settings.extra));
  renderVol();
}
export function renderVol() {
  const tk = $('volTicks');
  if (!tk.children.length) tk.innerHTML = Array.from({ length: 11 }, (_, i) => '<span></span>').join('');
  [...tk.children].forEach((el, i) => el.classList.toggle('on', i === settings.vol));
  const r = $('volRange');
  r.value = settings.vol;
  r.style.setProperty('--fill', `calc(9px + (100% - 18px) * ${settings.vol / 10})`);
  r.setAttribute('aria-valuetext', settings.vol * 10 + '%');
  $('volNum').textContent = settings.vol * 10 + '%';
}
