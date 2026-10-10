/* 規則與資訊視窗（初次開啟網頁時自動顯示一次） */
import { Store, KEY_WELCOME } from '../../storage/store.js';
import { $ } from '../dom.js';

const infoModal = $('infoModal');
$('btnInfo').addEventListener('click', () => infoModal.classList.add('open'));
$('infoClose').addEventListener('click', () => infoModal.classList.remove('open'));
infoModal.addEventListener('click', e => { if (e.target === infoModal) infoModal.classList.remove('open'); });

// 玩家第一次開啟網頁時顯示規則與資訊；之後不再自動彈出（仍可按右上角的書本圖示開啟）
export function showWelcomeOnce() {
  if (Store.get(KEY_WELCOME, false)) return;
  infoModal.classList.add('open');
  Store.set(KEY_WELCOME, true);
}
