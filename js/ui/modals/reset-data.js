/* 重置資料：勾選要清除的內容（快取 / 設定 / 解答 / 近似解），並輸入 Untouchable11 才能確認 */
import { cancelPersist, persistBoards } from '../../storage/boards.js';
import { loadBook, saveBookLocal } from '../../storage/book.js';
import { Store, KEY_BOARDS, KEY_UI, KEY_SET } from '../../storage/store.js';
import { cloud, clearCloud } from '../../cloud/sync.js';
import { state } from '../../state/state.js';
import { t } from '../../i18n/i18n.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';

const RESET_WORD = 'Untouchable11';
const resetModal = $('resetModal'), resetInput = $('resetInput'), resetConfirm = $('resetConfirm');
const checks = ['rstCache', 'rstSet', 'rstSol', 'rstNear'].map($);
const defaults = [true, true, false, false];   // 預設：清理快取、重置設定；解答與近似解預設不勾選
const canConfirm = () => resetInput.value.trim() === RESET_WORD && checks.some(c => c.checked);
const sync = () => { resetConfirm.disabled = !canConfirm(); };

$('resetOpen').addEventListener('click', () => {
  resetInput.value = ''; checks.forEach((c, i) => { c.checked = defaults[i]; }); sync();
  resetModal.classList.add('open'); resetInput.focus();
});
const closeReset = () => resetModal.classList.remove('open');
$('resetClose').addEventListener('click', closeReset);
$('resetCancel').addEventListener('click', closeReset);
resetModal.addEventListener('click', e => { if (e.target === resetModal) closeReset(); });
resetInput.addEventListener('input', sync);
checks.forEach(c => c.addEventListener('change', sync));
resetInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !resetConfirm.disabled) resetConfirm.click(); });
resetConfirm.addEventListener('click', async () => {
  if (!canConfirm()) return;
  const [cache, set, sol, near] = checks.map(c => c.checked);
  resetConfirm.disabled = true;
  // 已登入：先清雲端（失敗就中止，本機也不動，避免兩邊不一致）
  if (cloud.user && (set || sol || near)) {
    try { await clearCloud({ settings: set, exact: sol, near }); }
    catch (e) { console.error(e); toast(t('toast.cloudFail')); sync(); return; }
  }
  if (!cache) persistBoards();   // 不清快取：先把目前盤面存好，重新整理後才接得回來
  state.wiping = true; cancelPersist();
  if (cache) { Store.remove(KEY_BOARDS); Store.remove(KEY_UI); }
  if (set) Store.remove(KEY_SET);
  if (sol || near) {
    const b = loadBook();
    if (sol) b.levels = {};
    if (near) b.near = {};
    saveBookLocal(b);
  }
  location.reload();
});
