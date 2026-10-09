/* 按鈕點擊音效（旋轉 / 鏡像 / 收回按鈕、音量控制各有自己的音效，這裡略過） */
import { Sfx } from './sfx.js';

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.hasAttribute('data-nosound') || b.dataset.act) return;
  Sfx.click();
}, true);
