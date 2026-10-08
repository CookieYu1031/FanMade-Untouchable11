/* Local Storage 包裝（不可用時改用記憶體）與儲存鍵名 */

export const KEY_BOOK = 'untouchable11.solutions.v1';
export const KEY_BOARDS = 'untouchable11.boards.v1';     // 每個難度目前的盤面（自動暫存）
export const KEY_SET = 'untouchable11.settings.v1';      // 暱稱、語言、背景
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
};
export const KEY_UI = 'untouchable11.ui.v1';
