/* 重置版圖確認視窗 */
import { Sfx } from '../../audio/sfx.js';
import { isRecordedSolution } from '../../game/solve.js';
import { t } from '../../i18n/i18n.js';
import { state, freshPieces, boardKey } from '../../state/state.js';
import { updateUndo } from '../../storage/history.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';
import { renderBoard } from '../render-board.js';
import { renderTray } from '../render-tray.js';

const brdModal = $('boardResetModal');
export function askResetBoard() {
  if (state.drag) return;
  if (isRecordedSolution()) { doResetBoard(); return; }   // 正解且已收錄、之後沒有再動過：清掉不會損失任何東西，不必詢問
  brdModal.classList.add('open'); $('brdConfirm').focus();
}
function doResetBoard() {
  brdModal.classList.remove('open');
  state.boards[boardKey()] = freshPieces(state.level); state.selected = null; state.chain = null;   // 有拼圖組合的關卡：只重置目前這一組
  state.hist[boardKey()] = []; updateUndo();   // 重置後一併清除該等級「返回上一步」的暫存紀錄
  renderBoard(); renderTray(); toast(t('toast.reset'));
  Sfx.clear();
}
$('btnReset').addEventListener('click', askResetBoard);
$('brdConfirm').addEventListener('click', doResetBoard);
$('brdCancel').addEventListener('click', () => brdModal.classList.remove('open'));
$('brdClose').addEventListener('click', () => brdModal.classList.remove('open'));
brdModal.addEventListener('click', e => { if (e.target === brdModal) brdModal.classList.remove('open'); });
