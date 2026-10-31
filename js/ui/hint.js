/* 關卡功能提示 —— 切換到「隨機挑戰」或「北斗 / 獵戶挑戰」時，讓玩家注意到該關卡最重要的按鈕：
 *   隨機挑戰 → 骰子按鈕高光 +「點擊可重抽拼圖組」；北斗 / 獵戶挑戰 → 星星按鈕高光 +「點擊切換拼圖組」。
 *   提示字樣是浮在按鈕上方的小標籤（掛在 <body>、用 fixed 定位，所以不會被標題列裁切；上方放不下時改放下方）。
 *   消除時機：點擊該按鈕、開始拖曳拼圖（見 interaction/drag.js 的 startDrag）、切換到沒有這顆按鈕的關卡。
 *   只在「玩家切換關卡」時出現（見 level-select.js），重新載入頁面或還原存檔不會出現。
 *   按鈕會因沉浸模式換位置、視窗大小改變，所以出現期間每個畫面影格都重新對位（只有一個元素，成本很小）。 */
import { t } from '../i18n/i18n.js';
import { state, curLevel } from '../state/state.js';
import { $ } from './dom.js';

const KINDS = {
  rnd: { btn: () => $('btnRandom'), key: 'hint.rnd', on: L => !!L.random },
  grp: { btn: () => $('btnGroup'),  key: 'hint.grp', on: L => !!L.groups },
};
const GAP = 10;     // 標籤與按鈕的間距（含箭頭）
const EDGE = 8;     // 標籤離視窗邊緣的最小距離

let kind = null, lv = null, raf = 0, hl = null, sat = 0, last = '';   // sat = 上方安全區（避開瀏海）；last = 上一次的位置，沒變就不重寫樣式
const tip = document.createElement('div');
tip.id = 'featTip'; tip.className = 'feat-tip'; tip.hidden = true; tip.setAttribute('role', 'status');
document.body.appendChild(tip);

function place() {
  raf = 0;
  if (!kind) return;
  const K = KINDS[kind], L = curLevel(), b = K.btn();
  if (state.level !== lv || !K.on(L) || !b || b.hidden || !b.getClientRects().length) { dismissHint(); return; }   // 關卡換了 / 按鈕不見了
  tip.hidden = false;
  const r = b.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth;
  const cx = r.left + r.width / 2;
  const left = Math.max(EDGE, Math.min(vw - EDGE - w, cx - w / 2));
  const above = r.top - GAP - h >= EDGE + sat;
  const top = Math.round(above ? r.top - GAP - h : r.bottom + GAP), lx = Math.round(left), ax = Math.round(Math.max(12, Math.min(w - 12, cx - left)));
  const sig = `${lx},${top},${ax},${above}`;
  if (sig !== last) {   // 位置沒變就不碰 DOM
    last = sig;
    tip.classList.toggle('below', !above);
    tip.style.left = lx + 'px'; tip.style.top = top + 'px';
    tip.style.setProperty('--arrow-x', ax + 'px');   // 箭頭永遠對準按鈕中心
  }
  raf = requestAnimationFrame(place);
}

function setText() { if (kind) tip.textContent = t(KINDS[kind].key); }

export function dismissHint() {
  if (hl) { hl.classList.remove('hl'); hl = null; }
  tip.hidden = true; kind = lv = null; last = '';
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
}

// 玩家切換到某關卡後呼叫：該關卡有對應按鈕就顯示提示，沒有就清掉上一個
export function showHint() {
  dismissHint();
  const L = curLevel(), k = Object.keys(KINDS).find(x => KINDS[x].on(L));
  if (!k) return;
  kind = k; lv = state.level; last = '';
  sat = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;   // 每次顯示讀一次即可
  hl = KINDS[k].btn(); hl.classList.add('hl');
  setText();
  raf = requestAnimationFrame(place);
}

// 點擊該按鈕就消除（用捕獲階段監聽，不受按鈕本身邏輯如「拖曳中不動作」影響）
['btnRandom', 'btnGroup'].forEach(id => $(id).addEventListener('click', dismissHint, true));
window.addEventListener('resize', () => { if (kind) sat = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0; });   // 旋轉螢幕後安全區可能改變
document.addEventListener('i18n', () => { setText(); });   // 切換語言時換成新語言的字樣
