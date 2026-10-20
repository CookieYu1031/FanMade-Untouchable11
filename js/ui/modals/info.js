/* 規則與資訊視窗（初次開啟網頁時自動顯示一次）
 *   小視窗（<= 640px）：分成「規則」「資訊」兩頁，用視窗下方的 ← → 換頁（樣式見 css/modals.css）；其他視窗大小一次顯示全部 */
import { Store, KEY_WELCOME } from '../../storage/store.js';
import { $, pageDir } from '../dom.js';

const infoModal = $('infoModal'), PAGES = 2;
function setPage(n) {
  n = Math.max(1, Math.min(PAGES, n));
  infoModal.dataset.ip = String(n);
  $('infoPg').textContent = `${n} / ${PAGES}`;
  $('infoPrev').disabled = n <= 1;     // 沒有上（下）一頁：箭頭仍顯示但不可點按（同統計視窗）
  $('infoNext').disabled = n >= PAGES;
}
const openInfo = () => { setPage(1); infoModal.classList.add('open'); };
setPage(1);
$('btnInfo').addEventListener('click', openInfo);
$('infoClose').addEventListener('click', () => infoModal.classList.remove('open'));
infoModal.addEventListener('click', e => { if (e.target === infoModal) infoModal.classList.remove('open'); });
$('infoPrev').addEventListener('click', () => setPage(+infoModal.dataset.ip - 1));
$('infoNext').addEventListener('click', () => setPage(+infoModal.dataset.ip + 1));
window.addEventListener('keydown', e => {   // 規則視窗開著時：左右鍵換頁（只有小視窗才分頁）
  const d = pageDir(e);
  if (!infoModal.classList.contains('open') || !d) return;
  if (!window.matchMedia('(max-width:640px)').matches) return;
  setPage(+infoModal.dataset.ip + d); e.preventDefault();
});

// 玩家第一次開啟網頁時顯示規則與資訊；之後不再自動彈出（仍可按右上角的書本圖示開啟）
export function showWelcomeOnce() {
  if (Store.get(KEY_WELCOME, false)) return;
  openInfo();
  Store.set(KEY_WELCOME, true);
}
