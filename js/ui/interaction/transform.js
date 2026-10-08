/* 旋轉 / 鏡像 / 收回目前選取的拼圖 */
import { Sfx } from '../../audio/sfx.js';
import { t } from '../../i18n/i18n.js';
import { toast } from '../toast.js';
import { orient } from '../../core/matrix.js';
import { PIECE } from '../../core/config.js';
import { evaluate } from '../../game/solve.js';
import { pushHistory } from '../../storage/history.js';
import { state, curPieces, dims, getP, shapeOf, clamp, clonePieces } from '../../state/state.js';
import { els } from '../dom.js';
import { renderBoard } from '../render-board.js';
import { renderTray } from '../render-tray.js';
import { updateGhost, movePreview } from './drag.js';

// 外框是 4×3 或 3×4 的拼圖，旋轉時繞「某一格」轉，這樣轉完位置不會亂跑。
// 回傳樞紐格在「旋轉前矩陣」中的區域座標 [x, y]：
//   橫放（4×3）：右轉 = 中心偏右那格、左轉 = 中心偏左那格（皆在中間那一列）
//   直放（3×4）：左右轉都用中心偏下那格（它正是橫放時樞紐格轉 90° 後的位置，所以左右轉能互相還原）
// 其他外框（如 5×2、6×1、3×3）不在此規則內，沿用以外框中心旋轉。
function pivotCell(p, dir, w, h) {
  if (!((w === 4 && h === 3) || (w === 3 && h === 4))) return null;
  if (w > h) return dir === 'cw' ? [w / 2, (h - 1) / 2] : [w / 2 - 1, (h - 1) / 2];
  return [(w - 1) / 2, h / 2];
}

// 左轉、右轉、鏡像目前選取的拼圖（kind = 'ccw' | 'cw' | 'flip'）
export function transformSelected(kind) {
  const p = getP(state.selected);
  if (!p) { toast(t('toast.pick')); return; }
  if (!p.placed && !state.drag) return; // 只處理方框中的拼圖，或拖曳中的拼圖
  const snap = (p.placed && !state.drag) ? clonePieces(curPieces()) : null; // 復原用快照
  const before = shapeOf(p), bw = before[0].length, bh = before.length, D = dims();

  if (kind === 'flip') {
    state.chain = null;
    // 鏡像：預設以「目前畫面」的左右翻轉。orient 是「先鏡向、再旋轉」，
    //   左右鏡像：flip 取反、rot 改成 (4 - rot)；上下鏡像：flip 取反、rot 改成 (2 - rot)。
    // 本身左右對稱的拼圖，左右翻會得到同樣的形狀（畫面看不出變化），
    //   這時改成上下翻（flip 取反、rot 改成 (2 - rot)）。
    const lrRot = (4 - p.rot) % 4;
    const unchanged = JSON.stringify(orient(PIECE[p.id].matrix, lrRot, !p.flip)) === JSON.stringify(before);
    p.flip = !p.flip;
    p.rot = unchanged ? (6 - p.rot) % 4 : lrRot;
  } else {
    const dir = kind;
    state.chain = (state.chain && state.chain.id === p.id && state.chain.dir === dir)
      ? { id:p.id, dir, n:state.chain.n + 1 } : { id:p.id, dir, n:1 };
    const pv = pivotCell(p, dir, bw, bh);
    p.rot = dir === 'cw' ? (p.rot + 1) % 4 : (p.rot + 3) % 4;
    const after = shapeOf(p), aw = after[0].length, ah = after.length;
    if (p.placed) {
      if (pv) {
        // 樞紐格在底板上的位置不動；算出它在新矩陣中的區域座標，再反推新的左上角
        const bx = p.x + pv[0], by = p.y + pv[1];
        const [nx, ny] = dir === 'cw' ? [bh - 1 - pv[1], pv[0]] : [pv[1], bw - 1 - pv[0]];
        p.x = bx - nx; p.y = by - ny;
        // 連續同方向轉了偶數次（2、4…）＝轉了 180°，整體會偏一格：右轉往左補一格，左轉往右補一格
        if (state.chain.n % 2 === 0) p.x += dir === 'cw' ? -1 : 1;
      } else {
        p.x = Math.round(p.x + (bw - aw) / 2);
        p.y = Math.round(p.y + (bh - ah) / 2);
      }
      p.x = clamp(p.x, 0, D.cols - aw);
      p.y = clamp(p.y, 0, D.rows - ah);
    }
  }
  if (snap) pushHistory(snap);
  if (kind === 'flip') Sfx.flip(); else Sfx.rotate();
  if (state.drag && state.drag.ghost) { updateGhost(); movePreview(); }
  renderBoard(); renderTray();
  if (p.placed) evaluate();
}

export function returnSelected() {
  const p = getP(state.selected);
  if (!p || !p.placed) return;
  pushHistory(clonePieces(curPieces()));
  state.chain = null;
  p.placed = false; p.rot = 0; p.flip = false; state.selected = null;
  Sfx.back();
  renderBoard(); renderTray();
}

// 選取拼圖旁的三個圖示
els.tools.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  if (b.dataset.act === 'return') returnSelected();
  else transformSelected(b.dataset.act);
});
