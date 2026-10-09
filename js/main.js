/* 進入點：載入設定檔 → 還原存檔 → 綁定介面 → 第一次繪製 */
import { loadConfig, LEVELS } from './core/config.js';
import { setLang, applyI18n } from './i18n/i18n.js';
import { Store, KEY_BOARDS, KEY_UI } from './storage/store.js';
import { settings, applyTheme } from './state/settings.js';
import { state, initState, applyMode, fromNative, curLevel } from './state/state.js';
import { sanitizeNative, persistBoards } from './storage/boards.js';
import { legacyBoard } from './storage/legacy.js';
import { refresh } from './ui/render.js';
import { initCloud } from './cloud/sync.js';

// 以下模組載入時會綁定各自負責的事件
import './audio/sfx-bindings.js';
import './ui/level-select.js';
import './ui/responsive.js';
import './ui/keyboard.js';
import './ui/interaction/drag.js';
import './ui/interaction/transform.js';
import './ui/interaction/undo.js';
import './ui/modals/info.js';
import './ui/modals/help.js';
import './ui/modals/special.js';
import './ui/modals/solution.js';
import './ui/modals/share.js';
import './ui/modals/board-reset.js';
import './ui/modals/settings.js';
import './ui/modals/account.js';
import './ui/modals/stats.js';
import './ui/modals/reset-data.js';
import './ui/modals/scroll-lock.js';

function showLoadError(err) {
  console.error(err);
  const box = document.getElementById('loadError');
  box.hidden = false;
  box.querySelector('pre').textContent = String(err && err.message || err);
}

async function boot() {
  try { await loadConfig(); } catch (err) { showLoadError(err); return; }
  initState();
  state.bookHidden = !!(Store.get(KEY_UI, {}).hidden);
  setLang(settings.lang); applyTheme(); applyI18n();
  applyMode();
  // 還原上次各關卡的盤面與所在關卡（自動暫存）
  const savedBoards = Store.get(KEY_BOARDS, null);
  if (savedBoards && savedBoards.boards && typeof savedBoards.boards === 'object') {
    const legacyB = savedBoards.version !== 2;   // 舊版暫存盤面：換成新的拼圖代號
    LEVELS.forEach(L => {
      const b = savedBoards.boards[L.lv];
      if (b) state.boards[L.lv] = fromNative(sanitizeNative(legacyB ? legacyBoard(b) : b, L.lv), L.lv);
    });
    if (LEVELS[Number(savedBoards.level) - 1]) state.level = Number(savedBoards.level);
  }
  if (curLevel().extra && !settings.extra) state.level = 8;
  window.addEventListener('pagehide', persistBoards);
  refresh();
  initCloud();   // 曾登入過才會載入 Firebase 並還原登入狀態
}
boot();


