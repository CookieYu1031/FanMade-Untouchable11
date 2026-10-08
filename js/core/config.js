/* =====================================================================
 * 設定載入 —— 讀取 data/*.json，組出拼圖庫、配色、關卡
 *   pieces.json：35 種六格拼圖（皆為六格骨牌；1~21 號「常用組」、22~35 號「非常用組」）
 *   levels.json：關卡（尺寸、解答數、各槽位放哪一號拼圖）與拼圖盤顯示順序
 *   colors.json：色盤與「槽位數 → 顏色序」
 * 匯出的都是「容器」（陣列 / 物件）：loadConfig() 只會往裡面填資料，不會換掉它們，
 * 所以其他模組在載入完成後直接使用即可。
 * ===================================================================== */
import { cellsOf } from './matrix.js';

export const PIECES = [];          // 拼圖物件陣列（依號碼排序）
export const PIECE = {};           // 代號 → 拼圖物件
export const PIECE_GROUPS = [];    // 拼圖分組（常用組 / 非常用組）
export const COLORS = {};          // 色名 → { fill, edge }
export const SLOT_COLORS = {};     // 槽位數 → 色名陣列
export const LEVELS = [];          // 關卡陣列（索引 = lv - 1）
export const TRAY_ORDER = {};      // 槽位數 → 拼圖盤兩列排列時的順序
export const LV_COLORS = [];       // 各關卡的代表色
export const LV_INK = [];          // 各關卡色塊上的文字色
export const CONFIG = { defaultTitle: 'Untouchable 11' };

// 拼圖代號：第 n 號拼圖用 n 的 36 進位大寫單字元表示（1~9 → '1'~'9'，10 → 'A' … 35 → 'Z'），
// 解答簽章（盤面字元網格）以此代號記錄每格屬於哪一片拼圖
export const pieceId = n => n.toString(36).toUpperCase();

async function fetchJSON(path) {
  const res = await fetch(new URL(path, import.meta.url));
  if (!res.ok) throw new Error(`無法讀取 ${path}（HTTP ${res.status}）`);
  return res.json();
}

/* ---- 拼圖：驗證「全體都是六格拼圖」，並依群組標記是否為常用組（僅作分類，不限制關卡使用） ---- */
function buildPieces(data) {
  const { family, groups, pieces } = data;
  if (!Array.isArray(pieces) || pieces.length !== family.count)
    throw new Error(`pieces.json：拼圖數量應為 ${family.count}，實際 ${Array.isArray(pieces) ? pieces.length : 0}`);
  const seen = new Set();
  groups.forEach(g => {
    for (let n = g.range[0]; n <= g.range[1]; n++) {
      if (seen.has(n)) throw new Error(`pieces.json：${n} 號同時屬於多個群組`);
      seen.add(n);
    }
  });
  if (seen.size !== pieces.length) throw new Error('pieces.json：群組範圍必須剛好涵蓋所有拼圖');

  PIECES.length = 0; PIECE_GROUPS.length = 0;
  groups.forEach(g => PIECE_GROUPS.push(g));
  pieces.forEach((p, i) => {
    const no = p.no;
    if (no !== i + 1) throw new Error(`pieces.json：第 ${i + 1} 筆的 no 應為 ${i + 1}`);
    const matrix = p.def.split(',').map(r => [...r].map(c => (c === 'o' ? 1 : 0)));   // 標準 2D 矩陣（預設樣式）
    if (matrix.some(r => r.length !== matrix[0].length)) throw new Error(`pieces.json：${no} 號各列長度不一致`);
    if (cellsOf(matrix).length !== family.cells)
      throw new Error(`pieces.json：${no} 號不是 ${family.cells} 格拼圖（${family.name}）`);
    const group = groups.find(g => no >= g.range[0] && no <= g.range[1]);
    const piece = { no, id: pieceId(no), name: `${no}號`, def: p.def, matrix, group: group.id, common: group.common };
    PIECES.push(piece);
  });
  Object.keys(PIECE).forEach(k => delete PIECE[k]);
  PIECES.forEach(p => { PIECE[p.id] = p; });
}

/* ---- 關卡：槽位 → 拼圖號碼（任何組別的拼圖都可使用） ---- */
function buildLevels(data) {
  const sets = data.slotSets || {};
  Object.keys(TRAY_ORDER).forEach(k => delete TRAY_ORDER[k]);
  Object.entries(data.trayOrder || {}).forEach(([k, v]) => { if (Array.isArray(v)) TRAY_ORDER[k] = v; });
  CONFIG.defaultTitle = data.defaultTitle || CONFIG.defaultTitle;

  LEVELS.length = 0; LV_COLORS.length = 0; LV_INK.length = 0;
  data.levels.forEach((src, i) => {
    if (src.lv !== i + 1) throw new Error(`levels.json：第 ${i + 1} 關的 lv 應為 ${i + 1}`);
    const nums = typeof src.pieces === 'string' ? sets[src.pieces] : src.pieces;
    if (!Array.isArray(nums)) throw new Error(`levels.json：第 ${src.lv} 關的 pieces 設定無效`);
    nums.forEach(n => {
      const p = PIECE[pieceId(n)];
      if (!p) throw new Error(`levels.json：第 ${src.lv} 關使用了不存在的 ${n} 號拼圖`);
    });
    if (new Set(nums).size !== nums.length) throw new Error(`levels.json：第 ${src.lv} 關的拼圖號碼重複`);
    const L = { ...src, pieces: nums, ids: nums.map(pieceId).join('') };
    LEVELS.push(L);
    LV_COLORS.push(src.color);
    LV_INK.push(src.ink || '#2B2E4A');
  });
}

function buildColors(data) {
  Object.keys(COLORS).forEach(k => delete COLORS[k]);
  Object.keys(SLOT_COLORS).forEach(k => delete SLOT_COLORS[k]);
  Object.assign(COLORS, data.palette);
  Object.assign(SLOT_COLORS, data.slotColors);
}

export async function loadConfig() {
  const [pieces, levels, colors] = await Promise.all([
    fetchJSON('../../data/pieces.json'),
    fetchJSON('../../data/levels.json'),
    fetchJSON('../../data/colors.json'),
  ]);
  buildPieces(pieces);     // 拼圖要先建好，關卡才能檢查
  buildColors(colors);
  buildLevels(levels);
}
