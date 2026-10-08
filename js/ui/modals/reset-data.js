/* 重置所有資料：需輸入 Untouchable11 才能確認 */
import { cancelPersist } from '../../storage/boards.js';
import { state, } from '../../state/state.js';
import { Store } from '../../storage/store.js';
import { $ } from '../dom.js';

// ---- 重置所有資料：需輸入 Untouchable11 才能確認 ----
const RESET_WORD = 'Untouchable11';
const resetModal = $('resetModal'), resetInput = $('resetInput'), resetConfirm = $('resetConfirm');
$('resetOpen').addEventListener('click', () => { resetInput.value = ''; resetConfirm.disabled = true; resetModal.classList.add('open'); resetInput.focus(); });
const closeReset = () => resetModal.classList.remove('open');
$('resetClose').addEventListener('click', closeReset);
$('resetCancel').addEventListener('click', closeReset);
resetModal.addEventListener('click', e => { if (e.target === resetModal) closeReset(); });
resetInput.addEventListener('input', () => { resetConfirm.disabled = resetInput.value.trim() !== RESET_WORD; });
resetInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !resetConfirm.disabled) resetConfirm.click(); });
resetConfirm.addEventListener('click', () => {
  if (resetInput.value.trim() !== RESET_WORD) return;
  state.wiping = true; cancelPersist();
  try { Object.keys(localStorage).filter(k => k.startsWith('untouchable11.')).forEach(k => localStorage.removeItem(k)); } catch (e) { /* 忽略 */ }
  Store.mem = {};
  location.reload();
});
