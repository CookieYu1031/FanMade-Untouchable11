/* 按鈕點擊音效（旋轉工具列、重置圖版、音量控制各有自己的音效，這裡略過） */
import { Sfx } from './sfx.js';

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.hasAttribute('data-nosound') || b.closest('#pieceTools')) return;
  Sfx.click();
}, true);
