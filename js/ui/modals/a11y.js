/* 視窗（.modal）的無障礙行為 —— 統一處理，不必改動各視窗模組：
   ① 語意：role="dialog"、aria-modal、aria-labelledby 指向視窗標題（第一個 <h2>）
   ② 開啟時：記住原本的焦點，並把焦點移進視窗（優先「關閉」按鈕以外的第一個可操作元素；沒有就移到關閉鈕 / 視窗本身）
   ③ 開啟期間：Tab / Shift+Tab 在視窗內循環（焦點圈套），背景以 inert 隔離，螢幕閱讀器與 Tab 都不會跑到後面的畫面
   ④ 關閉時：把焦點還給開啟前的元素
   視窗的開關仍是各模組切換 .open（見 scroll-lock.js 用同樣的 MutationObserver 手法）。 */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const visible = el => !el.closest('[hidden]') && el.getClientRects().length > 0;
const focusables = m => [...m.querySelectorAll(FOCUSABLE)].filter(visible);

let uid = 0;
const stack = [];   // 目前開啟中的視窗（後開的在後）；元素 → 開啟前的焦點

document.querySelectorAll('.modal').forEach(m => {
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  const h = m.querySelector('h2');
  if (h) { if (!h.id) h.id = `modal-title-${++uid}`; m.setAttribute('aria-labelledby', h.id); }
  m.tabIndex = -1;
});

// 背景（主畫面）在有視窗開啟時隔離；視窗本身不在 .wrap / #toast 內，所以不受影響
const background = () => document.querySelectorAll('.wrap, #fan, #fanDot, #rotateHint');
const setInert = on => background().forEach(el => { el.inert = on; });

const syncInert = () => { setInert(stack.length > 0); stack.forEach((x, i) => { x.m.inert = i < stack.length - 1; }); };   // 疊著開的視窗：只有最上層可操作

function opened(m) {
  const prev = document.activeElement;
  stack.push({ m, prev });
  syncInert();
  requestAnimationFrame(() => {
    if (!m.classList.contains('open') || m.contains(document.activeElement)) return;
    const list = focusables(m), first = list.find(el => !el.id.endsWith('Close')) || list[0];
    (first || m).focus({ preventScroll: true });
  });
}
function closed(m) {
  const i = stack.findIndex(x => x.m === m);
  if (i < 0) return;
  const { prev } = stack.splice(i, 1)[0];
  m.inert = false; syncInert();
  if (prev && prev.isConnected && typeof prev.focus === 'function' && !prev.closest('[inert]')) prev.focus({ preventScroll: true });
}

new MutationObserver(list => {
  for (const r of list) {
    const m = r.target;
    if (!m.classList.contains('modal')) continue;
    const was = (r.oldValue || '').split(/\s+/).includes('open'), now = m.classList.contains('open');
    if (now && !was) opened(m); else if (!now && was) closed(m);
  }
}).observe(document.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
// 初始就是開啟的視窗（理論上沒有，保險）
document.querySelectorAll('.modal.open').forEach(opened);

document.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !stack.length) return;
  const m = stack[stack.length - 1].m, list = focusables(m);
  if (!list.length) { e.preventDefault(); m.focus(); return; }
  const first = list[0], last = list[list.length - 1], act = document.activeElement;
  if (e.shiftKey && (act === first || act === m || !m.contains(act))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (act === last || !m.contains(act))) { e.preventDefault(); first.focus(); }
});
