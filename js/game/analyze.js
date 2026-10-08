/* 判定與違規分析
 *   1) 半格外擴：判定是否「完全分開」（正解檢測）
 *   2) 違規定位：找出哪些邊線 / 頂點發生接觸（即時警示） */
import { absCells } from '../state/state.js';

export function analyze(pieces) {
  const placed = pieces.filter(p => p.placed);

  // --- 佔格表：格座標 -> 佔用該格的拼圖 id 陣列（長度 > 1 代表重疊）---
  const owners = new Map();
  for (const p of placed) {
    for (const [x, y] of absCells(p)) {
      const k = x + ',' + y;
      if (!owners.has(k)) owners.set(k, []);
      owners.get(k).push(p.id);
    }
  }

  // --- (1) 半格外擴判定 ---
  // 把座標放大 2 倍：原本佔 [x, x+1] 的格子變成 [2x, 2x+2]，由 2 個「子格」組成。
  // 向外延伸 0.5 格 = 向外多 1 個子格，所以每個方塊會變成 4×4 子格（2x-1 … 2x+2）。
  // 兩片拼圖「邊碰」或「角碰」時，擴張後的區域一定會共用至少 1 個子格 → 轉成重疊問題。
  const occ = new Map();
  let expandedOverlap = false;
  for (const p of placed) {
    const mine = new Set();
    for (const [x, y] of absCells(p)) {
      for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 4; dy++) {
        mine.add((2 * x - 1 + dx) + ',' + (2 * y - 1 + dy));
      }
    }
    for (const k of mine) {
      const o = occ.get(k);
      if (o === undefined) occ.set(k, p.id);
      else if (o !== p.id) expandedOverlap = true;
    }
  }

  // --- (2) 違規定位：只用於畫紅線 / 紅點，不影響擺放 ---
  const ownerOf = (x, y) => owners.get(x + ',' + y) || [];
  const differ = (A, B) => {
    const r = [];
    for (const a of A) for (const b of B) if (a !== b) r.push([a, b]);
    return r;
  };
  const edges = new Map();    // 邊觸碰：key 去重，值為線段兩端點
  const corners = new Map();  // 角觸碰：key 去重，值為頂點座標
  const overlaps = [];        // 重疊的格子
  const pairs = new Set();    // 有接觸的拼圖配對（僅用於統計）
  const mark = (a, b) => pairs.add(a < b ? a + b : b + a);

  for (const [k, ids] of owners) {
    const [x, y] = k.split(',').map(Number);

    // 同一格被兩片拼圖佔用 = 重疊
    if (ids.length > 1) {
      overlaps.push([x, y]);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) mark(ids[i], ids[j]);
    }
    // 右鄰格不同拼圖 → 兩格之間的垂直邊線 x = x+1
    const R = differ(ids, ownerOf(x + 1, y));
    if (R.length) {
      edges.set('v' + (x + 1) + ',' + y, { x1:x + 1, y1:y, x2:x + 1, y2:y + 1 });
      R.forEach(([a, b]) => mark(a, b));
    }
    // 下鄰格不同拼圖 → 水平邊線 y = y+1
    const D = differ(ids, ownerOf(x, y + 1));
    if (D.length) {
      edges.set('h' + x + ',' + (y + 1), { x1:x, y1:y + 1, x2:x + 1, y2:y + 1 });
      D.forEach(([a, b]) => mark(a, b));
    }
    // 右下 / 右上對角 → 共用頂點
    for (const dy of [1, -1]) {
      const diag = differ(ids, ownerOf(x + 1, y + dy));
      if (!diag.length) continue;
      const vx = x + 1, vy = dy === 1 ? y + 1 : y;           // 共用頂點座標
      const side = [...ownerOf(x + 1, y), ...ownerOf(x, y + dy)]; // 同一 2×2 區塊的另外兩格
      for (const [a, b] of diag) {
        mark(a, b);
        // 若另兩格已有 a 或 b，代表同時存在邊觸碰，紅線已涵蓋此頂點，不再重複畫紅點
        if (side.includes(a) || side.includes(b)) continue;
        corners.set(vx + ',' + vy, { x:vx, y:vy });
      }
    }
  }

  // --- 顯示優先序：重疊 > 碰邊 > 碰點（只影響警示顯示與統計，不影響過關判定）---
  const ovSet = new Set(overlaps.map(([x, y]) => x + ',' + y));
  const shownEdges = [...edges.values()].filter(e => {
    const cs = e.x1 === e.x2 ? [[e.x1 - 1, e.y1], [e.x1, e.y1]] : [[e.x1, e.y1 - 1], [e.x1, e.y1]];
    return !cs.some(([x, y]) => ovSet.has(x + ',' + y)); // 邊兩側有重疊格 → 只顯示重疊
  });
  const edgeEnds = new Set();
  shownEdges.forEach(e => { edgeEnds.add(e.x1 + ',' + e.y1); edgeEnds.add(e.x2 + ',' + e.y2); });
  const shownCorners = [...corners.values()].filter(c => {
    const around = [[c.x - 1, c.y - 1], [c.x, c.y - 1], [c.x - 1, c.y], [c.x, c.y]];
    if (around.some(([x, y]) => ovSet.has(x + ',' + y))) return false; // 周圍有重疊格 → 只顯示重疊
    return !edgeEnds.has(c.x + ',' + c.y);                              // 頂點在碰邊紅線上 → 只顯示碰邊
  });

  return {
    owners,
    placedCount: placed.length,
    expandedOverlap,
    edges: shownEdges,
    corners: shownCorners,
    overlaps,
    touchCount: shownEdges.length + shownCorners.length + overlaps.length,
    solved: placed.length === pieces.length && !expandedOverlap,
  };
}

// 近似解：全部放進框內、無重疊、無邊觸碰，且恰好只有一個點觸碰
export const isNear = (an, n) => an.placedCount === n && !an.overlaps.length && !an.edges.length && an.corners.length === 1;
