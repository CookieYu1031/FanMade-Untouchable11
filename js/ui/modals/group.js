/* 「拼圖組合」視窗：皇冠挑戰有 14 種拼圖組合（11 片：A~G、12 片：a~g），每種都有 1 組唯一解。
 *   在拼圖盤標題列的按鈕開啟；已解出唯一解的組合按鈕是黃底、字母換成皇冠；目前使用的組合有外框。
 *   切換組合時，每一組的盤面與「返回上一步」紀錄各自保留（見 state.js 的 boardKey）。 */
import { t } from '../../i18n/i18n.js';
import { loadBook } from '../../storage/book.js';
import { state, curLevel, curGroup, solvedGroups } from '../../state/state.js';
import { $ } from '../dom.js';
import { refresh } from '../render.js';
import { CROWN } from '../svg.js';

const groupModal = $('groupModal');

function renderGroups() {
  const L = curLevel(), cur = curGroup(L), done = solvedGroups(L, loadBook().levels[L.lv] || []);
  const sizes = [...new Set(L.groups.map(g => g.ids.length))];   // 每組幾片拼圖（11、12），各一排
  $('groupBody').innerHTML = sizes.map(n =>
    `<div class="grow"><span class="gn">${n}</span><div class="gbtns">`
    + L.groups.filter(g => g.ids.length === n).map(g => {
      const ok = done.has(g.key);
      return `<button type="button" class="gbtn${g.key === cur ? ' on' : ''}${ok ? ' done' : ''}" data-g="${g.key}" aria-pressed="${g.key === cur}" aria-label="${t('grp.tag', g.key)}" title="${t('grp.tag', g.key)}${ok ? '　' + t('grp.solved') : ''}">${ok ? CROWN : g.key}</button>`;
    }).join('')
    + `</div></div>`).join('<hr class="gsep">');
}

$('btnGroup').addEventListener('click', () => {
  if (state.drag || !curLevel().groups) return;
  renderGroups(); groupModal.classList.add('open');
});
$('groupBody').addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); if (!b) return;
  const L = curLevel();
  if (b.dataset.g !== curGroup(L)) {
    state.group[L.lv] = b.dataset.g; state.selected = null; state.chain = null;
    refresh();   // 重畫底板、拼圖盤（拼圖片數 / 大小會變）、解答冊
  }
  groupModal.classList.remove('open');
});
$('groupClose').addEventListener('click', () => groupModal.classList.remove('open'));
groupModal.addEventListener('click', e => { if (e.target === groupModal) groupModal.classList.remove('open'); });
