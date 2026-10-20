/* 隨機挑戰的代碼框與骰子（拼圖盤標題列、說明按鈕左側；沉浸模式移到圖板標題列）
 *   骰子：從 167,960 種組合裡隨機抽一組（不含與「危險貨物」相同的那組），代碼顯示在左邊的膠囊框裡，可以複製給其他玩家
 *   代碼框：輸入任意 4 個字（中英皆可）後按 Enter 或離開輸入框就會套用；輸入的字不會被改動，
 *           只在背後運算時才做防混淆轉換並映射回原代碼（規則見 js/core/random-code.js） */
import { t } from '../i18n/i18n.js';
import { charsOf, CODE_LEN } from '../core/random-code.js';
import { state, curLevel, curGroup, typedOf } from '../state/state.js';
import { $ } from './dom.js';
import { toast } from './toast.js';
import { refresh } from './render.js';

const input = $('rndInput'), dice = $('btnRandom');
const clean = s => charsOf(String(s).replace(/\s+/g, '')).slice(0, CODE_LEN).join('');   // 去掉空白、最多 4 個字（以字元計，不是 UTF-16 單位）

// 換成另一組拼圖：盤面、拼圖盤、解答冊跟著換（每一組的盤面各自保留）
function setCode(L, typed) {
  state.group[L.lv] = typed; state.selected = null; state.chain = null;
  refresh();
}
function canApply() { const L = curLevel(); return L.random && !state.drag ? L : null; }

// 套用輸入框裡的代碼；回傳 false = 字數不足（不套用）
function commit() {
  const L = canApply(); if (!L) return true;
  const v = clean(input.value);
  if (charsOf(v).length !== CODE_LEN) return false;
  input.value = v;
  if (v === typedOf(L)) return true;
  setCode(L, v);
  const canon = curGroup(L), up = v.toUpperCase();
  toast(up === canon ? t('rnd.loaded', canon) : t('rnd.mapped', up, canon));
  return true;
}
const revert = () => { const L = curLevel(); if (L.random) input.value = typedOf(L); };

let composing = false;   // 注音 / 拼音等輸入法組字中：先不要截斷
input.addEventListener('compositionstart', () => { composing = true; });
input.addEventListener('compositionend', () => { composing = false; const v = clean(input.value); if (v !== input.value) input.value = v; });
input.addEventListener('input', () => { if (composing) return; const v = clean(input.value); if (v !== input.value) input.value = v; });

// 點進輸入框就全選，方便直接複製或覆蓋輸入
let fresh = false;
input.addEventListener('focus', () => { fresh = true; const v = input.value; setTimeout(() => { if (input.value === v && document.activeElement === input) input.select(); }, 0); });   // 已經開始打字就不要再全選
input.addEventListener('mouseup', e => { if (fresh) { e.preventDefault(); fresh = false; } });
input.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) return;   // 輸入法選字用的 Enter 不處理
  if (e.key === 'Enter') {
    e.preventDefault();
    if (commit()) input.blur();
    else { toast(t('rnd.need4')); input.classList.remove('bad'); void input.offsetWidth; input.classList.add('bad'); }
  } else if (e.key === 'Escape') {
    e.stopPropagation(); revert(); input.blur();   // 先收掉輸入框，不要同時離開沉浸模式
  }
});
input.addEventListener('animationend', () => input.classList.remove('bad'));
input.addEventListener('blur', () => { if (!commit()) revert(); });

dice.addEventListener('click', () => {
  const L = canApply(); if (!L) return;
  let code; do { code = L.codec.rollCode(); } while (code === curGroup(L));   // 一定換成不同的一組
  setCode(L, code);
  toast(t('rnd.rolled', code));
  const svg = dice.querySelector('svg');
  svg.classList.remove('spin'); void svg.getBoundingClientRect(); svg.classList.add('spin');
  svg.addEventListener('animationend', () => svg.classList.remove('spin'), { once: true });
});
