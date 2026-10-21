/* 排行榜計分（挑戰榜、大師榜，理論滿分各 10,000 分）
 *
 * 精度：所有分數內部一律用「整數 × 0.0001」（簡稱 u4）計算、儲存與排序，天然破同分；
 *       畫面只顯示無條件捨去後的整數（不提供查看小數位的方式）。
 * 這個檔案不碰畫面與網路，只負責「解答冊 → 分數」。 */
import { levelOf } from './config.js';
import { solvedGroups } from '../state/state.js';

export const FULL = 10000;              // 兩個榜的理論滿分
export const BASE_MAX = 6000, EXTRA_MAX = 4000;

// ---- 小數點後 4 位：無條件捨去（+1e-6 只用來吸收浮點誤差，例如全清時 9999.99999999 要算 10000）----
export const U4 = 10000;
export const toU4 = v => Math.floor(v * U4 + 1e-6);
export const fmtInt = u => Math.floor(u / U4);       // 畫面顯示：無條件捨去的整數

// ---- 挑戰榜 Lv1~8 ----
// type 'hyper' = 有限歸一化雙曲線（Lv1~4）；'pow' = 有限次方收斂（Lv5~8）
export const CHALLENGE = [
  { lv:1, N:65516635, F:50,   M:100,  k:10, type:'hyper' },
  { lv:2, N:482482,   F:125,  M:250,  k:15, type:'hyper' },
  { lv:3, N:60327,    F:275,  M:550,  k:20, type:'hyper' },
  { lv:4, N:174,      F:500,  M:1100, k:15, type:'hyper' },
  { lv:5, N:33,       F:650,  M:1500,       type:'pow' },
  { lv:6, N:15,       F:750,  M:1800,       type:'pow' },
  { lv:7, N:8,        F:850,  M:2100,       type:'pow' },
  { lv:8, N:7,        F:1000, M:2600,       type:'pow' },
];
export const POW = 0.65;
// 單一關卡的分數（浮點數）。n = 該關收錄的解答組數
export function levelScore(c, n) {
  n = Math.max(0, Math.min(Math.floor(n) || 0, c.N));
  if (n === 0) return 0;
  if (n >= c.N) return c.M;                 // 全清：精準等於理論上限
  if (n === 1) return c.F;                  // 首通固定分
  if (c.type === 'hyper') return c.F + (c.M - c.F) * ((n - 1) / ((n - 1) + c.k)) * (((c.N - 1) + c.k) / (c.N - 1));
  return c.F + (c.M - c.F) * Math.pow((n - 1) / (c.N - 1), POW);
}
// 挑戰榜 → 大師榜的分段壓縮：5000 分以內 1:1，超出的部分以 0.6 次方壓進 1000 分內（上限 6000）
export function baseScore(cs) {
  if (cs <= 5000) return cs;
  return 5000 + 1000 * Math.pow((Math.min(cs, FULL) - 5000) / 5000, 0.6);
}

// ---- 大師榜的額外關卡（上限合計 4000）----
const finite = (F, M, N) => n => {          // 有限次方收斂（摘星挑戰兩關共用）
  n = Math.max(0, Math.min(Math.floor(n) || 0, N));
  if (n === 0) return 0;
  if (n >= N) return M;
  return F + (M - F) * Math.pow((n - 1) / (N - 1), POW);
};
export const EXTRA = [
  { key:'master', lv:9,  N:2, M:470,  table:[0, 300, 470] },                          // 大師挑戰：首通 300、全清 470（第 2 組 +170）
  { key:'star', lv:12,   N:7, F:300, M:1200, f:finite(300, 1200, 7) },              // 摘星:北斗（11 片 7 組，每組一個唯一解）
  { key:'star', lv:12.1, N:7, F:350, M:1400, f:finite(350, 1400, 7) },              // 摘星:獵戶（12 片 7 組）
  { key:'hazmat', lv:10, N:1, M:380 },                                                // 危險貨物
  { key:'hazmat2', lv:11, N:1, M:550 },                                               // 危險貨物 2
];

// ---- 由解答冊算出全部分數 ----
// 回傳（u4 = 整數 × 0.0001）：
//   c4 挑戰榜總分、m4 大師榜總分、base4 / extra4 大師榜的兩個部分、near 近似解總組數、
//   ct / mt 達成目前分數的時間（該榜所有解答中最晚收錄的那一組的時間：每新增一組解答分數就會增加）、
//   levels 各關得分（畫面明細用）
export function computeScores(book) {
  const ex = book.levels || {}, nr = book.near || {};
  const list = lv => Array.isArray(ex[lv]) ? ex[lv] : [];
  let sum = 0, ct = 0;
  const levels = CHALLENGE.map(c => {
    const l = list(c.lv), s = levelScore(c, l.length);
    sum += s; l.forEach(it => { ct = Math.max(ct, Number(it.time) || 0); });
    return { lv: c.lv, n: Math.min(l.length, c.N), score: s };
  });
  const c4 = toU4(sum), cs = c4 / U4, base = baseScore(cs);

  // 額外關卡：摘星挑戰的 n = 該關已解出幾組拼圖組合（北斗 = lv 12、獵戶 = lv 12.1，各 7 組）
  let extra = 0, mt = ct;
  EXTRA.forEach(e => {
    const l = list(e.lv); l.forEach(it => { mt = Math.max(mt, Number(it.time) || 0); });
    if (e.key === 'master') extra += e.table[Math.min(l.length, e.N)];
    else if (e.key === 'star') extra += e.f(solvedGroups(levelOf(e.lv), l).size);
    else extra += l.length >= 1 ? e.M : 0;
  });
  const m4 = toU4(base + extra);
  const near = Object.keys(nr).reduce((a, lv) => a + (levelOf(lv) && levelOf(lv).near && Array.isArray(nr[lv]) ? nr[lv].length : 0), 0);   // 沒有近似解的關卡（摘星挑戰）不計
  return { c4, m4, base4: toU4(base), extra4: toU4(extra), near, ct, mt, levels };
}

// ---- 排名用的排序鍵（單一字串欄位：固定寬度數字 + uid，Firestore 用字串排序就等於多欄位排序）----
// 挑戰榜：分數 → 近似解總組數 → 達成時間（早者優先）
// 大師榜：分數 → 挑戰榜原始總分 → 近似解總組數 → 達成時間（早者優先）；uid 放最後，確保每位玩家的鍵都不重複
const MAXT = 99999999999999;
const pad = (n, w) => String(Math.max(0, Math.min(Math.floor(n), Math.pow(10, w) - 1))).padStart(w, '0');
export const challengeKey = (s, uid) => pad(s.c4, 9) + pad(s.near, 6) + pad(MAXT - s.ct, 14) + uid;
export const masterKey = (s, uid) => pad(s.m4, 9) + pad(s.c4, 9) + pad(s.near, 6) + pad(MAXT - s.mt, 14) + uid;
