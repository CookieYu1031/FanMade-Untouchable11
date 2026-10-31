/* 問題回報（站內）：登入的玩家填寫主旨與內文後提交到 Firestore 的 reports（規則見 firestore.rules）；
 *   管理員在「管理員面板 → 問題回報」查看（js/ui/modals/admin.js）。
 *   為避免洗版：需登入 Google 帳戶、每則最多 100 / 2000 字、同一台裝置兩次提交至少間隔 30 秒。 */
import { t } from '../../i18n/i18n.js';
import { cloud, rankApi } from '../../cloud/sync.js';
import { settings } from '../../state/settings.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';

const modal = $('reportModal'), form = $('rptForm'), subj = $('rptSubject'), body = $('rptBody'), send = $('rptSend');
const COOLDOWN = 30000;
// 或撰寫 email 聯絡網站設計者：手機 / 平板用 mailto（交給裝置預設的郵件程式）；桌機不呼叫系統郵件程式，改在新分頁開 Gmail 網頁版寫信。主旨依目前語言，換語言時一併更新
const REPORT_MAIL = '830601ryan2@gmail.com';
const mailLink = $('rptMail');
// 優先用 User-Agent Client Hints 的 mobile 旗標；不支援的瀏覽器（Safari / Firefox）才退回字串判斷
const isDesktop = () => {
  const uaMobile = navigator.userAgentData && navigator.userAgentData.mobile;
  const mobile = typeof uaMobile === 'boolean' ? uaMobile
    : /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);   // iPadOS 會偽裝成 Mac
  return !mobile && matchMedia('(pointer:fine)').matches;
};
const syncMailLink = () => {
  const su = encodeURIComponent(`Untouchable 11 – ${t('set.report')}`);
  if (isDesktop()) {
    mailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(REPORT_MAIL)}&su=${su}`;
    mailLink.target = '_blank'; mailLink.rel = 'noopener noreferrer';
  } else {
    mailLink.href = `mailto:${REPORT_MAIL}?subject=${su}`;
    mailLink.removeAttribute('target'); mailLink.removeAttribute('rel');
  }
};
document.addEventListener('i18n', syncMailLink);
syncMailLink();
let lastSent = 0, sending = false;

const close = () => modal.classList.remove('open');
$('setReport').addEventListener('click', () => {
  if (!cloud.user) { toast(t('rpt.login')); return; }   // 沒登入：只提示，不開視窗
  $('setModal').classList.remove('open');
  modal.classList.add('open');
  subj.focus({ preventScroll: true });
});
$('rptClose').addEventListener('click', close);
modal.addEventListener('click', e => { if (e.target === modal) close(); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (sending) return;
  const user = cloud.user;
  if (!user) { toast(t('rpt.login')); return; }
  const title = subj.value.trim().slice(0, 100), text = body.value.trim().slice(0, 2000);
  if (!title || !text) { toast(t('rpt.empty')); return; }
  if (Date.now() - lastSent < COOLDOWN) { toast(t('rpt.wait')); return; }
  sending = true; send.disabled = true;
  try {
    const { fs, db } = await rankApi();
    await fs.addDoc(fs.collection(db, 'reports'), {
      t: title, b: text, u: user.uid,
      n: String(settings.nick || user.displayName || '').slice(0, 40),   // 顯示在管理員清單的名稱（暱稱優先；不含 email）
      ts: fs.serverTimestamp(), done: false,
    });
    lastSent = Date.now();
    subj.value = body.value = '';
    close(); toast(t('rpt.sent'));
  } catch (err) { console.error('report failed', err); toast(t('rpt.fail')); }
  finally { sending = false; send.disabled = false; }
});
