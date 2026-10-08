/* 重置版圖確認視窗 */
import { Sfx } from '../../audio/sfx.js';
import { t } from '../../i18n/i18n.js';
import { state, curPieces, freshPieces } from '../../state/state.js';
import { updateUndo } from '../../storage/history.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';
import { renderBoard } from '../render-board.js';
import { renderTray } from '../render-tray.js';

const brdModal = $('boardResetModal');
export function askResetBoard() {
  if (state.drag) return;
  if (!curPieces().some(p => p.placed)) { toast(t('toast.emptyBoard')); return; }
  brdModal.classList.add('open'); $('brdConfirm').focus();
}
function doResetBoard() {
  brdModal.classList.remove('open');
  state.boards[state.level] = freshPieces(state.level); state.selected = null; state.chain = null;
  state.hist[state.level] = []; updateUndo();   // 重置後一併清除該等級「返回上一步」的暫存紀錄
  renderBoard(); renderTray(); toast(t('toast.reset'));
  Sfx.clear();
}
$('btnReset').addEventListener('click', askResetBoard);
$('brdConfirm').addEventListener('click', doResetBoard);
$('brdCancel').addEventListener('click', () => brdModal.classList.remove('open'));
$('brdClose').addEventListener('click', () => brdModal.classList.remove('open'));
brdModal.addEventListener('click', e => { if (e.target === brdModal) brdModal.classList.remove('open'); });
