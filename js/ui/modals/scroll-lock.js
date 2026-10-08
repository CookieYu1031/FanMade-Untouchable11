/* 有二級介面開啟時，滑鼠滾輪 / 觸控不再捲動後面的主畫面 */

(() => {
  const root = document.documentElement;
  let locked = false;
  const sync = () => {
    const need = !!document.querySelector('.modal.open');
    if (need === locked) return;
    locked = need;
    if (need) {
      const sw = window.innerWidth - root.clientWidth;   // 補上捲軸寬度，避免畫面左右跳動
      root.classList.add('lock');
      if (sw > 0) document.body.style.paddingRight = sw + 'px';
    } else { root.classList.remove('lock'); document.body.style.paddingRight = ''; }
  };
  new MutationObserver(sync).observe(document.body, { attributes:true, attributeFilter:['class'], subtree:true });
  sync();
})();
