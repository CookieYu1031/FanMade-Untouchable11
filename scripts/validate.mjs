// 專案完整性檢查（不需任何第三方套件）：  node scripts/validate.mjs
//  1. data/*.json 可解析，關卡 lv 不重複、每個關卡都有各語言名稱
//  2. 六格 / 七格骨牌每片的格數正確
//  3. 各語言檔的 key 與繁中（zh）完全一致，index.html 用到的 data-i18n key 都存在
//  4. 語言清單：每個語言都有語言檔與必要欄位（ISO 代碼、原名稱…），代碼不重複
//  5. index.html 的 id 不重複、本機 CSS / JS / 圖片參照的檔案都存在
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...p) => path.join(root, ...p);
const errors = [];
const fail = msg => errors.push(msg);
const readJson = f => JSON.parse(fs.readFileSync(rel(f), 'utf8'));

// ── 1. 資料檔 ──
let pieces, levels;
try { pieces = readJson('data/pieces.json'); levels = readJson('data/levels.json'); readJson('data/colors.json'); }
catch (e) { fail(`資料檔無法解析：${e.message}`); }

const LANG_CODES = ['zh', 'zh-CN', 'ja', 'ko', 'en', 'fr', 'de', 'es', 'pt-BR', 'it', 'ru', 'nl', 'pl', 'sv', 'cs'];   // levels.json 要求的名稱語言（en-GB 退回 en）

if (levels) {
  const seen = new Set();
  for (const lv of levels.levels) {
    if (seen.has(lv.lv)) fail(`levels.json：lv ${lv.lv} 重複`);
    seen.add(lv.lv);
    for (const l of LANG_CODES) if (!lv.names?.[l]) fail(`levels.json：lv ${lv.lv} 缺少 ${l} 名稱`);
  }
}

// ── 2. 骨牌格數（pieces.json：{no, def}，def 的 'o' = 方塊，逗號分隔各列）──
if (pieces) {
  const cellsOf = def => [...def].filter(c => c === 'o').length;
  const checkFamily = (label, list, cells, count) => {
    if (list.length !== count) fail(`pieces.json：${label} 應有 ${count} 片，實際 ${list.length} 片`);
    const nos = new Set();
    for (const p of list) {
      if (nos.has(p.no)) fail(`pieces.json：${label} 編號 ${p.no} 重複`);
      nos.add(p.no);
      if (cellsOf(p.def) !== cells) fail(`pieces.json：${label} ${p.no} 號應為 ${cells} 格，實際 ${cellsOf(p.def)} 格`);
    }
  };
  checkFamily(pieces.family.nameEn, pieces.pieces, pieces.family.cells, pieces.family.count);
  for (const f of pieces.extraFamilies ?? []) checkFamily(f.nameEn, f.pieces, f.cells, f.count);
}

// ── 3. 多語系 ──
const localeDir = rel('js/i18n/locales');
const locales = {};
for (const f of fs.readdirSync(localeDir).filter(f => f.endsWith('.js'))) {
  locales[f.replace(/\.js$/, '')] = (await import(pathToFileURL(path.join(localeDir, f)))).default;
}
const baseKeys = new Set(Object.keys(locales.zh ?? {}));
for (const [lang, dict] of Object.entries(locales)) {
  const keys = new Set(Object.keys(dict));
  for (const k of baseKeys) if (!keys.has(k)) fail(`locales/${lang}.js：缺少 key「${k}」`);
  for (const k of keys) if (!baseKeys.has(k)) fail(`locales/${lang}.js：多出 key「${k}」（zh.js 沒有）`);
}
const html = fs.readFileSync(rel('index.html'), 'utf8');
for (const m of html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)) if (!baseKeys.has(m[1])) fail(`index.html：data-i18n key「${m[1]}」不存在於語言檔`);

// ── 4. 語言清單 ──
const { LANG_INFO } = await import(pathToFileURL(rel('js/i18n/i18n.js')));
for (const [l, info] of Object.entries(LANG_INFO)) {
  if (!locales[l]) fail(`i18n.js：語言 ${l} 沒有對應的 locales/${l}.js`);
  for (const k of ['code', 'label', 'html', 'locale', 'font']) if (!info[k]) fail(`i18n.js：LANG_INFO.${l} 缺少 ${k}`);
}
const codes = Object.values(LANG_INFO).map(i => i.code);
for (const c of new Set(codes.filter((v, i) => codes.indexOf(v) !== i))) fail(`i18n.js：語言代碼「${c}」重複`);

// ── 5. index.html 結構 ──
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
for (const id of new Set(ids.filter((v, i) => ids.indexOf(v) !== i))) fail(`index.html：id「${id}」重複`);
for (const m of html.matchAll(/(?:href|src)="((?!https?:|data:|#|mailto:)[^"]+)"/g)) {
  const file = m[1].split(/[?#]/)[0];
  if (file && !fs.existsSync(rel(file))) fail(`index.html：找不到參照的檔案「${file}」`);
}
for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) fail(`index.html：target="_blank" 缺少 rel="noopener"：${m[0].slice(0, 80)}`);

if (errors.length) {
  console.error(`✖ 驗證失敗（${errors.length} 項）\n` + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('✔ 驗證通過：資料檔、多語系、語言清單、index.html');
