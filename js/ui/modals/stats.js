/* 各關卡收錄進度表（正解 / 近似解） */
import { t } from '../../i18n/i18n.js';
import { LEVELS, LV_COLORS, LV_INK } from '../../core/config.js';
import { loadBook } from '../../storage/book.js';
import { settings } from '../../state/settings.js';
import { state, lvTag, nearTotal } from '../../state/state.js';
import { $ } from '../dom.js';

function fmtPct(n, total) {   // 無條件捨去到小數點後 2 位；不足 0.01% 顯示 0.00%
  const v = Math.min(100, n / total * 100);
  return (Math.floor(v * 100 + 1e-9) / 100).toFixed(2) + '%';
}
export function renderStats() {
  const book = loadBook(), near = !!state.statNear;
  const head = `<thead><tr><th>${t('stat.lv')}</th><th>${t('stat.total')}</th><th>${t('stat.got')}</th><th>${t('stat.progress')}</th></tr></thead>`;
  const tag = L => { const c = LV_COLORS[L.lv - 1]; return `<td><span class="lvtag" style="background:${c};color:${LV_INK[L.lv - 1]}">${lvTag(L)}</span></td>`; };
  let rows;
  if (near) {   // 近似解統計：只有 Lv8、危險貨物（獨立關卡需開啟額外難度）
    rows = LEVELS.filter(L => L.near && (!L.extra || settings.extra)).map(L => {
      const tot = nearTotal(L), got = ((book.near || {})[L.lv] || []).length;
      if (tot == null) // 實際組數未知：只顯示收錄數，沒有進度條與 %
        return `<tr style="--c:${LV_COLORS[L.lv - 1]}">${tag(L)}<td>—</td><td>${got.toLocaleString()}</td><td><div class="pg"><span class="pct">—</span></div></td></tr>`;
      const n = Math.min(got, tot);
      return `<tr style="--c:${LV_COLORS[L.lv - 1]}">${tag(L)}<td>${tot.toLocaleString()}</td><td>${n.toLocaleString()}</td>`
        + `<td><div class="pg"><div class="pbar"><i style="width:${n / tot * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div><span class="pct">${fmtPct(n, tot)}</span></div></td></tr>`;
    }).join('');
  } else {      // 正解統計：額外難度開啟時也包含大師挑戰、危險貨物
    rows = LEVELS.filter(L => !L.extra || settings.extra).map(L => {
      const got = (book.levels[L.lv] || []).length;
      const n = L.total == null ? got : Math.min(got, L.total);
      const prog = L.total == null ? '<span class="pct">—</span>'     // 總組數未知：只顯示收錄數
        : L.lv <= 6
        ? `<div class="pbar"><i style="width:${n / L.total * 100}%${n > 0 ? ';min-width:3px' : ''}"></i></div><span class="pct">${fmtPct(n, L.total)}</span>`
        : `<div class="dots">${Array.from({ length: L.total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
      return `<tr style="--c:${LV_COLORS[L.lv - 1]}">${tag(L)}<td>${L.total == null ? '—' : L.total.toLocaleString()}</td><td>${n.toLocaleString()}</td><td><div class="pg">${prog}</div></td></tr>`;
    }).join('');
  }
  $('statTable').innerHTML = `${head}<tbody>${rows}</tbody>`;
  $('statTitle').textContent = t(near ? 'stat.near' : 'stat.title');
  const sw = $('statSwitch');   // 「⇄」切換正解／近似解
  sw.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/></svg>';
  sw.title = t(near ? 'tip.statExact' : 'tip.statNear'); sw.setAttribute('aria-label', sw.title);
  sw.setAttribute('aria-pressed', String(near));
}
const statModal = $('statModal');
$('btnStats').addEventListener('click', () => { state.statNear = false; renderStats(); statModal.classList.add('open'); });
$('statSwitch').addEventListener('click', () => { state.statNear = !state.statNear; renderStats(); });
$('statClose').addEventListener('click', () => statModal.classList.remove('open'));
statModal.addEventListener('click', e => { if (e.target === statModal) statModal.classList.remove('open'); });
