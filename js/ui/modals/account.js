/* 帳戶：Google 登入 / 登出、登入時詢問是否合併本機紀錄、套用雲端資料 */
import { t, setLang, applyI18n } from '../../i18n/i18n.js';
import { cloud, onCloud, setHandlers, signIn, signOut, retry } from '../../cloud/sync.js';
import { Store } from '../../storage/store.js';
import { cancelPersist, restoreBoards } from '../../storage/boards.js';
import { settings, applyTheme } from '../../state/settings.js';
import { state, curLevel } from '../../state/state.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';
import { refresh } from '../render.js';
import { renderSettings } from './settings-view.js';
import { renderStats } from './stats.js';
import { Music } from '../../audio/music.js';

const G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
const box = $('acctBox');

function render() {
  box.textContent = '';
  const u = cloud.user;
  if (!u) {
    const info = document.createElement('div'); info.className = 'acct-txt';
    info.innerHTML = '<b></b><small></small>';
    info.firstChild.textContent = t('acct.title'); info.lastChild.textContent = t('acct.hint');
    const b = document.createElement('button'); b.className = 'btn gbtn'; b.innerHTML = G;
    const gt = document.createElement('span'); gt.className = 'gtxt'; gt.textContent = t('acct.google'); b.append(gt);
    b.addEventListener('click', async () => {
      b.disabled = true;
      try { await signIn(); } catch (e) { console.error(e); toast(t('acct.loginFail')); }
      b.disabled = false;
    });
    box.append(info, b);
    fitGoogleBtn();
    return;
  }
  const wrap = document.createElement('div'); wrap.className = 'acct-info';
  const av = document.createElement(u.photoURL ? 'img' : 'div'); av.className = 'av';
  if (u.photoURL) { av.src = u.photoURL; av.alt = ''; av.referrerPolicy = 'no-referrer'; }
  const txt = document.createElement('div'); txt.className = 'acct-txt';
  const nm = document.createElement('b'); nm.textContent = u.displayName || u.email || '';
  const em = document.createElement('small'); em.textContent = u.email || '';
  const st = document.createElement('small');
  st.textContent = t({ syncing: 'acct.syncing', ok: 'acct.synced', error: 'acct.error' }[cloud.status] || 'acct.syncing');
  if (cloud.status === 'error') {
    st.className = 'err';
    const rb = document.createElement('button'); rb.textContent = t('acct.retry'); rb.addEventListener('click', () => retry());
    st.append(rb);
  }
  txt.append(nm, em, st); wrap.append(av, txt);
  const out = document.createElement('button'); out.className = 'btn'; out.textContent = t('acct.logout');
  out.addEventListener('click', () => $('logoutModal').classList.add('open'));
  box.append(wrap, out);
}
// Google 登入按鈕：文字放不下時自動縮小字級（不會頂到按鈕邊界）；設定視窗打開 / 視窗大小改變時重算
function fitGoogleBtn() {
  const sp = box.querySelector('.gbtn .gtxt'); if (!sp) return;
  sp.style.fontSize = ''; sp.classList.remove('wrap');
  if (!sp.clientWidth) return;                                   // 視窗尚未顯示（量不到寬度），等 ResizeObserver 通知
  let size = parseFloat(getComputedStyle(sp).fontSize);
  while (sp.scrollWidth > sp.clientWidth + 0.5 && size > 11) { size -= 0.5; sp.style.fontSize = size + 'px'; }   // 最小縮到 11px
  if (sp.scrollWidth > sp.clientWidth + 0.5) sp.classList.add('wrap');                                          // 還是放不下就換行
}
if (window.ResizeObserver) new ResizeObserver(fitGoogleBtn).observe(box); else window.addEventListener('resize', fitGoogleBtn);
document.addEventListener('i18n', () => render());   // 語言套用 / 更換後，登入按鈕與說明文字一併更新（開機時 account.js 比語言設定早載入，也靠這個補上）
onCloud(render); render();

// 登入時詢問：這台裝置上已有紀錄，要不要合併進雲端帳戶
const mergeModal = $('mergeModal');
function askMerge(c) {
  return new Promise(res => {
    $('mergeDesc').textContent = t('merge.desc', c.sol, c.near);
    mergeModal.classList.add('open');
    const done = v => { mergeModal.classList.remove('open'); $('mergeYes').onclick = $('mergeNo').onclick = null; res(v); };
    $('mergeYes').onclick = () => done(true);
    $('mergeNo').onclick = () => done(false);
  });
}
// 雲端資料套用到本機後：重新套用語言 / 背景並重繪
// info.boards = 雲端盤面已寫入本機；info.level = 一併切到雲端記錄的關卡（登入時才會；回到分頁時的檢查不會切關）
function applied(info = {}) {
  if (info.boards) restoreBoards({ level: !!info.level });
  setLang(settings.lang); applyTheme(); applyI18n(); Music.sync();   // 雲端設定可能含不同的音樂音量
  if (curLevel().extra && !settings.extra) state.level = 8;
  state.selected = null; state.chain = null;
  refresh(); renderSettings(); renderStats(); render();
}
setHandlers({ askMerge, applied, notify: k => toast(t(k)) });

// 登出：清除這台裝置上的所有資料（雲端資料保留）
const logoutModal = $('logoutModal'), closeLogout = () => logoutModal.classList.remove('open');
$('logoutClose').addEventListener('click', closeLogout);
$('logoutCancel').addEventListener('click', closeLogout);
logoutModal.addEventListener('click', e => { if (e.target === logoutModal) closeLogout(); });
$('logoutConfirm').addEventListener('click', async () => {
  const b = $('logoutConfirm'); b.disabled = true;
  try {
    if (!(await signOut())) { toast(t('acct.logoutFail')); b.disabled = false; return; }
  } catch (e) { console.error(e); toast(t('acct.logoutFail')); b.disabled = false; return; }
  state.wiping = true; cancelPersist(); Store.clearAll();
  location.reload();
});
