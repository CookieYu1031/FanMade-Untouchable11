/* SVG 字串產生器：拼圖（拼圖盤、拖曳殘影共用）與方塊 */
import { cellsOf } from '../core/matrix.js';

// 產生一片拼圖的 SVG 字串（拼圖盤、頁首、拖曳殘影共用）
export function miniSVG(matrix, px, pal) {
  const h = matrix.length, w = matrix[0].length;
  const rects = cellsOf(matrix).map(([x, y]) =>
    `<rect x="${x + .04}" y="${y + .04}" width=".92" height=".92" rx=".14" fill="${pal.fill}" stroke="${pal.edge}" stroke-width=".06"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" aria-hidden="true">${rects}</svg>`;
}

// 把一組格座標畫成方塊（opts 控制透明度與選取樣式）
export function cellRects(cells, pal, opacity) {
  return cells.map(([x, y]) =>
    `<rect x="${x + .04}" y="${y + .04}" width=".92" height=".92" rx=".14" fill="${pal.fill}" stroke="${pal.edge}" stroke-width=".06"${opacity ? ` opacity="${opacity}"` : ''}/>`).join('');
}

// 星星符號（摘星挑戰：每解出一組拼圖組合就點亮一顆；顏色見 css/group.css 的 .stars）
export const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" stroke-linejoin="round"/></svg>';

// 同步符號（雲朵 + 向上箭頭）：設定頁的手動同步按鈕、同步進行時的設定按鈕共用（index.html 內也有一份相同的路徑）
export const SYNC_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 19.5a4.5 4.5 0 0 1-.7-8.95 6.2 6.2 0 0 1 11.7-1.1A4.8 4.8 0 0 1 17.5 19.5z"/><path d="M12 16.5v-5.5"/><path d="M9.5 13.3 12 10.8l2.5 2.5"/></svg>';
