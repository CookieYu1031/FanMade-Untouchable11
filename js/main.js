/* 進入點：載入設定檔 → 還原存檔 → 綁定介面 → 第一次繪製 */
import { loadConfig } from './core/config.js';
import { setLang, applyI18n, LANGS, browserLang, langFromIP } from './i18n/i18n.js';
import { settings, applyTheme, saveSettings } from './state/settings.js';
import { Store, KEY_SET } from './storage/store.js';
import { syncLangPicker } from './ui/modals/lang-picker.js';
import { state, initState, applyMode, curLevel } from './state/state.js';
import { restoreBoards, persistBoards } from './storage/boards.js';
import { refresh } from './ui/render.js';
import { initCloud } from './cloud/sync.js';
import { hideLoader } from './ui/loader.js';
import './audio/music.js';   // 背景音樂（使用者第一次操作後開始播放）

// 以下模組載入時會綁定各自負責的事件
import './audio/sfx-bindings.js';
import './ui/level-select.js';
import './ui/responsive.js';
import './ui/keyboard.js';
import './ui/interaction/drag.js';
import './ui/interaction/transform.js';
import './ui/interaction/undo.js';
import './ui/immersive.js';
import { showWelcomeOnce } from './ui/modals/info.js';
import './ui/modals/help.js';
import './ui/modals/special.js';
import './ui/modals/group.js';
import './ui/random.js';
import './ui/modals/solution.js';
import './ui/modals/share.js';
import './ui/modals/board-reset.js';
import './ui/modals/settings.js';
import './ui/modals/account.js';
import './ui/sync-indicator.js';
import './ui/modals/stats.js';
import './ui/modals/rank.js';
import './ui/modals/scroll-lock.js';
import './ui/modals/a11y.js';

function showLoadError(err) {
  console.error(err);
  hideLoader(true);
  const box = document.getElementById('loadError');
  box.hidden = false;
  box.querySelector('pre').textContent = String(err && err.message || err);
}

// 第一次進站（沒存過語言）且瀏覽器偏好語言沒有任何支援的語言 → 依 IP 所在國家選語言（非同步，查到才切換；查不到維持英文）
async function detectLangByIP() {
  const saved = () => LANGS.includes((Store.get(KEY_SET, {}) || {}).lang);
  if (saved() || browserLang()) return;
  const l = await langFromIP();
  if (!l || l === settings.lang || saved()) return;   // 等待期間使用者自己選了語言就不覆蓋
  settings.lang = l; setLang(l); saveSettings();
  applyI18n(); refresh(); syncLangPicker();
}

async function boot() {
  try { await loadConfig(); } catch (err) { showLoadError(err); return; }
  initState();
  setLang(settings.lang); applyTheme(); applyI18n();
  applyMode();
  restoreBoards();   // 還原上次各關卡的盤面與所在關卡（自動暫存；已登入者之後會再與雲端對帳）
  if (curLevel().extra && !settings.extra) state.level = 8;
  // 行動瀏覽器切到背景 / 關閉分頁時不一定會觸發 pagehide，以 visibilitychange 為主、pagehide 為輔（兩者都是 bfcache 友善的做法，不使用 unload）
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persistBoards(); });
  window.addEventListener('pagehide', persistBoards);
  refresh();
  hideLoader();   // 第一次繪製完成：收起載入畫面（至少顯示 2 秒）
  showWelcomeOnce();
  initCloud();   // 曾登入過才會載入 Firebase 並還原登入狀態
  detectLangByIP();
}
boot();
