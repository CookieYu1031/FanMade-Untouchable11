/* 首次開啟的歡迎視窗（左：資訊與規則，右：操作說明；按「開始遊玩」關閉，之後不再自動彈出） */
import { Store, KEY_WELCOME } from '../../storage/store.js';
import { $ } from '../dom.js';

const welcomeModal = $('welcomeModal');
const closeWelcome = () => welcomeModal.classList.remove('open');
$('welcomeStart').addEventListener('click', closeWelcome);
if (!Store.get(KEY_WELCOME, false)) {
  welcomeModal.classList.add('open');
  Store.set(KEY_WELCOME, true);
}
