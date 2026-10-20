/* 同步進行時的提示：頁首「設定」按鈕的齒輪暫時換成同步符號、底色變藍（樣式見 css/components.css 的 .syncing）
 *   同步開始就顯示；同步很快結束時仍至少維持 HOLD（3 秒），之後復原；同步超過 3 秒則持續到結束。
 *   登入 / 開啟網頁時的那次同步不顯示（cloud.quiet，見 js/cloud/sync.js 的 onUser）。 */
import { onCloud, cloud } from '../cloud/sync.js';
import { $ } from './dom.js';

const HOLD = 3000, btn = $('btnSettings');
let shownAt = 0, hideTimer = null;
onCloud(() => {
  if (cloud.status === 'syncing') {
    if (cloud.quiet) return;
    clearTimeout(hideTimer); hideTimer = null;
    if (!btn.classList.contains('syncing')) { btn.classList.add('syncing'); shownAt = Date.now(); }
  } else if (btn.classList.contains('syncing') && !hideTimer) {
    hideTimer = setTimeout(() => { btn.classList.remove('syncing'); hideTimer = null; }, Math.max(0, shownAt + HOLD - Date.now()));
  }
});
