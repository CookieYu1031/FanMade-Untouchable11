/* 返回上一步 */
import { state } from '../../state/state.js';
import { histOf } from '../../storage/history.js';
import { toast } from '../toast.js';
import { t } from '../../i18n/i18n.js';
import { $ } from '../dom.js';
import { renderBoard } from '../render-board.js';
import { renderTray } from '../render-tray.js';

export function undo() {
  if (state.drag) return;
  const h = histOf();
  if (!h.length) { toast(t('toast.noUndo')); return; }
  state.boards[state.level] = h.pop();
  state.selected = null; state.chain = null; state.solveInfo = null;
  renderBoard(); renderTray();
}
$('btnUndo').addEventListener('click', undo);
