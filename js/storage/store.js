/* Local Storage 包裝（不可用時改用記憶體）與儲存鍵名 */

export const KEY_BOOK = 'untouchable11.solutions.v1';
export const KEY_BOARDS = 'untouchable11.boards.v1';     // 每個難度目前的盤面（自動暫存，只存在本機快取）
export const KEY_SET = 'untouchable11.settings.v1';      // 暱稱、語言、背景、音量、額外關卡（登入時與雲端同步）
export const KEY_UI = 'untouchable11.ui.v1';
export const KEY_SYNC = 'untouchable11.sync.v1';         // 雲端同步狀態 { uid, rev, dirty }
export const KEY_REDIRECT = 'untouchable11.redirect';    // 以跳轉方式登入前先做標記，回來時才知道要載入 Firebase
const PREFIX = 'untouchable11.';
export const Store = {
  mem: {}, // localStorage 不可用時的記憶體備援
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return k in this.mem ? this.mem[k] : fallback; }
  },
  set(k, v) {
    this.mem[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 忽略：改用記憶體 */ }
  },
  remove(k) {
    delete this.mem[k];
    try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ }
  },
  // 清除本遊戲在這台裝置上的所有資料
  clearAll() {
    this.mem = {};
    try { Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* 忽略 */ }
  },
};
// 雲端同步掛鉤：存檔函式寫入本機後會呼叫（由 cloud/sync.js 登入後註冊，未登入時為空）
export const Hooks = { book: null, settings: null };
