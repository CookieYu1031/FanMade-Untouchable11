/* 關卡選擇列（Lv1~8 一列；大師挑戰、危險貨物另起一列）與頁首標題 */
import { LEVELS, LV_COLORS, LV_INK } from '../core/config.js';
import { settings } from '../state/settings.js';
import { state, curLevel, lvName, gameTitle } from '../state/state.js';
import { $, els } from './dom.js';

export function renderLevels() {
  const root = document.documentElement, cur = curLevel();
  root.style.setProperty('--lvc', LV_COLORS[state.level - 1]);
  root.style.setProperty('--lvink', LV_INK[state.level - 1]);
  root.toggleAttribute('data-series', !!cur.extra);
  $('btnSpecial').hidden = !cur.extra;   // 獨立關卡才有「特殊」說明按鈕
  $('heroTitle').textContent = gameTitle(cur); document.title = gameTitle(cur);   // 額外難度會換標題
  const btn = l => `<button class="lv${l.lv === state.level ? ' on' : ''}" data-lv="${l.lv}" style="--c:${LV_COLORS[l.lv - 1]};color:${LV_INK[l.lv - 1]}">`
    + (l.extra ? `<b>${lvName(l)}</b>` : `<b>Lv${l.lv}</b><small>${lvName(l)}</small>`) + `</button>`;
  const main = LEVELS.filter(l => !l.extra).map(btn).join('');
  const ext = settings.extra ? LEVELS.filter(l => l.extra).map(btn).join('') : '';   // 獨立關卡另起一行
  els.levels.innerHTML = `<div class="lvrow">${main}</div>` + (ext ? `<div class="lvrow ext">${ext}</div>` : '');
}
