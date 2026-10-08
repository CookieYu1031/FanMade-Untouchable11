/* 矩陣工具 —— 旋轉、鏡向、取出方塊座標
 * 座標系：x 向右、y 向下，格子 (x, y) 佔據 [x, x+1] × [y, y+1] */

// 順時針旋轉 90°：新矩陣 w×h 與舊矩陣 h×w 互換
export const rotateCW = m => {
  const h = m.length, w = m[0].length;
  return Array.from({ length: w }, (_, y) => Array.from({ length: h }, (_, x) => m[h - 1 - x][y]));
};
// 左右鏡向
export const flipH = m => m.map(r => [...r].reverse());
// 依「是否鏡向、旋轉次數」得到目前姿態的矩陣（先鏡向，再旋轉）
export const orient = (base, rot, flip) => {
  let m = flip ? flipH(base) : base;
  for (let i = 0; i < rot; i++) m = rotateCW(m);
  return m;
};
// 矩陣中所有實體方塊的相對座標 [x, y]
export const cellsOf = m => {
  const out = [];
  m.forEach((row, y) => row.forEach((v, x) => { if (v) out.push([x, y]); }));
  return out;
};
