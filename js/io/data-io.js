/* 資料匯出 / 匯入（解答冊 + 各關卡盤面暫存 + 設定） */
import { t, setLang, applyI18n } from '../i18n/i18n.js';
import { LEVELS } from '../core/config.js';
import { canonicalSig } from '../game/signature.js';
import { loadBook, saveBook, addSolution, validSig, validNearSig } from '../storage/book.js';
import { legacyLevels, legacyBoard } from '../storage/legacy.js';
import { nativeBoards, persistBoards, sanitizeNative } from '../storage/boards.js';
import { settings, saveSettings, applyTheme } from '../state/settings.js';
import { state, curLevel, fromNative, clamp } from '../state/state.js';
import { refresh } from '../ui/render.js';
import { renderSettings } from '../ui/modals/settings-view.js';

export function exportJSON() {
  return JSON.stringify({
    app:'untouchable11', version:4, exportedAt:new Date().toISOString(),
    settings:{ nick:settings.nick, lang:settings.lang, theme:settings.theme || '', volume:settings.vol * 10, extra:settings.extra },
    level:state.level, boards:nativeBoards(), levels:loadBook().levels, near:loadBook().near || {},
  }, null, 2);
}
export function importJSON(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return t('imp.json'); }
  if (!data || data.app !== 'untouchable11') return t('imp.bad');

  // 1) 解答（正解 + 近似解）：合併、去重（旋轉鏡射相同視為同一組）
  const book = loadBook();
  let added = 0, addedNear = 0, skipped = 0;
  const legacy = !(Number(data.version) >= 4);   // 舊版匯出檔用 A~M 代號，先轉換
  for (const [src, near] of [[data.levels, false], [data.near, true]]) {
    const lvs = (src && typeof src === 'object') ? (legacy ? legacyLevels(src) : src) : {};
    const check = near ? validNearSig : validSig;
    for (const lv of Object.keys(lvs)) {
      const L = LEVELS[Number(lv) - 1];
      if (!L || !Array.isArray(lvs[lv])) continue;
      for (const item of lvs[lv]) {
        const raw = typeof item === 'string' ? item : item && item.sig;
        if (!check(raw, L)) { skipped++; continue; } // 尺寸錯誤或不是合法解，一律略過
        const canon = canonicalSig(raw.split('/').map(r => [...r]));
        let disp;
        if (item && typeof item.disp === 'string' && check(item.disp, L) &&
            canonicalSig(item.disp.split('/').map(r => [...r])) === canon) disp = item.disp;
        const nick = item && typeof item.nick === 'string' ? item.nick.slice(0, 20) : '';
        if (addSolution(book, L.lv, canon, item && item.time, disp, nick, near)) { if (near) addedNear++; else added++; } else skipped++;
      }
    }
  }
  saveBook(book);

  // 2) 各難度盤面：有帶才還原（會取代目前該難度的盤面）
  let nb = 0;
  if (data.boards && typeof data.boards === 'object') {
    for (const L of LEVELS) {
      if (!data.boards[L.lv]) continue;
      state.boards[L.lv] = fromNative(sanitizeNative(legacy ? legacyBoard(data.boards[L.lv]) : data.boards[L.lv], L.lv), L.lv);
      state.hist[L.lv] = []; nb++;
    }
    if (LEVELS[Number(data.level) - 1]) state.level = Number(data.level);
    state.selected = null; state.chain = null; state.solveInfo = null;
  }

  // 3) 設定
  let st = false;
  if (data.settings && typeof data.settings === 'object') {
    const d = data.settings;
    if (typeof d.nick === 'string') settings.nick = d.nick.trim().slice(0, 20);
    if (d.lang === 'zh' || d.lang === 'en') settings.lang = d.lang;
    if (typeof d.extra === 'boolean') settings.extra = d.extra;
    if (Number.isFinite(d.volume)) settings.vol = clamp(Math.round(d.volume / 10), 0, 10);
    settings.theme = (d.theme === 'light' || d.theme === 'dark') ? d.theme : null;
    saveSettings(); setLang(settings.lang); applyTheme(); applyI18n(); st = true;
  }
  if (curLevel().extra && !settings.extra) state.level = 8;   // 額外難度未啟用時不停留在額外難度
  persistBoards(); refresh(); renderSettings();
  return t('imp.done', added, skipped, nb, st, addedNear);
}
