/* 載入畫面（index.html 的 #loader）：第一次繪製完成後淡出並移除，但至少顯示 MIN_MS（從畫面出現起算，避免一閃而過）；
   設定檔載入失敗時（force）立刻收起，才看得到錯誤說明 */
const MIN_MS = 2000;
export function hideLoader(force) {
  const el = document.getElementById('loader');
  if (!el || el.dataset.hiding) return;
  el.dataset.hiding = '1';
  const t0 = window.__u11T0 || 0, wait = force ? 0 : Math.max(0, MIN_MS - (performance.now() - t0));
  setTimeout(() => requestAnimationFrame(() => {
    el.classList.add('hide');
    const rm = () => el.remove();
    el.addEventListener('transitionend', rm, { once: true });
    setTimeout(rm, 600);   // 保險：減少動態效果等沒有轉場的情況
  }), wait);
}
