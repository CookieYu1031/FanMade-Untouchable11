/* 全面重畫 */
import { fitBoard, renderBoard } from './render-board.js';
import { renderTray } from './render-tray.js';
import { renderLevels } from './render-levels.js';
import { renderBook } from './render-book.js';

export function refresh() {
  fitBoard(); renderBoard(); renderTray(); renderLevels(); renderBook();
}
