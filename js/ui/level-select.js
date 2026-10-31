/* 切換關卡 */
import { state } from '../state/state.js';
import { els } from './dom.js';
import { refresh } from './render.js';
import { showHint } from './hint.js';

export function setLevel(lv) {
  const changed = lv !== state.level;
  state.level = lv; state.selected = null; state.chain = null;
  refresh();
  if (changed) showHint();   // 切換到隨機 / 北斗 / 獵戶挑戰：骰子 / 星星按鈕高光 + 提示字樣（見 hint.js）
}

els.levels.addEventListener('click', e => {
  const b = e.target.closest('[data-lv]'); if (b) setLevel(Number(b.dataset.lv));
});
