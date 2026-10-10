/* =====================================================================
 * 設定載入 —— 讀取 data/*.json，組出拼圖庫、配色、關卡
 *   pieces.json：35 種六格拼圖（皆為六格骨牌；1~21 號「常用組」、22~35 號「非常用組」），
 *               另有 extraFamilies = 其他格數的拼圖類別（目前有 9 種七格骨牌）
 *   levels.json：關卡（尺寸、解答數、各槽位放哪一號拼圖）與拼圖盤顯示順序
 *   colors.json：色盤與「槽位數 → 顏色序」
 * 匯出的都是「容器」（陣列 / 物件）：loadConfig() 只會往裡面填資料，不會換掉它們，
 * 所以其他模組在載入完成後直接使用即可。
 * ===================================================================== */
import { cellsOf } from './matrix.js';

export const PIECE = {};           // 代號 → 拼圖物件（所有類別共用同一張表，代號不可重複）
const FAMILIES = {};              // 類別代號（hexo、hepto…）→ { key, name, nameEn, cells, byNo, idOf }
export const COLORS = {};          // 色名 → { fill, edge }
export const SLOT_COLORS = {};     // 槽位數 → 色名陣列
export const LEVELS = [];          // 關卡陣列（索引 = lv - 1）
export const TRAY_ORDER = {};      // 槽位數 → 拼圖盤兩列排列時的順序
export const LV_COLORS = [];       // 各關卡的代表色
export const LV_INK = [];          // 各關卡色塊上的文字色
export const CONFIG = { defaultTitle: 'Untouchable 11' };

// 拼圖代號：解答簽章（盤面字元網格）以此單字元記錄每格屬於哪一片拼圖。
//   六格骨牌：第 n 號用 n 的 36 進位大寫單字元（1~9 → '1'~'9'，10 → 'A' … 35 → 'Z'）
//   其他類別：依 pieces.json 的 idChars 依序指定（七格骨牌 1~9 號 → 'a'~'i'），避免與六格骨牌的代號重複
const pieceId = n => n.toString(36).toUpperCase();
const HEXO = 'hexo';               // 預設類別（關卡沒寫 family 時使用）

async function fetchJSON(path) {
  const res = await fetch(new URL(path, import.meta.url));
  if (!res.ok) throw new Error(`無法讀取 ${path}（HTTP ${res.status}）`);
  return res.json();
}

/* ---- 拼圖：每個類別各自驗證「全體都是 N 格拼圖」，並依群組標記是否為常用組（僅作分類，不限制關卡使用） ---- */
function buildFamily(key, fam, groups, pieces, idOf) {
  const label = fam.name;
  if (!Array.isArray(pieces) || pieces.length !== fam.count)
    throw new Error(`pieces.json：${label}數量應為 ${fam.count}，實際 ${Array.isArray(pieces) ? pieces.length : 0}`);
  const seen = new Set();
  groups.forEach(g => {
    for (let n = g.range[0]; n <= g.range[1]; n++) {
      if (seen.has(n)) throw new Error(`pieces.json：${label} ${n} 號同時屬於多個群組`);
      seen.add(n);
    }
  });
  if (seen.size !== pieces.length) throw new Error(`pieces.json：${label}的群組範圍必須剛好涵蓋所有拼圖`);

  const family = { key, name: fam.name, nameEn: fam.nameEn, cells: fam.cells, byNo: {}, idOf };
  pieces.forEach((p, i) => {
    const no = p.no;
    if (no !== i + 1) throw new Error(`pieces.json：${label}第 ${i + 1} 筆的 no 應為 ${i + 1}`);
    const matrix = p.def.split(',').map(r => [...r].map(c => (c === 'o' ? 1 : 0)));   // 標準 2D 矩陣（預設樣式）
    if (matrix.some(r => r.length !== matrix[0].length)) throw new Error(`pieces.json：${label} ${no} 號各列長度不一致`);
    if (cellsOf(matrix).length !== fam.cells)
      throw new Error(`pieces.json：${label} ${no} 號不是 ${fam.cells} 格拼圖（${fam.name}）`);
    const id = idOf(no);
    if (typeof id !== 'string' || id.length !== 1 || PIECE[id])
      throw new Error(`pieces.json：${label} ${no} 號的代號「${id}」無效或與其他拼圖重複`);
    const piece = { no, id, matrix, family: key };
    PIECE[id] = piece; family.byNo[no] = piece;
  });
  FAMILIES[key] = family;
}

function buildPieces(data) {
  Object.keys(PIECE).forEach(k => delete PIECE[k]);
  Object.keys(FAMILIES).forEach(k => delete FAMILIES[k]);
  buildFamily(HEXO, data.family, data.groups, data.pieces, pieceId);
  (data.extraFamilies || []).forEach(f => {
    if (!f.key || FAMILIES[f.key]) throw new Error(`pieces.json：類別代號「${f.key}」缺少或重複`);
    if (typeof f.idChars !== 'string' || f.idChars.length < f.count)
      throw new Error(`pieces.json：${f.name}的 idChars 長度不足（需要 ${f.count} 個字元）`);
    buildFamily(f.key, f, f.groups, f.pieces, n => f.idChars[n - 1]);
  });
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
    const famKey = src.family || HEXO, fam = FAMILIES[famKey];   // 關卡使用哪一類拼圖（省略 = 六格骨牌）
    if (!fam) throw new Error(`levels.json：第 ${src.lv} 關的 family「${famKey}」不存在`);
    nums.forEach(n => {
      if (!fam.byNo[n]) throw new Error(`levels.json：第 ${src.lv} 關使用了不存在的 ${n} 號拼圖（${fam.name}）`);
    });
    if (new Set(nums).size !== nums.length) throw new Error(`levels.json：第 ${src.lv} 關的拼圖號碼重複`);
    const L = { ...src, family: famKey, pieces: nums, ids: nums.map(fam.idOf).join('') };
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
