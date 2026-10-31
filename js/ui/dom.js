/* DOM 取用 */

export const $ = id => document.getElementById(id);
// 要放進 innerHTML 的玩家輸入（隨機挑戰的代碼可以是任意 4 個字）一律先跳脫
export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
// 由右至左的語言（希伯來文 / 阿拉伯文）：版面左右對調，「上一頁」按鈕在右邊、「下一頁」在左邊
export const isRtl = () => document.documentElement.dir === 'rtl';
// 翻頁方向：← 或 A = -1（上一頁）、→ 或 D = +1（下一頁）；其他按鍵（或正在輸入文字、按著 Ctrl / Alt 時）= 0
// 由右至左的語言：方向鍵跟著按鈕位置對調（← = 下一頁、→ = 上一頁）；A / D 是旋轉拼圖的快捷鍵，不受影響
export const pageDir = e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(TEXTAREA|INPUT)$/.test(e.target && e.target.tagName)) return 0;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === 'ArrowLeft') return isRtl() ? 1 : -1;
  if (k === 'ArrowRight') return isRtl() ? -1 : 1;
  return k === 'a' ? -1 : k === 'd' ? 1 : 0;
};
export const els = {
  board: $('board'), gGrid: $('gGrid'), gPieces: $('gPieces'), gPreview: $('gPreview'), gOverlay: $('gOverlay'),
  wrap: $('boardWrap'), tray: $('tray'), title: $('levelTitle'),
  levels: $('levels'), bookInfo: $('bookInfo'), bookThumbs: $('bookThumbs'), toast: $('toast'), tools: $('pieceTools'),
};
