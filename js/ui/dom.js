/* DOM 取用 */

export const $ = id => document.getElementById(id);
export const els = {
  board: $('board'), gGrid: $('gGrid'), gPieces: $('gPieces'), gPreview: $('gPreview'), gOverlay: $('gOverlay'),
  wrap: $('boardWrap'), tray: $('tray'), title: $('levelTitle'),
  levels: $('levels'), bookInfo: $('bookInfo'), bookThumbs: $('bookThumbs'), toast: $('toast'), tools: $('pieceTools'),
};
