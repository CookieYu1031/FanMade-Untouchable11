/* 「關卡資訊」視窗：獨立關卡（大師挑戰、危險貨物）的名稱與簡介 */
import { t } from '../../i18n/i18n.js';
import { curLevel } from '../../state/state.js';
import { $ } from '../dom.js';

function renderSpecial() {
  const L = curLevel();
  if (!L.extra) return false;
  $('specialBody').innerHTML = `<section class="hsec"><h3>${t('sp.desc.h' + L.lv)}</h3><div>${t('sp.desc.' + L.lv)}</div></section>`;
  return true;
}
const specialModal = $('specialModal');
$('btnSpecial').addEventListener('click', () => { if (renderSpecial()) specialModal.classList.add('open'); });
$('specialClose').addEventListener('click', () => specialModal.classList.remove('open'));
specialModal.addEventListener('click', e => { if (e.target === specialModal) specialModal.classList.remove('open'); });
