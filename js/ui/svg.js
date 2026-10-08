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
