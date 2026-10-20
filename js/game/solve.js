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

function collectNear(L, an) {
  let g = gridOf(an);
  if (state.rotated) g = rotateCW(rotateCW(rotateCW(g)));   // 還原成原始方向
  const sig = canonicalSig(g), disp = g.map(r => r.join('')).join('/');
  const book = loadBook();
  if (!addSolution(book, L.lv, sig, null, disp, settings.nick, true)) return;   // 已收錄過就不再提示
  saveBook(book); renderBook(); renderStats();
  toast(t('toast.near'));   // 不中斷解題，只提示
}
export function evaluate() {
  const L = curLevel(), an = analyze(curPieces());
  if (!an.solved) { if (L.near && isNear(an, curPieces().length)) collectNear(L, an); return; }
  let g = gridOf(an);
  if (state.rotated) g = rotateCW(rotateCW(rotateCW(g))); // 還原成簡報冊的原始方向再算簽章
  const sig = canonicalSig(g);
  const disp = g.map(r => r.join('')).join('/'); // 實際擺法（簡報冊原始方向）
  const book = loadBook();
  const typed = L.random ? typedOf(L).toUpperCase() : '';   // 隨機挑戰：玩家輸入的代碼與原代碼不同時（例如 GOOD）一併記下，解答冊標註成 GOOD(原代碼)
  const isNew = addSolution(book, L.lv, sig, null, disp, settings.nick, false, typed && typed !== curGroup(L) ? typed : null);
  if (isNew) saveBook(book);
  renderLevels(); renderBook();
  const list = book.levels[L.lv] || [], n = L.crown ? solvedGroups(L, list).size : list.length;   // 皇冠挑戰：第幾個皇冠
  const gt = curTag(L);   // 皇冠挑戰：「A組」；隨機挑戰：代碼
  renderBoard();
  toast(isNew ? t('toast.new', lvShort(L) + (gt ? ' ' + gt : ''), n) : t('toast.dup'));
  if (isNew) Sfx.solve();
}
