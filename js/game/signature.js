/* 解答簽章 —— 用來判斷兩組解答是否「同一個解」（旋轉、鏡射視為相同） */
import { PIECE } from '../core/config.js';
import { rotateCW, flipH, orient, cellsOf } from '../core/matrix.js';
import { dims } from '../state/state.js';

// 把盤面轉成字元網格：每格寫入佔用拼圖 id（A~K），空格為 '.'
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
// 由簽章還原 11 片拼圖的姿態與位置（載入解答、驗證匯入資料時使用）
export function piecesFromSig(sig, L) {
  const rows = sig.split('/');
  const byId = {};
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '.') (byId[ch] = byId[ch] || []).push([x, y]);
  }));
  if (Object.keys(byId).some(ch => !L.ids.includes(ch))) return null;   // 出現該難度沒有的拼圖
  const out = [];
  for (const p of [...L.ids].map(id => PIECE[id])) {
    const cs = byId[p.id];
    if (!cs || cs.length !== 6) return null;
    const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1]));
    const target = cs.map(([x, y]) => (x - mx) + ',' + (y - my)).sort().join(';');
    let found = null;
    for (let rot = 0; rot < 4 && !found; rot++) {
      for (const flip of [false, true]) {
        const key = cellsOf(orient(p.matrix, rot, flip)).map(([x, y]) => x + ',' + y).sort().join(';');
        if (key === target) { found = { id:p.id, rot, flip, placed:true, x:mx, y:my }; break; }
      }
    }
    if (!found) return null;
    out.push(found);
  }
  return out;
}
