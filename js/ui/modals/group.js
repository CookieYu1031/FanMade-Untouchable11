/* 「星圖」視窗：摘星挑戰（摘星:北斗 / 摘星:獵戶）每關有 7 組拼圖組合，每組對應星座裡的一顆星（內部代號：北斗 A~G、獵戶 a~g），每組都有 1 組唯一解。
 *   在拼圖盤標題列的星星按鈕開啟；視窗是一片星空，七顆灰色星星依星座位置排列，名字顯示在星的右側。
 *   點星星 = 選擇那一組拼圖組合；已解出唯一解的組合，星星點亮（金色）；相鄰的兩顆星都點亮時，依星座設定（levels.json 的 sky.lines）連線。
 *   目前使用的組合有外圈標示。切換組合時，每一組的盤面與「返回上一步」紀錄各自保留（見 state.js 的 boardKey）。
 *   視窗大小固定（星空區的長寬比一定），北斗與獵戶的視窗大小一致。 */
import { t } from '../../i18n/i18n.js';
import { loadBook } from '../../storage/book.js';
import { state, curLevel, curGroup, solvedGroups, skyLabel } from '../../state/state.js';
import { getLang } from '../../i18n/i18n.js';
import { $, escapeHtml } from '../dom.js';
import { refresh } from '../render.js';
import { STAR } from '../svg.js';

const groupModal = $('groupModal');
const SKY_W = 100, SKY_H = 62;   // 星空座標系（與 levels.json 的 sky 一致）

// 背景的小星點：以關卡編號當亂數種子，同一關每次開啟位置都一樣（不影響遊戲，只是裝飾）
function dust(seed) {
  let a = Math.round(seed * 100) + 7;
  const rnd = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: 46 }, () => `<circle cx="${(rnd() * SKY_W).toFixed(1)}" cy="${(rnd() * SKY_H).toFixed(1)}" r="${(0.12 + rnd() * 0.28).toFixed(2)}" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`).join('');
}

function renderGroups() {
  const L = curLevel(), cur = curGroup(L), done = solvedGroups(L, loadBook().levels[L.lv] || []);
  const st = L.sky.stars, pct = (v, max) => (v / max * 100).toFixed(2) + '%';
  // 連線：兩端的星都點亮才畫（連線只會是星座本來的線，見 sky.lines）
  const lines = (L.sky.lines || []).filter(([a, b]) => done.has(a) && done.has(b))
    .map(([a, b]) => `<line x1="${st[a][0]}" y1="${st[a][1]}" x2="${st[b][0]}" y2="${st[b][1]}"/>`).join('');
  const stars = L.groups.map(g => {
    const ok = done.has(g.key), on = g.key === cur, name = escapeHtml(skyLabel(g.key));
    return `<button type="button" class="sk${ok ? ' lit' : ''}${on ? ' on' : ''}" data-g="${g.key}" style="left:${pct(st[g.key][0], SKY_W)};top:${pct(st[g.key][1], SKY_H)}"`
      + ` aria-pressed="${on}" aria-label="${name}${ok ? '　' + t('grp.solved') : ''}" title="${name}${ok ? '　' + t('grp.solved') : ''}">${STAR}<span class="sn">${name}</span></button>`;
  }).join('');
  $('groupBody').innerHTML = `<div class="sky">`
    + `<svg class="sky-bg" viewBox="0 0 ${SKY_W} ${SKY_H}" preserveAspectRatio="none" aria-hidden="true"><g class="dust">${dust(L.lv)}</g><g class="links">${lines}</g></svg>`
    + `<div class="sky-cap"><span>${escapeHtml(L.sky.title[getLang()] || L.sky.title.zh)}</span><b>${done.size} / ${L.groups.length}</b></div>${stars}</div>`;
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
