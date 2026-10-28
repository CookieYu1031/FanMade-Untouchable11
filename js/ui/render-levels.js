/* 關卡選擇列（Lv1~8 一列；額外關卡接在後面）與頁首標題 */
import { LEVEL_ORDER, LV_COLORS, LV_INK } from '../core/config.js';
import { settings } from '../state/settings.js';
import { state, curLevel, lvName, gameTitle, typedOf } from '../state/state.js';
import { $, els } from './dom.js';

// 頁首標題：預設單行；若標題（含自動換行後）壓到右下角的「規則與資訊 / 設定」按鈕，
// 就在冒號後換行（如「Untouchable 11:」/「Master Challenge」）。沒有冒號的標題維持原樣。

// 排好某個標題（預設單行；壓到按鈕才換行）
function layoutTitle(h, acts, title) {
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
// 標題欄高度統一：把所有（可切換到的）關卡標題各排一次，取最高的當作最小高度，切換關卡時標題欄就不會跳動
export function fitHeroTitle() {
  const L = curLevel();
  if (!L) return;   // 設定檔尚未載入完成（字型載入或視窗縮放事件可能早於 boot）
  const h = $('heroTitle'), hero = h.parentElement, acts = document.querySelector('.hero-acts');
  hero.style.minHeight = '';
  let max = 0;
  const root = document.documentElement, lv0 = root.dataset.lv;
  LEVEL_ORDER.filter(l => l === L || !l.extra || settings.extra).forEach(l => {
    root.dataset.lv = l.lv;   // 有些關卡的標題有專屬樣式（見 css/hero.css 的 data-lv），量測時要套用
    layoutTitle(h, acts, gameTitle(l)); max = Math.max(max, hero.offsetHeight);
  });
  root.dataset.lv = lv0;
  layoutTitle(h, acts, gameTitle(L));
  hero.style.minHeight = max + 'px';
}
window.addEventListener('resize', () => fitHeroTitle());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitHeroTitle());

export function renderLevels() {
  const root = document.documentElement, cur = curLevel();
  root.style.setProperty('--lvc', LV_COLORS[state.level]);
  root.style.setProperty('--lvink', LV_INK[state.level]);
  root.toggleAttribute('data-series', !!cur.extra);
  root.dataset.lv = cur.lv;   // 讓 CSS 能針對個別關卡微調（例如標題較長的危險貨物2）
  $('btnSpecial').hidden = !cur.extra;   // 獨立關卡才有「關卡資訊」按鈕（在圖板標題列）
  $('btnGroup').hidden = !cur.groups;    // 有拼圖組合的關卡（摘星挑戰）才有「星圖」按鈕（在拼圖盤標題列）
  $('rndBox').hidden = !cur.random;      // 隨機挑戰才有「代碼框 + 骰子」（在拼圖盤標題列、說明按鈕左側）
  if (cur.random && document.activeElement !== $('rndInput')) $('rndInput').value = typedOf(cur);   // 輸入框顯示玩家輸入（或骰子抽出）的代碼；正在輸入時不去動它
  fitHeroTitle();   // 分頁標題（<title>）固定為「Untouchable 11」，只有頁首標題欄會隨關卡改變
  const btn = l => `<button class="lv${l.lv === state.level ? ' on' : ''}" data-lv="${l.lv}" style="--c:${LV_COLORS[l.lv]};color:${LV_INK[l.lv]}">`
    + (l.extra ? `<b>${lvName(l)}</b>` : `<b>Lv${l.lv}</b><small>${lvName(l)}</small>`) + `</button>`;
  // 全部關卡放在同一個格線裡（大視窗每行 8 格、小視窗每行 4 格，見 css/levels.css），依 levels.json 的 order 排列（lv 是存檔編號，不一定等於顯示順序）
  els.levels.innerHTML = LEVEL_ORDER.filter(l => !l.extra || settings.extra).map(btn).join('');
}
