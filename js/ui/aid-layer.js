/* 輔助模式的圖板提示層（延伸拼圖外圍）
 *   每片拼圖向外延伸 0.5 格的「同色透明範圍」（zoneRects）：放置後畫在底板上，拖曳殘影與吸附預覽也帶有。
 *   兩片拼圖剛好不接觸（最緊密的合法擺法）時，兩片的透明範圍剛好邊對邊相接；範圍重疊 = 靠太近。
 *   範圍的角落圓角與拼圖本體一致（ZONE_RX = 拼圖方塊的 rx）；圖板外的 0.5 格也照常顯示（圖板有預留外圍，見 render-board.js 的 fitBoard）。
 * 輸出的 SVG 以格為單位（同圖板 viewBox）。 */
export const ZONE_RX = 0.14;   // 與 svg.js 的拼圖方塊圓角相同

// 一片拼圖的延伸範圍：每格各向外 0.5 格（相鄰的格子重疊處不會變深：整組以一個群組套透明度；不透明度由 css/base.css 的 --zone-op 依淺 / 深色主題決定）
export const zoneRects = (cells, fill) =>
  `<g style="opacity:var(--zone-op,.18)" fill="${fill}">${cells.map(([x, y]) => `<rect x="${x - .5}" y="${y - .5}" width="2" height="2" rx="${ZONE_RX}"/>`).join('')}</g>`;

// items：已放置的拼圖 [{ cells: 絕對格座標 [[x,y],…], fill: 拼圖顏色 }]。回傳 SVG 字串（放進 #gAid）
export const aidSVG = items => items.map(it => zoneRects(it.cells, it.fill)).join('');
