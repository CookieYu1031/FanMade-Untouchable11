/* 解答簽章 —— 用來判斷兩組解答是否「同一個解」（旋轉、鏡射視為相同） */
import { rotateCW, flipH } from '../core/matrix.js';
import { dims } from '../state/state.js';

// 把盤面轉成字元網格：每格寫入佔用拼圖 id（六格骨牌 1~9、A~Z；七格骨牌 a~i），空格為 '.'
export function gridOf(an) {
  const D = dims();
  return Array.from({ length: D.rows }, (_, y) =>
    Array.from({ length: D.cols }, (_, x) => {
      const o = an.owners.get(x + ',' + y);
      return o ? o[0] : '.';
    }));
}
// 取所有對稱變換中字典序最小者當作標準簽章。
// 長方形底板只有 4 種對稱（恆等、左右、上下、旋轉 180°），正方形（夢魘）有 8 種。
export function canonicalSig(grid) {
  const square = grid.length === grid[0].length;
  const cands = [];
  for (const base of [grid, flipH(grid)]) {
    let g = base;
    for (let k = 0; k < 4; k++) {
      if (square || k % 2 === 0) cands.push(g.map(r => r.join('')).join('/'));
      g = rotateCW(g);
    }
  }
  return cands.sort()[0];
}
