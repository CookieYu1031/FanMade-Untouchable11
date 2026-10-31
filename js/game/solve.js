/* 擺放變動後：檢查是否過關 / 近似解，收錄到解答冊 */
import { Sfx } from '../audio/sfx.js';
import { t } from '../i18n/i18n.js';
import { rotateCW } from '../core/matrix.js';
import { analyze, isNear } from './analyze.js';
import { gridOf, canonicalSig } from './signature.js';
import { loadBook, saveBook, addSolution } from '../storage/book.js';
import { settings } from '../state/settings.js';
import { state, curLevel, curPieces, lvShort, curGroup, curTag, typedOf, solvedGroups } from '../state/state.js';
import { toast } from '../ui/toast.js';
import { renderBoard } from '../ui/render-board.js';
import { renderLevels } from '../ui/render-levels.js';
import { renderBook } from '../ui/render-book.js';
import { renderStats } from '../ui/modals/stats.js';

// 盤面 → { sig 標準簽章, disp 實際擺法 }；一律還原成簡報冊的原始方向再計算
function solutionOf(an) {
  let g = gridOf(an);
  if (state.rotated) g = rotateCW(rotateCW(rotateCW(g)));
  return { sig: canonicalSig(g), disp: g.map(r => r.join('')).join('/') };
}
// 目前圖板是否為「正解，且這組解答已收錄在解答冊」：此時清除盤面不會損失任何東西（清除按鈕可免確認，見 ui/modals/board-reset.js）
export function isRecordedSolution() {
  const an = analyze(curPieces());
  if (!an.solved) return false;
  const { sig } = solutionOf(an);
  return (loadBook().levels[curLevel().lv] || []).some(it => it.sig === sig);
}
function collectNear(L, an) {
  const { sig, disp } = solutionOf(an);
  const book = loadBook();
  if (!addSolution(book, L.lv, sig, null, disp, settings.nick, true)) return;   // 已收錄過就不再提示
  saveBook(book); renderBook(); renderStats();
  toast(t('toast.near'));   // 不中斷解題，只提示
}
export function evaluate() {
  const L = curLevel(), an = analyze(curPieces());
  if (!an.solved) { if (L.near && isNear(an, curPieces().length)) collectNear(L, an); return; }
  const { sig, disp } = solutionOf(an);   // disp = 實際擺法（簡報冊原始方向）
  const book = loadBook();
  const typed = L.random ? typedOf(L).toUpperCase() : '';   // 隨機挑戰：玩家輸入的代碼與原代碼不同時（例如 GOOD）一併記下，解答冊標註成 GOOD(原代碼)
  const isNew = addSolution(book, L.lv, sig, null, disp, settings.nick, false, typed && typed !== curGroup(L) ? typed : null);
  if (isNew) saveBook(book);
  renderLevels(); renderBook();
  const list = book.levels[L.lv] || [], n = L.groups ? solvedGroups(L, list).size : list.length;   // 摘星挑戰：第幾顆星
  const gt = curTag(L);   // 摘星挑戰：星名（如「天樞」）；隨機挑戰：代碼
  renderBoard();
  toast(isNew ? t('toast.new', lvShort(L) + (gt ? ' ' + gt : ''), n) : t('toast.dup'));
  if (isNew) Sfx.solve();
}
