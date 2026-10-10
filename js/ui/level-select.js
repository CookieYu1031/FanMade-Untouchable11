/* 切換關卡 */
import { state } from '../state/state.js';
import { els } from './dom.js';
import { refresh } from './render.js';

export function setLevel(lv) {
  state.level = lv; state.selected = null; state.chain = null;
  refresh();
}

els.levels.addEventListener('click', e => {
  const b = e.target.closest('[data-lv]'); if (b) setLevel(Number(b.dataset.lv));
});
