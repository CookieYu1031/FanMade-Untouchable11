/* 舊版資料遷移：拼圖代號、解答簽章、盤面 */
import { PIECE } from '../core/config.js';
import { orient } from '../core/matrix.js';
import { canonicalSig } from '../game/signature.js';

/* ---- 舊版資料遷移：舊版以 A~M 記錄拼圖（A~K = 舊第 1~11 片、L、M = 舊額外拼圖），現改用拼圖號碼代號 ----
 * 舊 A~F（1-4-1 型）= 16~21 號、G~I（2-3-1 型）= 12~14 號、J = 15 號、K = 8 號、L = 6 號、M = 9 號 */
const LEGACY = { A:'G', B:'H', C:'I', D:'J', E:'K', F:'L', G:'C', H:'D', I:'E', J:'F', K:'8', L:'6', M:'9' };
export const legacyStr = str => str.replace(/[A-M]/g, c => LEGACY[c]);
const legacySig = str => canonicalSig(legacyStr(str).split('/').map(r => [...r]));   // 換代號後要重算標準簽章
export function legacyLevels(src) {
  const out = {};
  for (const lv of Object.keys(src || {})) {
    if (!Array.isArray(src[lv])) continue;
    const seen = new Set(); out[lv] = [];
    for (const it of src[lv]) {
      const raw = typeof it === 'string' ? it : it && it.sig;
      if (typeof raw !== 'string') continue;
      const sig = legacySig(raw);
      if (seen.has(sig)) continue;
      seen.add(sig);
      const n = { ...(it && typeof it === 'object' ? it : {}), sig };
      if (typeof n.disp === 'string') n.disp = legacyStr(n.disp);
      out[lv].push(n);
    }
  }
  return out;
}
// 舊額外拼圖 L 的預設樣式與新 6 號不同，換代號時要找出外觀一致的旋轉 / 鏡像值
const LEGACY_L = [[0, 1, 0, 0], [0, 1, 0, 0], [1, 1, 1, 1]];
export function legacyBoard(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(q => q && LEGACY[q.id]).map(q => {
    const o = { ...q, id: LEGACY[q.id] };
    if (q.id === 'L') {
      const rot = Number.isInteger(q.rot) ? ((q.rot % 4) + 4) % 4 : 0;
      const want = JSON.stringify(orient(LEGACY_L, rot, !!q.flip));
      for (let r = 0; r < 4; r++) for (const f of [false, true]) {
        if (JSON.stringify(orient(PIECE['6'].matrix, r, f)) === want) { o.rot = r; o.flip = f; return o; }
      }
    }
    return o;
  });
}
