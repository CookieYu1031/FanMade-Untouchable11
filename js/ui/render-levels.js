/* 關卡選擇列（Lv1~8 一列；大師挑戰、危險貨物另起一列）與頁首標題 */
import { LEVELS, LV_COLORS, LV_INK } from '../core/config.js';
import { settings } from '../state/settings.js';
import { state, curLevel, lvName, gameTitle } from '../state/state.js';
import { $, els } from './dom.js';

// 頁首標題：預設單行；若標題（含自動換行後）壓到右下角的「規則與資訊 / 設定」按鈕，
// 就在冒號後換行（如「Untouchable 11:」/「Master Challenge」）。沒有冒號的標題維持原樣。
export function fitHeroTitle() {
  const h = $('heroTitle'), acts = document.querySelector('.hero-acts'), title = gameTitle(curLevel());
  const i = title.indexOf(': ');
  h.classList.remove('split');
  if (i < 0) { h.textContent = title; return; }
  h.textContent = '';
  const a = document.createElement('span'), b = document.createElement('span');
  a.textContent = title.slice(0, i + 1); b.textContent = title.slice(i + 2); b.className = 't2';
  h.append(a, ' ', b);
  const hit = () => {   // 以文字實際佔用的每一行矩形，檢查有沒有碰到按鈕區（留 6px 間隙）
    const r = document.createRange(); r.selectNodeContents(h);
    const k = acts.getBoundingClientRect(), m = 6;
    return [...r.getClientRects()].some(q => q.width > 0 && q.left < k.right + m && q.right > k.left - m && q.top < k.bottom + m && q.bottom > k.top - m);
  };
  if (hit()) h.classList.add('split');
}
window.addEventListener('resize', () => fitHeroTitle());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitHeroTitle());

export function renderLevels() {
  const root = document.documentElement, cur = curLevel();
  root.style.setProperty('--lvc', LV_COLORS[state.level - 1]);
  root.style.setProperty('--lvink', LV_INK[state.level - 1]);
  root.toggleAttribute('data-series', !!cur.extra);
  root.dataset.lv = cur.lv;   // 讓 CSS 能針對個別關卡微調（例如標題較長的危險貨物2）
  $('btnSpecial').hidden = !cur.extra;   // 獨立關卡才有「關卡資訊」按鈕（在圖板標題列）
  fitHeroTitle(); document.title = gameTitle(cur);   // 額外難度會換標題
  const btn = l => `<button class="lv${l.lv === state.level ? ' on' : ''}" data-lv="${l.lv}" style="--c:${LV_COLORS[l.lv - 1]};color:${LV_INK[l.lv - 1]}">`
    + (l.extra ? `<b>${lvName(l)}</b>` : `<b>Lv${l.lv}</b><small>${lvName(l)}</small>`) + `</button>`;
  const main = LEVELS.filter(l => !l.extra).map(btn).join('');
  const ext = settings.extra ? LEVELS.filter(l => l.extra).map(btn).join('') : '';   // 獨立關卡另起一行
  els.levels.innerHTML = `<div class="lvrow">${main}</div>` + (ext ? `<div class="lvrow ext">${ext}</div>` : '');
}
